import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../utils/db';
import * as debtManager from '../utils/debtManager';
import { Debt, DebtStatus, DebtType } from '../types';
import { debtAccountId } from '../src/db/accounts';
import { DoubleEntryTransaction } from '../src/db/doubleEntryTypes';

describe('debtManager', () => {
  const mockDebt: Debt = {
    id: 'debt_1',
    type: DebtType.LENT,
    person: 'Test Person',
    amount: 1000,
    description: 'Test Loan',
    date: '2024-01-01',
    status: DebtStatus.OUTSTANDING
  };

  const mockWalletAccountId = 'acc_wallet_cash';

  beforeEach(async () => {
    // We clear tables using db methods
    await db.debts.clear();
    await db.debtInstallements.clear();
    await db.transactions_v2.clear();
    await db.transactionItems.clear(); // Legacy store
    await db.settings.clear();
    
    // Seed original debt
    await db.debts.add(mockDebt);
  });

  describe('saveDebtInstallment', () => {
    it('should add a new installment and create a double-entry transaction', async () => {
      await debtManager.saveDebtInstallment({
        installmentData: {
          debtId: mockDebt.id,
          amount: 500,
          date: '2024-01-02',
          note: 'Partial payment'
        },
        createTransaction: true,
        markAsSettled: false,
        walletAccountId: mockWalletAccountId,
        debtForInstallment: mockDebt,
        appFirstUseDateExists: false
      });

      // Verify installment added
      const installments = await db.debtInstallements.toArray();
      expect(installments).toHaveLength(1);
      expect(installments[0].amount).toBe(500);

      // Verify v2 transaction created
      const v2txs = await db.transactions_v2.toArray();
      expect(v2txs).toHaveLength(1);
      expect(v2txs[0].meta.kind).toBe('debt_payment');
      expect(v2txs[0].meta.debtInstallmentId).toBe(installments[0].id);
      expect(v2txs[0].entries[0].amount).toBe(500);

      // Verify NO legacy transaction created
      const legacyTxs = await db.transactionItems.toArray();
      expect(legacyTxs).toHaveLength(0);

      // Verify settings updated (appFirstUseDate)
      const firstUse = await db.settings.get('appFirstUseDate');
      expect(firstUse).toBeDefined();
    });

    it('should update an existing installment and its linked v2 transaction', async () => {
      // 1. Setup: add an installment first
      const installmentId = 'inst_1';
      await db.debtInstallements.add({
        id: installmentId,
        debtId: mockDebt.id,
        amount: 500,
        date: '2024-01-02',
        note: 'Initial note'
      });

      // Create a linked v2 transaction manually to simulate existing state
      const debtAccId = debtAccountId(mockDebt.id, 'lent');
      const existingTx: DoubleEntryTransaction = {
        id: 'tx_1',
        date: '2024-01-02',
        note: 'Payment received from Test Person',
        entries: [
          { accountId: mockWalletAccountId, type: 'debit', amount: 500 },
          { accountId: debtAccId, type: 'credit', amount: 500 }
        ],
        entryAccountIds: [mockWalletAccountId, debtAccId],
        meta: { kind: 'debt_payment', debtId: mockDebt.id, debtInstallmentId: installmentId },
        createdAt: new Date().toISOString()
      };
      await db.transactions_v2.add(existingTx);

      // 2. Action: Update it via debtManager
      await debtManager.saveDebtInstallment({
        installmentData: {
          id: installmentId,
          debtId: mockDebt.id,
          amount: 600, // Changed amount
          date: '2024-01-03', // Changed date
          note: 'Updated note'
        },
        createTransaction: true,
        markAsSettled: false,
        walletAccountId: mockWalletAccountId,
        debtForInstallment: mockDebt,
        appFirstUseDateExists: true
      });

      // 3. Verification
      const installment = await db.debtInstallements.get(installmentId);
      expect(installment?.amount).toBe(600);

      const v2tx = await db.transactions_v2.get('tx_1');
      expect(v2tx?.entries[0].amount).toBe(600);
      expect(v2tx?.entries[1].amount).toBe(600);
      expect(v2tx?.date).toBe('2024-01-03');
      expect(v2tx?.note).toContain('Test Person');
    });

    it('should create a surplus record when overpaid', async () => {
      await debtManager.saveDebtInstallment({
        installmentData: {
          debtId: mockDebt.id,
          amount: 1500, // Overpayment (original debt is 1000)
          date: '2024-01-05',
          note: 'Settling with extra cash'
        },
        createTransaction: true,
        markAsSettled: true,
        walletAccountId: mockWalletAccountId,
        createSurplusRecord: true,
        debtForInstallment: mockDebt,
        appFirstUseDateExists: true
      });

      // Verify surplus debt created
      const allDebts = await db.debts.toArray();
      expect(allDebts).toHaveLength(2);
      
      const surplusDebt = allDebts.find(d => d.id !== mockDebt.id);
      expect(surplusDebt).toBeDefined();
      expect(surplusDebt?.amount).toBe(500);
      expect(surplusDebt?.type).toBe(DebtType.OWED); // Inverse of original LENT
      
      // Original debt status should be SETTLED
      const updatedMockDebt = await db.debts.get(mockDebt.id);
      expect(updatedMockDebt?.status).toBe(DebtStatus.SETTLED);
    });
  });
});

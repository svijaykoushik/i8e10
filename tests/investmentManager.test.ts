import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../utils/db';
import * as investmentManager from '../utils/investmentManager';
import { Investment, InvestmentStatus, InvestmentTransactionType } from '../types';
import { investmentAccountId } from '../src/db/accounts';
import { DoubleEntryTransaction } from '../src/db/doubleEntryTypes';

describe('investmentManager', () => {
  const mockInvestment: Investment = {
    id: 'inv_1',
    name: 'Tesla Stocks',
    type: 'Stocks',
    startDate: '2024-01-01',
    currentValue: 1000,
    status: InvestmentStatus.ACTIVE
  };

  const mockWalletAccountId = 'acc_wallet_bank';

  beforeEach(async () => {
    await db.investments.clear();
    await db.investmentTransactions.clear();
    await db.transactions_v2.clear();
    await db.transactionItems.clear();
    await db.settings.clear();
    
    await db.investments.add(mockInvestment);
  });

  describe('saveInvestmentTransaction', () => {
    it('should add a new contribution and create a double-entry transaction', async () => {
      await investmentManager.saveInvestmentTransaction({
        transactionData: {
          investmentId: mockInvestment.id,
          type: InvestmentTransactionType.CONTRIBUTION,
          amount: 500,
          date: '2024-01-02'
        },
        createTransaction: true,
        walletAccountId: mockWalletAccountId,
        appFirstUseDateExists: false
      });

      // Verify investment transaction added
      const invTxs = await db.investmentTransactions.toArray();
      expect(invTxs).toHaveLength(1);
      expect(invTxs[0].amount).toBe(500);

      // Verify v2 transaction created
      const v2txs = await db.transactions_v2.toArray();
      expect(v2txs).toHaveLength(1);
      expect(v2txs[0].meta.kind).toBe('investment_buy');
      expect(v2txs[0].meta.investmentTransactionId).toBe(invTxs[0].id);

      // Verify entries
      const invAccId = investmentAccountId(mockInvestment.id);
      expect(v2txs[0].entries.find(e => e.accountId === invAccId)?.type).toBe('debit');
      expect(v2txs[0].entries.find(e => e.accountId === mockWalletAccountId)?.type).toBe('credit');
      expect(v2txs[0].entries[0].amount).toBe(500);
    });

    it('should update an existing withdrawal and its linked v2 transaction', async () => {
      // 1. Setup
      const invTxId = 'inv_tx_1';
      await db.investmentTransactions.add({
        id: invTxId,
        investmentId: mockInvestment.id,
        type: InvestmentTransactionType.WITHDRAWAL,
        amount: 200,
        date: '2024-01-03'
      });

      const invAccId = investmentAccountId(mockInvestment.id);
      const existingTx: DoubleEntryTransaction = {
        id: 'tx_1',
        date: '2024-01-03',
        note: 'Investment Withdrawal: Tesla Stocks',
        entries: [
          { accountId: mockWalletAccountId, type: 'debit', amount: 200 },
          { accountId: invAccId, type: 'credit', amount: 200 }
        ],
        entryAccountIds: [mockWalletAccountId, invAccId],
        meta: { 
          kind: 'investment_sell', 
          investmentId: mockInvestment.id, 
          investmentTransactionId: invTxId 
        },
        createdAt: new Date().toISOString()
      };
      await db.transactions_v2.add(existingTx);

      // 2. Action
      await investmentManager.saveInvestmentTransaction({
        transactionData: {
          id: invTxId,
          investmentId: mockInvestment.id,
          type: InvestmentTransactionType.WITHDRAWAL,
          amount: 300,
          date: '2024-01-04'
        },
        createTransaction: true,
        walletAccountId: mockWalletAccountId,
        appFirstUseDateExists: true
      });

      // 3. Verify
      const invTx = await db.investmentTransactions.get(invTxId);
      expect(invTx?.amount).toBe(300);

      const v2tx = await db.transactions_v2.get('tx_1');
      expect(v2tx?.entries[0].amount).toBe(300);
      expect(v2tx?.entries[1].amount).toBe(300);
      expect(v2tx?.date).toBe('2024-01-04');
    });

    it('should handle dividends correctly', async () => {
       await investmentManager.saveInvestmentTransaction({
        transactionData: {
          investmentId: mockInvestment.id,
          type: InvestmentTransactionType.DIVIDEND,
          amount: 50,
          date: '2024-01-10'
        },
        createTransaction: true,
        walletAccountId: mockWalletAccountId,
        appFirstUseDateExists: true
      });

      const v2txs = await db.transactions_v2.toArray();
      const divTx = v2txs.find(t => t.meta.kind === 'investment_dividend');
      expect(divTx).toBeDefined();
      expect(divTx?.entries.find(e => e.accountId === 'acc_income')?.type).toBe('credit');
      expect(divTx?.entries.find(e => e.accountId === mockWalletAccountId)?.type).toBe('debit');
    });
  });
});

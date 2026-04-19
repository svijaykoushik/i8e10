import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../utils/db';
import { runMigrationV3, isMigrationComplete } from '../utils/migrationV3';
import { Transaction, TransactionType, Debt, DebtType, DebtStatus, Investment, InvestmentStatus } from '../types';

describe('migrationV3', () => {
  beforeEach(async () => {
    // Clear all stores
    await db.settings.clear();
    await db.accounts.clear();
    await db.transactions_v2.clear();
    await db.transactionItems.clear();
    await db.debts.clear();
    await db.debtInstallements.clear();
    await db.investments.clear();
    await db.investmentTransactions.clear();
  });

  it('should initially report migration as incomplete', async () => {
    expect(await isMigrationComplete()).toBe(false);
  });

  it('should migrate settings and mark migration complete', async () => {
    await db.settings.put({ key: 'wallets', value: ['My Cash', 'My Bank'] });
    await db.settings.put({ key: 'defaultWallet', value: 'My Cash' });

    await runMigrationV3();

    expect(await isMigrationComplete()).toBe(true);

    const accounts = await db.accounts.toArray();
    const myCashAccount = accounts.find(a => a.name === 'My Cash');
    expect(myCashAccount).toBeDefined();

    const newDefault = await db.settings.get('defaultWallet');
    expect(newDefault?.value).toBe(myCashAccount?.id);
  });

  it('should convert simple transactions', async () => {
    await db.settings.put({ key: 'wallets', value: ['Cash'] });
    
    await db.transactionItems.bulkAdd([
      {
        id: 'tx1',
        type: TransactionType.EXPENSE,
        amount: 100,
        date: '2024-01-01',
        description: 'Food',
        wallet: 'Cash',
        isReconciliation: false
      },
      {
        id: 'tx2',
        type: TransactionType.INCOME,
        amount: 500,
        date: '2024-01-02',
        description: 'Salary',
        wallet: 'Cash',
        isReconciliation: false
      }
    ]);

    await runMigrationV3();

    const txns = await db.transactions_v2.toArray();
    expect(txns).toHaveLength(2);

    const expense = txns.find(t => t.meta?.kind === 'expense');
    expect(expense).toBeDefined();
    expect(expense?.entries[0].amount).toBe(100);

    const income = txns.find(t => t.meta?.kind === 'income');
    expect(income).toBeDefined();
    expect(income?.entries[0].amount).toBe(500);
  });

  it('should group transfers', async () => {
    await db.settings.put({ key: 'wallets', value: ['Bank', 'Cash'] });
    
    await db.transactionItems.bulkAdd([
      {
        id: 'tx1',
        type: TransactionType.EXPENSE,
        amount: 200,
        date: '2024-01-01',
        description: 'Transfer Out',
        wallet: 'Bank',
        isReconciliation: false,
        transferId: 'tr1'
      },
      {
        id: 'tx2',
        type: TransactionType.INCOME,
        amount: 200,
        date: '2024-01-01',
        description: 'Transfer In',
        wallet: 'Cash',
        isReconciliation: false,
        transferId: 'tr1'
      }
    ]);

    await runMigrationV3();

    const txns = await db.transactions_v2.toArray();
    // Transfer should be grouped into a single double-entry transaction
    expect(txns).toHaveLength(1);
    expect(txns[0].meta?.kind).toBe('transfer');
    expect(txns[0].entries).toHaveLength(2);
    
    const debit = txns[0].entries.find(e => e.type === 'debit');
    const credit = txns[0].entries.find(e => e.type === 'credit');
    
    const accounts = await db.accounts.toArray();
    const bankAcc = accounts.find(a => a.name === 'Bank');
    const cashAcc = accounts.find(a => a.name === 'Cash');

    expect(debit?.accountId).toBe(cashAcc?.id);
    expect(credit?.accountId).toBe(bankAcc?.id);
  });

  it('should migrate debts and related transactions', async () => {
    const debtId = 'd1';
    await db.debts.add({
      id: debtId,
      type: DebtType.OWED,
      person: 'John',
      amount: 1000,
      date: '2024-01-01',
      description: 'Borrowed',
      status: DebtStatus.OUTSTANDING
    } as Debt);

    await db.transactionItems.add({
      id: 'tx1',
      type: TransactionType.INCOME,
      amount: 1000,
      date: '2024-01-01',
      description: 'Borrowed',
      wallet: 'Cash',
      isReconciliation: false,
      debtId
    } as Transaction);

    await runMigrationV3();

    const accounts = await db.accounts.toArray();
    const debtAcc = accounts.find(a => a.type === 'liability' && a.subtype === 'debt_payable');
    expect(debtAcc).toBeDefined();

    const txns = await db.transactions_v2.toArray();
    expect(txns).toHaveLength(1);
    expect(txns[0].meta?.kind).toBe('debt_create');
    expect(txns[0].meta?.debtId).toBe(debtId);
  });
});

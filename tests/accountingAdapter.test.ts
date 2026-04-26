import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../utils/db';
import * as accountingAdapter from '../utils/accountingAdapter';
import { SYSTEM_ACCOUNT_IDS, debtAccountId, investmentAccountId } from '../src/db/accounts';
import { TransactionEntry } from '../src/db/doubleEntryTypes';

describe('accountingAdapter', () => {
  beforeEach(async () => {
    // Clear the transaction store before each test
    await db.transactions_v2.clear();
  });

  const expectBalanced = (entries: TransactionEntry[]) => {
    const totalDebits = entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const totalCredits = entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
    expect(totalDebits).toBe(totalCredits);
  };

  describe('recordExpense', () => {
    it('should create an expense transaction debiting expense and crediting wallet', async () => {
      const txn = await accountingAdapter.recordExpense({
        amount: 100,
        date: '2024-01-01',
        description: 'Groceries',
        walletAccountId: 'acc_wallet_cash'
      });

      expect(txn.meta.kind).toBe('expense');
      expect(txn.entries).toHaveLength(2);
      expectBalanced(txn.entries);
      
      const debit = txn.entries.find(e => e.type === 'debit');
      const credit = txn.entries.find(e => e.type === 'credit');
      
      expect(debit?.accountId).toBe(SYSTEM_ACCOUNT_IDS.EXPENSE);
      expect(credit?.accountId).toBe('acc_wallet_cash');

      const savedTxn = await db.transactions_v2.get(txn.id);
      expect(savedTxn).toBeDefined();
    });
  });

  describe('recordIncome', () => {
    it('should create an income transaction debiting wallet and crediting income', async () => {
      const txn = await accountingAdapter.recordIncome({
        amount: 500,
        date: '2024-01-02',
        description: 'Salary',
        walletAccountId: 'acc_wallet_bank'
      });

      expect(txn.meta.kind).toBe('income');
      expectBalanced(txn.entries);

      const debit = txn.entries.find(e => e.type === 'debit');
      const credit = txn.entries.find(e => e.type === 'credit');

      expect(debit?.accountId).toBe('acc_wallet_bank');
      expect(credit?.accountId).toBe(SYSTEM_ACCOUNT_IDS.INCOME);
    });
  });

  describe('recordTransfer', () => {
    it('should create a transfer transaction debiting destination and crediting source', async () => {
      const txn = await accountingAdapter.recordTransfer({
        amount: 200,
        date: '2024-01-03',
        fromWalletAccountId: 'acc_wallet_bank',
        toWalletAccountId: 'acc_wallet_cash',
        description: 'ATM Withdrawal'
      });

      expect(txn.meta.kind).toBe('transfer');
      expectBalanced(txn.entries);

      const debit = txn.entries.find(e => e.type === 'debit');
      const credit = txn.entries.find(e => e.type === 'credit');

      expect(debit?.accountId).toBe('acc_wallet_cash');
      expect(credit?.accountId).toBe('acc_wallet_bank');
    });
  });

  describe('recordDebtCreation', () => {
    it('should create an owed debt transaction', async () => {
      const txn = await accountingAdapter.recordDebtCreation({
        debtId: 'debt_1',
        debtType: 'owed',
        amount: 1000,
        date: '2024-01-04',
        description: 'Borrowed from friend',
        walletAccountId: 'acc_wallet_cash',
        createTransaction: true
      });

      expect(txn).toBeDefined();
      if (!txn) return;

      expect(txn.meta.kind).toBe('debt_create');
      expectBalanced(txn.entries);

      const debit = txn.entries.find(e => e.type === 'debit');
      const credit = txn.entries.find(e => e.type === 'credit');

      expect(debit?.accountId).toBe('acc_wallet_cash');
      expect(credit?.accountId).toBe(debtAccountId('debt_1', 'owed'));
    });

    it('should return null if createTransaction is false', async () => {
      const txn = await accountingAdapter.recordDebtCreation({
        debtId: 'debt_2',
        debtType: 'lent',
        amount: 500,
        date: '2024-01-05',
        description: 'Lent to friend',
        walletAccountId: 'acc_wallet_cash',
        createTransaction: false
      });

      expect(txn).toBeNull();
    });
  });

  describe('recordInvestmentBuy', () => {
    it('should create an investment buy transaction', async () => {
      const txn = await accountingAdapter.recordInvestmentBuy({
        investmentId: 'inv_1',
        amount: 10000,
        date: '2024-01-06',
        description: 'Bought stocks',
        walletAccountId: 'acc_wallet_bank'
      });

      expect(txn.meta.kind).toBe('investment_buy');
      expectBalanced(txn.entries);

      const debit = txn.entries.find(e => e.type === 'debit');
      const credit = txn.entries.find(e => e.type === 'credit');

      expect(debit?.accountId).toBe(investmentAccountId('inv_1'));
      expect(credit?.accountId).toBe('acc_wallet_bank');
    });
  });

  describe('recordAdjustment', () => {
    it('should handle positive adjustment', async () => {
      const txn = await accountingAdapter.recordAdjustment({
        walletAccountId: 'acc_wallet_cash',
        amount: 50,
        date: '2024-01-07',
      });

      expect(txn.meta.kind).toBe('adjustment');
      expectBalanced(txn.entries);

      const debit = txn.entries.find(e => e.type === 'debit');
      const credit = txn.entries.find(e => e.type === 'credit');

      expect(debit?.accountId).toBe('acc_wallet_cash');
      expect(credit?.accountId).toBe(SYSTEM_ACCOUNT_IDS.EQUITY_OPENING);
    });

    it('should handle negative adjustment', async () => {
      const txn = await accountingAdapter.recordAdjustment({
        walletAccountId: 'acc_wallet_cash',
        amount: -30,
        date: '2024-01-08',
      });

      expect(txn.meta.kind).toBe('adjustment');
      expectBalanced(txn.entries);

      const debit = txn.entries.find(e => e.type === 'debit');
      const credit = txn.entries.find(e => e.type === 'credit');

      expect(debit?.accountId).toBe(SYSTEM_ACCOUNT_IDS.EQUITY_OPENING);
      expect(credit?.accountId).toBe('acc_wallet_cash');
      // Amounts should be strictly positive absolute values in entries
      expect(debit?.amount).toBe(30);
      expect(credit?.amount).toBe(30);
    });
  });

  describe('updateTransaction and deleteTransaction', () => {
    it('should update and delete an existing transaction', async () => {
      const txn = await accountingAdapter.recordExpense({
        amount: 100,
        date: '2024-01-01',
        description: 'Initial',
        walletAccountId: 'acc_wallet_cash'
      });

      txn.note = 'Updated Note';
      await accountingAdapter.updateTransaction(txn);

      const updatedTxn = await db.transactions_v2.get(txn.id);
      expect(updatedTxn?.note).toBe('Updated Note');

      await accountingAdapter.deleteTransaction(txn.id);
      const deletedTxn = await db.transactions_v2.get(txn.id);
      expect(deletedTxn).toBeUndefined();
    });
  });
});

/**
 * Tests for balanceCalculator — pure functions, no DB dependency.
 */
import { describe, it, expect } from 'vitest';
import {
  computeAccountBalance,
  computeWalletBalance,
  computeTotalWalletBalance,
  computeNetWorth,
  computePeriodicFlow,
  computeDebtBalance,
  computeInvestmentBalance,
} from '../utils/balanceCalculator';
import type { DoubleEntryTransaction } from '../src/db/doubleEntryTypes';
import type { Account } from '../src/db/accounts';

// --- Helpers ---

function makeTxn(
  entries: Array<{ accountId: string; type: 'debit' | 'credit'; amount: number }>,
  kind: string = 'expense',
  date: string = '2025-06-15',
  meta: Record<string, any> = {}
): DoubleEntryTransaction {
  return {
    id: `txn_${Math.random().toString(36).slice(2)}`,
    date,
    note: 'test',
    entries,
    entryAccountIds: [...new Set(entries.map((e) => e.accountId))],
    meta: { kind: kind as any, ...meta },
    createdAt: new Date().toISOString(),
  };
}

function makeAccount(
  id: string,
  type: 'asset' | 'liability' | 'income' | 'expense' | 'equity',
  subtype?: string
): Account {
  return { id, name: id, type, subtype, isActive: true, createdAt: '' };
}

// --- Tests ---

describe('computeAccountBalance', () => {
  it('asset account: debits - credits', () => {
    const txns = [
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 100 },
        { accountId: 'acc_income', type: 'credit', amount: 100 },
      ], 'income'),
      makeTxn([
        { accountId: 'acc_expense', type: 'debit', amount: 30 },
        { accountId: 'wallet_1', type: 'credit', amount: 30 },
      ], 'expense'),
    ];
    expect(computeAccountBalance(txns, 'wallet_1', 'asset')).toBe(70);
  });

  it('liability account: credits - debits', () => {
    const txns = [
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 500 },
        { accountId: 'acc_debt_payable_1', type: 'credit', amount: 500 },
      ], 'debt_create'),
      makeTxn([
        { accountId: 'acc_debt_payable_1', type: 'debit', amount: 200 },
        { accountId: 'wallet_1', type: 'credit', amount: 200 },
      ], 'debt_payment'),
    ];
    expect(computeAccountBalance(txns, 'acc_debt_payable_1', 'liability')).toBe(300);
  });

  it('income account: credits - debits', () => {
    const txns = [
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 1000 },
        { accountId: 'acc_income', type: 'credit', amount: 1000 },
      ], 'income'),
    ];
    expect(computeAccountBalance(txns, 'acc_income', 'income')).toBe(1000);
  });

  it('expense account: debits - credits', () => {
    const txns = [
      makeTxn([
        { accountId: 'acc_expense', type: 'debit', amount: 250 },
        { accountId: 'wallet_1', type: 'credit', amount: 250 },
      ], 'expense'),
    ];
    expect(computeAccountBalance(txns, 'acc_expense', 'expense')).toBe(250);
  });

  it('date range filtering', () => {
    const txns = [
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 100 },
        { accountId: 'acc_income', type: 'credit', amount: 100 },
      ], 'income', '2025-01-15'),
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 200 },
        { accountId: 'acc_income', type: 'credit', amount: 200 },
      ], 'income', '2025-06-15'),
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 300 },
        { accountId: 'acc_income', type: 'credit', amount: 300 },
      ], 'income', '2025-12-15'),
    ];
    const result = computeAccountBalance(txns, 'wallet_1', 'asset', {
      start: new Date('2025-06-01'),
      end: new Date('2025-06-30'),
    });
    expect(result).toBe(200);
  });

  it('empty transactions returns zero', () => {
    expect(computeAccountBalance([], 'wallet_1', 'asset')).toBe(0);
  });
});

describe('computeTotalWalletBalance', () => {
  it('asset wallets positive, liability wallets subtracted', () => {
    const txns = [
      // Cash wallet receives 1000
      makeTxn([
        { accountId: 'wallet_cash', type: 'debit', amount: 1000 },
        { accountId: 'acc_income', type: 'credit', amount: 1000 },
      ], 'income'),
      // Credit card used for 300 (liability increases)
      makeTxn([
        { accountId: 'acc_expense', type: 'debit', amount: 300 },
        { accountId: 'wallet_cc', type: 'credit', amount: 300 },
      ], 'expense'),
    ];

    const wallets: Account[] = [
      makeAccount('wallet_cash', 'asset', 'wallet'),
      makeAccount('wallet_cc', 'liability', 'wallet'),
    ];

    // Cash = 1000 (asset: debits - credits)
    // CC = 300 (liability: credits - debits) → subtracted
    // Total = 1000 - 300 = 700
    expect(computeTotalWalletBalance(txns, wallets)).toBe(700);
  });
});

describe('computeNetWorth', () => {
  it('aggregates assets and liabilities correctly', () => {
    const txns = [
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 5000 },
        { accountId: 'acc_income', type: 'credit', amount: 5000 },
      ], 'income'),
      makeTxn([
        { accountId: 'acc_investment_1', type: 'debit', amount: 2000 },
        { accountId: 'wallet_1', type: 'credit', amount: 2000 },
      ], 'investment_buy'),
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 1000 },
        { accountId: 'acc_debt_payable_1', type: 'credit', amount: 1000 },
      ], 'debt_create'),
    ];

    const accounts: Account[] = [
      makeAccount('wallet_1', 'asset', 'wallet'),
      makeAccount('acc_investment_1', 'asset', 'investment'),
      makeAccount('acc_debt_payable_1', 'liability', 'debt_payable'),
      makeAccount('acc_income', 'income'),
      makeAccount('acc_expense', 'expense'),
    ];

    const result = computeNetWorth(accounts, txns);
    // wallet_1: 5000 - 2000 + 1000 = 4000 (asset)
    // investment: 2000 (asset)
    // debt: 1000 (liability)
    expect(result.totalAssets).toBe(6000);
    expect(result.totalLiabilities).toBe(1000);
    expect(result.netWorth).toBe(5000);
  });
});

describe('computePeriodicFlow', () => {
  it('computes income and expense within date range', () => {
    const txns = [
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 3000 },
        { accountId: 'acc_income', type: 'credit', amount: 3000 },
      ], 'income', '2025-06-10'),
      makeTxn([
        { accountId: 'acc_expense', type: 'debit', amount: 800 },
        { accountId: 'wallet_1', type: 'credit', amount: 800 },
      ], 'expense', '2025-06-20'),
    ];

    const result = computePeriodicFlow(txns, {
      start: new Date('2025-06-01'),
      end: new Date('2025-06-30'),
    });
    expect(result.income).toBe(3000);
    expect(result.expense).toBe(800);
    expect(result.netFlow).toBe(2200);
  });

  it('excludes specified transaction kinds', () => {
    const txns = [
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 3000 },
        { accountId: 'acc_income', type: 'credit', amount: 3000 },
      ], 'income', '2025-06-10'),
      makeTxn([
        { accountId: 'wallet_2', type: 'debit', amount: 500 },
        { accountId: 'wallet_1', type: 'credit', amount: 500 },
      ], 'transfer', '2025-06-15'),
    ];

    const result = computePeriodicFlow(
      txns,
      { start: new Date('2025-06-01'), end: new Date('2025-06-30') },
      ['transfer']
    );
    expect(result.income).toBe(3000);
    expect(result.expense).toBe(0);
  });
});

describe('computeDebtBalance', () => {
  it('computes outstanding debt (owed)', () => {
    const txns = [
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 1000 },
        { accountId: 'acc_debt_payable_d1', type: 'credit', amount: 1000 },
      ], 'debt_create'),
      makeTxn([
        { accountId: 'acc_debt_payable_d1', type: 'debit', amount: 400 },
        { accountId: 'wallet_1', type: 'credit', amount: 400 },
      ], 'debt_payment'),
    ];
    expect(computeDebtBalance(txns, 'd1', 'owed')).toBe(600);
  });

  it('computes outstanding debt (lent)', () => {
    const txns = [
      makeTxn([
        { accountId: 'acc_debt_receivable_d2', type: 'debit', amount: 500 },
        { accountId: 'wallet_1', type: 'credit', amount: 500 },
      ], 'debt_create'),
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 200 },
        { accountId: 'acc_debt_receivable_d2', type: 'credit', amount: 200 },
      ], 'debt_payment'),
    ];
    expect(computeDebtBalance(txns, 'd2', 'lent')).toBe(300);
  });
});

describe('computeInvestmentBalance', () => {
  it('computes investment value from buy/sell', () => {
    const txns = [
      makeTxn([
        { accountId: 'acc_investment_inv1', type: 'debit', amount: 2000 },
        { accountId: 'wallet_1', type: 'credit', amount: 2000 },
      ], 'investment_buy'),
      makeTxn([
        { accountId: 'wallet_1', type: 'debit', amount: 500 },
        { accountId: 'acc_investment_inv1', type: 'credit', amount: 500 },
      ], 'investment_sell'),
    ];
    expect(computeInvestmentBalance(txns, 'inv1')).toBe(1500);
  });
});

/**
 * Tests for transactionPresenter — pure functions, no DB dependency.
 */
import { describe, it, expect } from 'vitest';
import { presentForUI, presentAllForUI } from '../utils/transactionPresenter';
import type { DoubleEntryTransaction } from '../src/db/doubleEntryTypes';
import type { Account } from '../src/db/accounts';

// --- Helpers ---

function makeTxn(
  entries: Array<{ accountId: string; type: 'debit' | 'credit'; amount: number }>,
  kind: string,
  date: string = '2025-06-15',
  meta: Record<string, any> = {}
): DoubleEntryTransaction {
  return {
    id: `txn_${Math.random().toString(36).slice(2)}`,
    date,
    note: 'Test note',
    entries,
    entryAccountIds: [...new Set(entries.map((e) => e.accountId))],
    meta: { kind: kind as any, ...meta },
    createdAt: new Date().toISOString(),
  };
}

function buildAccountMap(accounts: Array<{ id: string; name: string; type: string; subtype?: string }>): Map<string, Account> {
  const map = new Map<string, Account>();
  for (const a of accounts) {
    map.set(a.id, {
      id: a.id,
      name: a.name,
      type: a.type as any,
      subtype: a.subtype,
      isActive: true,
      createdAt: '',
    });
  }
  return map;
}

const defaultAccountMap = buildAccountMap([
  { id: 'acc_wallet_cash', name: 'Cash', type: 'asset', subtype: 'wallet' },
  { id: 'acc_wallet_bank', name: 'Bank', type: 'asset', subtype: 'wallet' },
  { id: 'acc_credit_card', name: 'Credit Card', type: 'liability', subtype: 'wallet' },
  { id: 'acc_expense', name: 'Expense', type: 'expense' },
  { id: 'acc_income', name: 'Income', type: 'income' },
  { id: 'acc_equity_opening', name: 'Opening Balance', type: 'equity' },
  { id: 'acc_debt_payable_d1', name: 'Payable — Alice', type: 'liability', subtype: 'debt_payable' },
  { id: 'acc_debt_receivable_d2', name: 'Receivable — Bob', type: 'asset', subtype: 'debt_receivable' },
  { id: 'acc_investment_inv1', name: 'Investment — Stocks', type: 'asset', subtype: 'investment' },
]);

// --- Tests ---

describe('presentForUI', () => {
  it('expense kind → type: expense', () => {
    const txn = makeTxn([
      { accountId: 'acc_expense', type: 'debit', amount: 50 },
      { accountId: 'acc_wallet_cash', type: 'credit', amount: 50 },
    ], 'expense');

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('expense');
    expect(result.amount).toBe(50);
    expect(result.wallet).toBe('Cash');
    expect(result.description).toBe('Test note');
  });

  it('income kind → type: income', () => {
    const txn = makeTxn([
      { accountId: 'acc_wallet_cash', type: 'debit', amount: 1000 },
      { accountId: 'acc_income', type: 'credit', amount: 1000 },
    ], 'income');

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('income');
    expect(result.amount).toBe(1000);
    expect(result.wallet).toBe('Cash');
  });

  it('transfer kind → type: expense', () => {
    const txn = makeTxn([
      { accountId: 'acc_wallet_bank', type: 'debit', amount: 200 },
      { accountId: 'acc_wallet_cash', type: 'credit', amount: 200 },
    ], 'transfer', '2025-06-15', { transferId: 'tf_1' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('expense');
    expect(result.transferId).toBe('tf_1');
  });

  it('credit_card_payment kind → type: expense', () => {
    const txn = makeTxn([
      { accountId: 'acc_credit_card', type: 'debit', amount: 300 },
      { accountId: 'acc_wallet_cash', type: 'credit', amount: 300 },
    ], 'credit_card_payment');

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('expense');
    expect(result.wallet).toBe('Credit Card');
  });

  it('adjustment kind → isReconciliation: true', () => {
    const txn = makeTxn([
      { accountId: 'acc_wallet_cash', type: 'debit', amount: 100 },
      { accountId: 'acc_equity_opening', type: 'credit', amount: 100 },
    ], 'adjustment', '2025-06-15', { isReconciliation: true });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.isReconciliation).toBe(true);
    expect(result.type).toBe('income'); // positive adjustment = wallet debit = income-like
  });

  it('debt_create (owed) → type: income (wallet receives)', () => {
    const txn = makeTxn([
      { accountId: 'acc_wallet_cash', type: 'debit', amount: 500 },
      { accountId: 'acc_debt_payable_d1', type: 'credit', amount: 500 },
    ], 'debt_create', '2025-06-15', { debtId: 'd1' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('income');
    expect(result.debtId).toBe('d1');
  });

  it('debt_create (lent) → type: expense (wallet gives)', () => {
    const txn = makeTxn([
      { accountId: 'acc_debt_receivable_d2', type: 'debit', amount: 500 },
      { accountId: 'acc_wallet_cash', type: 'credit', amount: 500 },
    ], 'debt_create', '2025-06-15', { debtId: 'd2' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('expense');
  });

  it('debt_payment (owed, paying back) → type: expense', () => {
    const txn = makeTxn([
      { accountId: 'acc_debt_payable_d1', type: 'debit', amount: 200 },
      { accountId: 'acc_wallet_cash', type: 'credit', amount: 200 },
    ], 'debt_payment', '2025-06-15', { debtId: 'd1' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('expense');
  });

  it('debt_payment (lent, receiving back) → type: income', () => {
    const txn = makeTxn([
      { accountId: 'acc_wallet_cash', type: 'debit', amount: 200 },
      { accountId: 'acc_debt_receivable_d2', type: 'credit', amount: 200 },
    ], 'debt_payment', '2025-06-15', { debtId: 'd2' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('income');
  });

  it('investment_buy → type: expense', () => {
    const txn = makeTxn([
      { accountId: 'acc_investment_inv1', type: 'debit', amount: 2000 },
      { accountId: 'acc_wallet_cash', type: 'credit', amount: 2000 },
    ], 'investment_buy', '2025-06-15', { investmentId: 'inv1' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('expense');
  });

  it('investment_sell → type: income', () => {
    const txn = makeTxn([
      { accountId: 'acc_wallet_cash', type: 'debit', amount: 500 },
      { accountId: 'acc_investment_inv1', type: 'credit', amount: 500 },
    ], 'investment_sell', '2025-06-15', { investmentId: 'inv1' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('income');
  });

  it('investment_dividend → type: income', () => {
    const txn = makeTxn([
      { accountId: 'acc_wallet_cash', type: 'debit', amount: 100 },
      { accountId: 'acc_income', type: 'credit', amount: 100 },
    ], 'investment_dividend', '2025-06-15', { investmentId: 'inv1' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('income');
  });

  it('debt_waive (owed) → type: income', () => {
    const txn = makeTxn([
      { accountId: 'acc_debt_payable_d1', type: 'debit', amount: 500 },
      { accountId: 'acc_income', type: 'credit', amount: 500 },
    ], 'debt_waive', '2025-06-15', { debtId: 'd1' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('income');
  });

  it('debt_waive (lent) → type: expense', () => {
    const txn = makeTxn([
      { accountId: 'acc_expense', type: 'debit', amount: 500 },
      { accountId: 'acc_debt_receivable_d2', type: 'credit', amount: 500 },
    ], 'debt_waive', '2025-06-15', { debtId: 'd2' });

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.type).toBe('expense');
  });

  it('wallet name resolved from accountMap', () => {
    const txn = makeTxn([
      { accountId: 'acc_wallet_bank', type: 'debit', amount: 100 },
      { accountId: 'acc_income', type: 'credit', amount: 100 },
    ], 'income');

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.wallet).toBe('Bank');
  });

  it('missing account → graceful fallback (undefined wallet)', () => {
    const txn = makeTxn([
      { accountId: 'acc_nonexistent', type: 'debit', amount: 100 },
      { accountId: 'acc_income', type: 'credit', amount: 100 },
    ], 'income');

    const result = presentForUI(txn, defaultAccountMap);
    expect(result.wallet).toBeUndefined();
  });
});

describe('presentAllForUI', () => {
  it('batch conversion of multiple transactions', () => {
    const txns = [
      makeTxn([
        { accountId: 'acc_expense', type: 'debit', amount: 50 },
        { accountId: 'acc_wallet_cash', type: 'credit', amount: 50 },
      ], 'expense'),
      makeTxn([
        { accountId: 'acc_wallet_cash', type: 'debit', amount: 100 },
        { accountId: 'acc_income', type: 'credit', amount: 100 },
      ], 'income'),
    ];

    const results = presentAllForUI(txns, defaultAccountMap);
    expect(results).toHaveLength(2);
    expect(results[0].type).toBe('expense');
    expect(results[1].type).toBe('income');
  });
});

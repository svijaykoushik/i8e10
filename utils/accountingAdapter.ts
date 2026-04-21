/**
 * Accounting Adapter — the bridge between the intent-driven UI and the double-entry model.
 *
 * Each function accepts the same parameters the current CRUD handlers use,
 * internally creates balanced double-entry transactions, validates them,
 * and writes to transactions_v2.
 */

import { db } from './db';
import type { DoubleEntryTransaction, TransactionEntry, TransactionKind } from '../src/db/doubleEntryTypes';
import { validateBalancedEntries, extractEntryAccountIds } from '../src/db/doubleEntryTypes';
import { Account, SYSTEM_ACCOUNT_IDS, debtAccountId, investmentAccountId } from '../src/db/accounts';
import { presentAllForUI } from './transactionPresenter';
import type { Transaction } from '../types';

// --- Helpers ---

function generateId(): string {
  return crypto.randomUUID();
}

function createTransaction(
  date: string,
  note: string,
  entries: TransactionEntry[],
  kind: TransactionKind,
  meta: Partial<DoubleEntryTransaction['meta']> = {}
): DoubleEntryTransaction {
  validateBalancedEntries(entries);

  return {
    id: generateId(),
    date,
    note,
    entries,
    entryAccountIds: extractEntryAccountIds(entries),
    meta: { kind, ...meta },
    createdAt: new Date().toISOString(),
  };
}

async function saveTransaction(txn: DoubleEntryTransaction): Promise<DoubleEntryTransaction> {
  await db.transactions_v2.add(txn);
  return txn;
}

// --- Public API ---

/**
 * Record an expense.
 * Debit → acc_expense, Credit → walletAccountId
 */
export async function recordExpense(params: {
  amount: number;
  date: string;
  description: string;
  walletAccountId: string;
}): Promise<DoubleEntryTransaction> {
  const entries: TransactionEntry[] = [
    { accountId: SYSTEM_ACCOUNT_IDS.EXPENSE, type: 'debit', amount: params.amount },
    { accountId: params.walletAccountId, type: 'credit', amount: params.amount },
  ];

  const txn = createTransaction(params.date, params.description, entries, 'expense');
  return saveTransaction(txn);
}

/**
 * Record an income.
 * Debit → walletAccountId, Credit → acc_income
 */
export async function recordIncome(params: {
  amount: number;
  date: string;
  description: string;
  walletAccountId: string;
}): Promise<DoubleEntryTransaction> {
  const entries: TransactionEntry[] = [
    { accountId: params.walletAccountId, type: 'debit', amount: params.amount },
    { accountId: SYSTEM_ACCOUNT_IDS.INCOME, type: 'credit', amount: params.amount },
  ];

  const txn = createTransaction(params.date, params.description, entries, 'income');
  return saveTransaction(txn);
}

/**
 * Record a wallet-to-wallet transfer.
 * Single transaction: Debit → destWallet, Credit → sourceWallet
 */
export async function recordTransfer(params: {
  amount: number;
  date: string;
  fromWalletAccountId: string;
  toWalletAccountId: string;
  description: string;
}): Promise<DoubleEntryTransaction> {
  const transferId = generateId();
  const entries: TransactionEntry[] = [
    { accountId: params.toWalletAccountId, type: 'debit', amount: params.amount },
    { accountId: params.fromWalletAccountId, type: 'credit', amount: params.amount },
  ];

  const txn = createTransaction(params.date, params.description, entries, 'transfer', { transferId });
  return saveTransaction(txn);
}

/**
 * Record a credit card payment (pay off liability from an asset wallet).
 * Debit → acc_credit_card (reduces liability), Credit → walletAccountId
 */
export async function recordCreditCardPayment(params: {
  amount: number;
  date: string;
  walletAccountId: string;
  description: string;
}): Promise<DoubleEntryTransaction> {
  const entries: TransactionEntry[] = [
    { accountId: SYSTEM_ACCOUNT_IDS.CREDIT_CARD, type: 'debit', amount: params.amount },
    { accountId: params.walletAccountId, type: 'credit', amount: params.amount },
  ];

  const txn = createTransaction(params.date, params.description, entries, 'credit_card_payment');
  return saveTransaction(txn);
}

/**
 * Record a debt creation with optional financial transaction.
 * Owed (you owe someone): Debit → walletAccount, Credit → debtPayableAccount
 * Lent (someone owes you): Debit → debtReceivableAccount, Credit → walletAccount
 *
 * Returns null if createTransaction is false (debt is metadata-only).
 */
export async function recordDebtCreation(params: {
  debtId: string;
  debtType: 'owed' | 'lent';
  amount: number;
  date: string;
  description: string;
  walletAccountId: string;
  createTransaction: boolean;
}): Promise<DoubleEntryTransaction | null> {
  if (!params.createTransaction) return null;

  const debtAccId = debtAccountId(params.debtId, params.debtType);
  const entries: TransactionEntry[] = params.debtType === 'owed'
    ? [
        { accountId: params.walletAccountId, type: 'debit', amount: params.amount },
        { accountId: debtAccId, type: 'credit', amount: params.amount },
      ]
    : [
        { accountId: debtAccId, type: 'debit', amount: params.amount },
        { accountId: params.walletAccountId, type: 'credit', amount: params.amount },
      ];

  const txn = createTransaction(params.date, params.description, entries, 'debt_create', {
    debtId: params.debtId,
  });
  return saveTransaction(txn);
}

/**
 * Record a debt payment (installment or settlement).
 * Owed (paying back): Debit → debtPayableAccount, Credit → walletAccount
 * Lent (receiving back): Debit → walletAccount, Credit → debtReceivableAccount
 */
export async function recordDebtPayment(params: {
  debtId: string;
  debtType: 'owed' | 'lent';
  amount: number;
  date: string;
  walletAccountId: string;
  note?: string;
  installmentNo?: number;
  debtInstallmentId?: string;
}): Promise<DoubleEntryTransaction> {
  const debtAccId = debtAccountId(params.debtId, params.debtType);
  const entries: TransactionEntry[] = params.debtType === 'owed'
    ? [
        { accountId: debtAccId, type: 'debit', amount: params.amount },
        { accountId: params.walletAccountId, type: 'credit', amount: params.amount },
      ]
    : [
        { accountId: params.walletAccountId, type: 'debit', amount: params.amount },
        { accountId: debtAccId, type: 'credit', amount: params.amount },
      ];

  const txn = createTransaction(params.date, params.note || 'Debt payment', entries, 'debt_payment', {
    debtId: params.debtId,
    installmentNo: params.installmentNo,
    debtInstallmentId: params.debtInstallmentId,
  });
  return saveTransaction(txn);
}

/**
 * Record a debt waiver (forgive/write off).
 * Owed: Debit → debtPayableAccount, Credit → acc_income (write-off gain)
 * Lent: Debit → acc_expense (write-off loss), Credit → debtReceivableAccount
 */
export async function recordDebtWaive(params: {
  debtId: string;
  debtType: 'owed' | 'lent';
  amount: number;
  date: string;
  note?: string;
}): Promise<DoubleEntryTransaction> {
  const debtAccId = debtAccountId(params.debtId, params.debtType);
  const entries: TransactionEntry[] = params.debtType === 'owed'
    ? [
        { accountId: debtAccId, type: 'debit', amount: params.amount },
        { accountId: SYSTEM_ACCOUNT_IDS.INCOME, type: 'credit', amount: params.amount },
      ]
    : [
        { accountId: SYSTEM_ACCOUNT_IDS.EXPENSE, type: 'debit', amount: params.amount },
        { accountId: debtAccId, type: 'credit', amount: params.amount },
      ];

  const txn = createTransaction(params.date, params.note || 'Debt waived', entries, 'debt_waive', {
    debtId: params.debtId,
  });
  return saveTransaction(txn);
}

/**
 * Record an investment purchase/contribution.
 * Debit → investmentAccount, Credit → walletAccount
 */
export async function recordInvestmentBuy(params: {
  investmentId: string;
  amount: number;
  date: string;
  walletAccountId: string;
  description: string;
  investmentTransactionId?: string;
}): Promise<DoubleEntryTransaction> {
  const invAccId = investmentAccountId(params.investmentId);
  const entries: TransactionEntry[] = [
    { accountId: invAccId, type: 'debit', amount: params.amount },
    { accountId: params.walletAccountId, type: 'credit', amount: params.amount },
  ];

  const txn = createTransaction(params.date, params.description, entries, 'investment_buy', {
    investmentId: params.investmentId,
    investmentTransactionId: params.investmentTransactionId,
  });
  return saveTransaction(txn);
}

/**
 * Record an investment sale/withdrawal.
 * Debit → walletAccount, Credit → investmentAccount
 */
export async function recordInvestmentSell(params: {
  investmentId: string;
  amount: number;
  date: string;
  walletAccountId: string;
  description: string;
  investmentTransactionId?: string;
}): Promise<DoubleEntryTransaction> {
  const invAccId = investmentAccountId(params.investmentId);
  const entries: TransactionEntry[] = [
    { accountId: params.walletAccountId, type: 'debit', amount: params.amount },
    { accountId: invAccId, type: 'credit', amount: params.amount },
  ];

  const txn = createTransaction(params.date, params.description, entries, 'investment_sell', {
    investmentId: params.investmentId,
    investmentTransactionId: params.investmentTransactionId,
  });
  return saveTransaction(txn);
}

/**
 * Record an investment dividend.
 * Debit → walletAccount, Credit → acc_income
 */
export async function recordInvestmentDividend(params: {
  investmentId: string;
  amount: number;
  date: string;
  walletAccountId: string;
  description: string;
  investmentTransactionId?: string;
}): Promise<DoubleEntryTransaction> {
  const entries: TransactionEntry[] = [
    { accountId: params.walletAccountId, type: 'debit', amount: params.amount },
    { accountId: SYSTEM_ACCOUNT_IDS.INCOME, type: 'credit', amount: params.amount },
  ];

  const txn = createTransaction(params.date, params.description, entries, 'investment_dividend', {
    investmentId: params.investmentId,
    investmentTransactionId: params.investmentTransactionId,
  });
  return saveTransaction(txn);
}

/**
 * Record a balance adjustment (reconciliation).
 * Positive adjustment: Debit → walletAccount, Credit → acc_equity_opening
 * Negative adjustment: Debit → acc_equity_opening, Credit → walletAccount
 */
export async function recordAdjustment(params: {
  walletAccountId: string;
  amount: number;
  date: string;
  description?: string;
}): Promise<DoubleEntryTransaction> {
  const absAmount = Math.abs(params.amount);
  const entries: TransactionEntry[] = params.amount >= 0
    ? [
        { accountId: params.walletAccountId, type: 'debit', amount: absAmount },
        { accountId: SYSTEM_ACCOUNT_IDS.EQUITY_OPENING, type: 'credit', amount: absAmount },
      ]
    : [
        { accountId: SYSTEM_ACCOUNT_IDS.EQUITY_OPENING, type: 'debit', amount: absAmount },
        { accountId: params.walletAccountId, type: 'credit', amount: absAmount },
      ];

  const txn = createTransaction(
    params.date,
    params.description || 'Balance adjustment',
    entries,
    'adjustment',
    { isReconciliation: true }
  );
  return saveTransaction(txn);
}

/**
 * Fetch all double-entry transactions and transform them into the view-friendly Transaction format.
 */
export async function getTransactions(orderBy: string = 'date'): Promise<Transaction[]> {
  const [txns, accounts] = await Promise.all([
    db.transactions_v2.orderBy(orderBy).reverse().toArray() as Promise<DoubleEntryTransaction[]>,
    db.accounts.toArray() as Promise<Account[]>,
  ]);

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  return presentAllForUI(txns, accountMap);
}

// --- Update & Delete ---

/**
 * Update a double-entry transaction (replace in-place).
 */
export async function updateTransaction(txn: DoubleEntryTransaction): Promise<void> {
  validateBalancedEntries(txn.entries);
  txn.entryAccountIds = extractEntryAccountIds(txn.entries);
  await db.transactions_v2.put(txn);
}

/**
 * Delete a double-entry transaction by ID.
 */
export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions_v2.delete(id);
}

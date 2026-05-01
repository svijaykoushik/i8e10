/**
 * Balance Calculator — computes account balances from double-entry transactions.
 *
 * Sign conventions:
 *   Asset / Expense accounts:     balance = sum(debits) - sum(credits)
 *   Liability / Income / Equity:  balance = sum(credits) - sum(debits)
 */

import type { DoubleEntryTransaction, TransactionKind } from '../src/db/doubleEntryTypes';
import type { Account, AccountType } from '../src/db/accounts';

// --- Core Balance Computation ---

/**
 * Compute the balance for a specific account from a set of transactions.
 * Applies the correct sign convention based on account type.
 */
export function computeAccountBalance(
  transactions: DoubleEntryTransaction[],
  accountId: string,
  accountType: AccountType,
  dateRange?: { start: Date; end: Date }
): number {
  let debits = 0;
  let credits = 0;

  for (const txn of transactions) {
    // Date range filter
    if (dateRange) {
      const txnDate = new Date(txn.date);
      if (txnDate < dateRange.start || txnDate > dateRange.end) continue;
    }

    for (const entry of txn.entries) {
      if (entry.accountId !== accountId) continue;
      if (entry.type === 'debit') {
        debits += entry.amount;
      } else {
        credits += entry.amount;
      }
    }
  }

  // Sign convention
  if (accountType === 'asset' || accountType === 'expense') {
    return debits - credits;
  }
  // liability, income, equity
  return credits - debits;
}

/**
 * Compute balance for a single wallet account.
 * Wallet accounts can be either asset (normal) or liability (credit card).
 */
export function computeWalletBalance(
  transactions: DoubleEntryTransaction[],
  walletAccountId: string,
  walletAccountType: AccountType = 'asset',
  dateRange?: { start: Date; end: Date }
): number {
  return computeAccountBalance(transactions, walletAccountId, walletAccountType, dateRange);
}

/**
 * Compute total balance across all wallet accounts.
 * Asset wallets contribute positive, liability wallets are subtracted.
 */
export function computeTotalWalletBalance(
  transactions: DoubleEntryTransaction[],
  walletAccounts: Account[],
  dateRange?: { start: Date; end: Date }
): number {
  let total = 0;
  for (const wallet of walletAccounts) {
    const balance = computeAccountBalance(transactions, wallet.id, wallet.type, dateRange);
    if (wallet.type === 'asset') {
      total += balance;
    } else {
      // Liability wallets (e.g., credit card): balance is already positive
      // when you owe money, so subtract it from total
      total -= balance;
    }
  }
  return total;
}

// --- Net Worth ---

/**
 * Compute net worth from all accounts.
 * totalAssets - totalLiabilities = netWorth
 */
export function computeNetWorth(
  accounts: Account[],
  transactions: DoubleEntryTransaction[]
): { totalAssets: number; totalLiabilities: number; netWorth: number } {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const account of accounts) {
    if (!account.isActive) continue;

    const balance = computeAccountBalance(transactions, account.id, account.type);

    if (account.type === 'asset') {
      totalAssets += balance;
    } else if (account.type === 'liability') {
      totalLiabilities += balance;
    }
    // income, expense, equity don't contribute to net worth directly
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

// --- Cash Flow ---

/**
 * Compute periodic income and expense for cash flow analysis.
 * Optionally exclude certain transaction kinds (e.g., transfers, adjustments).
 */
export function computePeriodicFlow(
  transactions: DoubleEntryTransaction[],
  dateRange: { start: Date; end: Date },
  excludeKinds: TransactionKind[] = []
): { income: number; expense: number; netFlow: number } {
  let income = 0;
  let expense = 0;

  for (const txn of transactions) {
    const txnDate = new Date(txn.date);
    if (txnDate < dateRange.start || txnDate > dateRange.end) continue;
    if (excludeKinds.includes(txn.meta.kind)) continue;

    if (txn.meta.kind === 'income' || txn.meta.kind === 'investment_dividend') {
      // Sum the credit to income account = the amount earned
      for (const entry of txn.entries) {
        if (entry.type === 'credit') {
          income += entry.amount;
          break; // Only count the income-side entry
        }
      }
    } else if (txn.meta.kind === 'expense' || txn.meta.kind === 'credit_card_payment') {
      // Sum the debit to expense account = the amount spent
      for (const entry of txn.entries) {
        if (entry.type === 'debit') {
          expense += entry.amount;
          break; // Only count the expense-side entry
        }
      }
    }
  }

  return { income, expense, netFlow: income - expense };
}

// --- Debt & Investment Summaries ---

/**
 * Compute the outstanding balance for a specific debt account.
 */
export function computeDebtBalance(
  transactions: DoubleEntryTransaction[],
  debtId: string,
  debtType: 'owed' | 'lent'
): number {
  const accountId = debtType === 'owed'
    ? `acc_debt_payable_${debtId}`
    : `acc_debt_receivable_${debtId}`;
  const accountType: AccountType = debtType === 'owed' ? 'liability' : 'asset';
  return computeAccountBalance(transactions, accountId, accountType);
}

/**
 * Compute the total invested value for a specific investment account.
 */
export function computeInvestmentBalance(
  transactions: DoubleEntryTransaction[],
  investmentId: string
): number {
  const accountId = `acc_investment_${investmentId}`;
  return computeAccountBalance(transactions, accountId, 'asset');
}

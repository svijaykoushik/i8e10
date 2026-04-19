/**
 * Transaction Presenter — transforms DoubleEntryTransactions into the format
 * that existing UI components expect.
 *
 * This is a read-only adapter. The UI continues to work with the same shapes
 * it always has (type, amount, description, wallet name string, etc).
 */

import type { DoubleEntryTransaction } from '../src/db/doubleEntryTypes';
import type { Account } from '../src/db/accounts';
import { SYSTEM_ACCOUNT_IDS } from '../src/db/accounts';

export interface PresentedTransaction {
  id: string;
  type: 'income' | 'expense';
  date: string;
  amount: number;
  description: string;
  wallet?: string;
  isReconciliation?: boolean;
  transferId?: string;
  debtId?: string;
  debtInstallmentId?: string;
  investmentTransactionId?: string;
}

/**
 * Resolve the wallet name from entries.
 * Finds the first wallet-type (subtype='wallet') account in the entries.
 */
function resolveWallet(
  txn: DoubleEntryTransaction,
  accountMap: Map<string, Account>
): string | undefined {
  for (const entry of txn.entries) {
    const account = accountMap.get(entry.accountId);
    if (account?.subtype === 'wallet') {
      return account.name;
    }
  }
  return undefined;
}

/**
 * Get the primary amount from a transaction.
 * For most kinds, this is the amount of any single entry (they're equal in a 2-entry txn).
 */
function getPrimaryAmount(txn: DoubleEntryTransaction): number {
  if (txn.entries.length === 0) return 0;
  return txn.entries[0].amount;
}

/**
 * Convert a DoubleEntryTransaction to the legacy PresentedTransaction format.
 */
export function presentForUI(
  txn: DoubleEntryTransaction,
  accountMap: Map<string, Account>
): PresentedTransaction {
  const wallet = resolveWallet(txn, accountMap);
  const amount = getPrimaryAmount(txn);

  let type: 'income' | 'expense';

  switch (txn.meta.kind) {
    case 'income':
    case 'investment_dividend':
      type = 'income';
      break;

    case 'expense':
    case 'credit_card_payment':
      type = 'expense';
      break;

    case 'transfer': {
      // Transfers appear as expense from source wallet
      type = 'expense';
      break;
    }

    case 'debt_create': {
      // Owed: wallet receives money → income-like from wallet perspective
      // Lent: wallet gives money → expense-like from wallet perspective
      // Determine by checking which entry credits the wallet
      const walletEntry = txn.entries.find((e) => {
        const acc = accountMap.get(e.accountId);
        return acc?.subtype === 'wallet';
      });
      type = walletEntry?.type === 'debit' ? 'income' : 'expense';
      break;
    }

    case 'debt_payment': {
      // Owed (paying back): wallet credits → expense
      // Lent (receiving back): wallet debits → income
      const walletEntry = txn.entries.find((e) => {
        const acc = accountMap.get(e.accountId);
        return acc?.subtype === 'wallet';
      });
      type = walletEntry?.type === 'debit' ? 'income' : 'expense';
      break;
    }

    case 'debt_waive': {
      // Owed waived: gain → income
      // Lent waived: loss → expense
      const hasIncomeCredit = txn.entries.some(
        (e) => e.accountId === SYSTEM_ACCOUNT_IDS.INCOME
      );
      type = hasIncomeCredit ? 'income' : 'expense';
      break;
    }

    case 'investment_buy':
      type = 'expense'; // Money leaves wallet
      break;

    case 'investment_sell':
      type = 'income'; // Money enters wallet
      break;

    case 'adjustment': {
      // Positive adjustment: wallet debits → income-like
      // Negative adjustment: wallet credits → expense-like
      const walletEntry = txn.entries.find((e) => {
        const acc = accountMap.get(e.accountId);
        return acc?.subtype === 'wallet';
      });
      type = walletEntry?.type === 'debit' ? 'income' : 'expense';
      break;
    }

    default:
      type = 'expense';
  }

  return {
    id: txn.id,
    type,
    date: txn.date,
    amount,
    description: txn.note,
    wallet,
    isReconciliation: txn.meta.isReconciliation,
    transferId: txn.meta.transferId,
    debtId: txn.meta.debtId,
    debtInstallmentId: txn.meta.debtInstallmentId,
    investmentTransactionId: txn.meta.investmentId,
  };
}

/**
 * Batch convert for list views.
 */
export function presentAllForUI(
  txns: DoubleEntryTransaction[],
  accountMap: Map<string, Account>
): PresentedTransaction[] {
  return txns.map((txn) => presentForUI(txn, accountMap));
}

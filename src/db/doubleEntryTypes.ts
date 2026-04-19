/**
 * Double-entry transaction types for the accounting system.
 *
 * Every financial event is represented as a DoubleEntryTransaction with
 * balanced entries (sum of debits === sum of credits). The meta field
 * carries domain context (kind, cross-references to debts/investments).
 *
 * Encryption mapping:
 *   - note:                ENCRYPTED (user-given description)
 *   - entries[].amount:    ENCRYPTED (user financial data)
 *   - entries[].accountId: NOT encrypted (system ID, needed for indexing)
 *   - entries[].type:      NOT encrypted (needed for balance computation)
 *   - entryAccountIds:     NOT encrypted (denormalized index for multiEntry)
 *   - meta.*:              NOT encrypted (cross-reference IDs)
 *   - date:                NOT encrypted (needed for date-range queries)
 */

export type EntryType = 'debit' | 'credit';

export type TransactionKind =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'credit_card_payment'
  | 'debt_create'
  | 'debt_payment'
  | 'investment_buy'
  | 'investment_sell'
  | 'investment_dividend'
  | 'adjustment'
  | 'debt_waive';

export interface TransactionEntry {
  accountId: string;
  type: EntryType;
  amount: number;
}

export interface TransactionMeta {
  kind: TransactionKind;
  transferId?: string;
  debtId?: string;
  installmentNo?: number;
  investmentId?: string;
  debtInstallmentId?: string;
  isReconciliation?: boolean;
  /** Populated only during migration for traceability back to old records */
  sourceId?: string;
}

export interface DoubleEntryTransaction {
  id: string;
  date: string;
  note: string;
  entries: TransactionEntry[];
  /** Denormalized flat array of accountIds from entries — for multiEntry indexing */
  entryAccountIds: string[];
  meta: TransactionMeta;
  createdAt: string;
}

// --- Validation ---

/**
 * Validates that a set of entries is balanced (sum of debits === sum of credits).
 * Throws an error if the entries are unbalanced.
 */
export function validateBalancedEntries(entries: TransactionEntry[]): void {
  const totalDebits = entries
    .filter(e => e.type === 'debit')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCredits = entries
    .filter(e => e.type === 'credit')
    .reduce((sum, e) => sum + e.amount, 0);

  // Use a small epsilon for floating-point comparison
  if (Math.abs(totalDebits - totalCredits) > 0.001) {
    throw new Error(
      `Unbalanced entries: debits (${totalDebits}) !== credits (${totalCredits})`
    );
  }
}

/**
 * Extracts a flat array of unique accountIds from entries for the denormalized index.
 */
export function extractEntryAccountIds(entries: TransactionEntry[]): string[] {
  return [...new Set(entries.map(e => e.accountId))];
}

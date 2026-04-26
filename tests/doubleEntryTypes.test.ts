/**
 * Tests for doubleEntryTypes — validation and utility functions.
 */
import { describe, it, expect } from 'vitest';
import { validateBalancedEntries, extractEntryAccountIds } from '../src/db/doubleEntryTypes';
import type { TransactionEntry } from '../src/db/doubleEntryTypes';

describe('validateBalancedEntries', () => {
  it('passes for balanced entries', () => {
    const entries: TransactionEntry[] = [
      { accountId: 'a', type: 'debit', amount: 100 },
      { accountId: 'b', type: 'credit', amount: 100 },
    ];
    expect(() => validateBalancedEntries(entries)).not.toThrow();
  });

  it('passes for multi-entry balanced transactions', () => {
    const entries: TransactionEntry[] = [
      { accountId: 'a', type: 'debit', amount: 70 },
      { accountId: 'b', type: 'debit', amount: 30 },
      { accountId: 'c', type: 'credit', amount: 100 },
    ];
    expect(() => validateBalancedEntries(entries)).not.toThrow();
  });

  it('throws for unbalanced entries', () => {
    const entries: TransactionEntry[] = [
      { accountId: 'a', type: 'debit', amount: 100 },
      { accountId: 'b', type: 'credit', amount: 99 },
    ];
    expect(() => validateBalancedEntries(entries)).toThrow('Unbalanced entries');
  });

  it('handles floating point precision (within epsilon)', () => {
    const entries: TransactionEntry[] = [
      { accountId: 'a', type: 'debit', amount: 33.33 },
      { accountId: 'b', type: 'debit', amount: 33.33 },
      { accountId: 'c', type: 'debit', amount: 33.34 },
      { accountId: 'd', type: 'credit', amount: 100 },
    ];
    expect(() => validateBalancedEntries(entries)).not.toThrow();
  });

  it('passes for empty entries', () => {
    expect(() => validateBalancedEntries([])).not.toThrow();
  });
});

describe('extractEntryAccountIds', () => {
  it('extracts unique account IDs', () => {
    const entries: TransactionEntry[] = [
      { accountId: 'acc_1', type: 'debit', amount: 100 },
      { accountId: 'acc_2', type: 'credit', amount: 50 },
      { accountId: 'acc_1', type: 'credit', amount: 50 },
    ];
    const ids = extractEntryAccountIds(entries);
    expect(ids).toEqual(['acc_1', 'acc_2']);
  });

  it('returns empty array for empty entries', () => {
    expect(extractEntryAccountIds([])).toEqual([]);
  });
});

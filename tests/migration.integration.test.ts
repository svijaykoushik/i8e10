import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../utils/db';
import { runMigrationV3, isMigrationComplete } from '../utils/migrationV3';
import { TransactionType } from '../types';

describe('Migration Strategy Integration', () => {
  const dbName = "i8e10DB";

  beforeEach(async () => {
    // Ensure we start with a clean slate by closing the singleton and deleting the DB
    await db.close();
    const request = indexedDB.deleteDatabase(dbName);
    await new Promise((resolve, reject) => {
      request.onsuccess = resolve;
      request.onerror = reject;
    });
  });

  it('should follow the requested migration strategy', async () => {
    // 1. Open the database in version 2
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 2);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const idb = request.result;
        // Create stores matching the old schema (version 2)
        if (!idb.objectStoreNames.contains('transactionItems')) {
          idb.createObjectStore('transactionItems', { keyPath: 'id' });
        }
        if (!idb.objectStoreNames.contains('settings')) {
          idb.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!idb.objectStoreNames.contains('debts')) {
          idb.createObjectStore('debts', { keyPath: 'id' });
        }
        if (!idb.objectStoreNames.contains('investments')) {
          idb.createObjectStore('investments', { keyPath: 'id' });
        }
        if (!idb.objectStoreNames.contains('investmentTransactions')) {
          idb.createObjectStore('investmentTransactions', { keyPath: 'id' });
        }
        if (!idb.objectStoreNames.contains('debtInstallments')) {
          idb.createObjectStore('debtInstallments', { keyPath: 'id' });
        }
      };
      request.onsuccess = async () => {
        const idb = request.result;
        
        // 2. Seed the database with dummy data matching old schema
        const tx = idb.transaction(['transactionItems', 'settings', 'debts'], 'readwrite');
        const itemStore = tx.objectStore('transactionItems');
        const settingsStore = tx.objectStore('settings');

        itemStore.add({
          id: 'old-1',
          type: TransactionType.EXPENSE,
          amount: 100,
          date: '2024-01-01',
          description: 'Old Expense',
          wallet: 'Cash',
          isReconciliation: false
        });

        // Add a transfer pair
        itemStore.add({
          id: 'tr-out',
          type: TransactionType.EXPENSE,
          amount: 50,
          date: '2024-01-02',
          description: 'Transfer Out',
          wallet: 'Bank',
          transferId: 'transfer-1',
          isReconciliation: false
        });
        itemStore.add({
          id: 'tr-in',
          type: TransactionType.INCOME,
          amount: 50,
          date: '2024-01-02',
          description: 'Transfer In',
          wallet: 'Cash',
          transferId: 'transfer-1',
          isReconciliation: false
        });

        // Add a debt
        const debtStore = tx.objectStore('debts');
        debtStore.add({
          id: 'debt-1',
          type: 'lent',
          person: 'John',
          amount: 500,
          date: '2024-01-03',
          description: 'Lent to John',
          status: 'outstanding'
        });

        settingsStore.add({ key: 'wallets', value: ['Cash', 'Bank'] });
        settingsStore.add({ key: 'defaultWallet', value: 'Cash' });

        tx.oncomplete = () => {
          // 3. Close the connection
          idb.close();
          resolve();
        };
      };
    });

    // 4. Re-open the database at the new version (v3)
    await db.open();
    
    await runMigrationV3();

    // 5. Assert that the data was migrated correctly
    expect(await isMigrationComplete()).toBe(true);

    const txsV2 = await db.transactions_v2.toArray();
    // 1 simple expense + 1 transfer (grouped) = 2 transactions
    // Wait, runMigrationV3 handles debt creation too? 
    // Yes, if there's a transaction linked to it or just the debt itself.
    // Actually runMigrationV3 iterates over transactionItems. 
    // If a debt exists but no transaction links to it, it just creates the account.
    expect(txsV2.length).toBeGreaterThanOrEqual(2);
    
    const simpleTx = txsV2.find(t => t.note === 'Old Expense');
    expect(simpleTx).toBeDefined();
    expect(simpleTx?.meta?.kind).toBe('expense');
    
    const transferTx = txsV2.find(t => t.meta?.kind === 'transfer');
    expect(transferTx).toBeDefined();
    expect(transferTx?.entries).toHaveLength(2);
    
    // Verify accounts
    const accounts = await db.accounts.toArray();
    expect(accounts.find(a => a.name === 'Cash')).toBeDefined();
    expect(accounts.find(a => a.name === 'Bank')).toBeDefined();
    expect(accounts.find(a => a.subtype === 'debt_receivable')).toBeDefined();
  });

  it('should have double-entry records that tally with the original single-entry data', async () => {
    // 1. Open the database in version 2 and seed a specific sample
    const sampleId = 'sample-income-123';
    const amount = 1234.56;
    
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 2);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const idb = request.result;
        ['transactionItems', 'debts', 'investments', 'investmentTransactions', 'debtInstallments'].forEach(s => {
           if (!idb.objectStoreNames.contains(s)) idb.createObjectStore(s, { keyPath: 'id' });
        });
        if (!idb.objectStoreNames.contains('settings')) {
          idb.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      request.onsuccess = () => {
        const idb = request.result;
        const tx = idb.transaction(['transactionItems', 'settings'], 'readwrite');
        tx.objectStore('transactionItems').add({
          id: sampleId,
          type: TransactionType.INCOME,
          amount: amount,
          date: '2024-02-01',
          description: 'Sample Income',
          wallet: 'Cash',
          isReconciliation: false
        });
        tx.objectStore('settings').add({ key: 'wallets', value: ['Cash'] });
        tx.oncomplete = () => {
          idb.close();
          resolve();
        };
      };
    });

    // 2. Open at v3 and run migration
    await db.open();
    await runMigrationV3();

    // 3. Compare and Tally
    const v2Txns = await db.transactions_v2.toArray();
    const migrated = v2Txns.find(t => t.meta?.sourceId === sampleId);

    expect(migrated).toBeDefined();
    // Check for double entry (at least 2 entries: one for wallet, one for income/expense)
    expect(migrated!.entries.length).toBeGreaterThanOrEqual(2);

    // Tally check: sum of debits must equal sum of credits
    const totalDebits = migrated!.entries
      .filter(e => e.type === 'debit')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCredits = migrated!.entries
      .filter(e => e.type === 'credit')
      .reduce((sum, e) => sum + e.amount, 0);

    // Precision check for floating point if necessary, but here exact match is expected
    expect(totalDebits).toBe(amount);
    expect(totalCredits).toBe(amount);
    expect(totalDebits).toBe(totalCredits);
    
    // Check that one entry is a wallet account and the other is a system account
    const accounts = await db.accounts.toArray();
    const walletAccount = accounts.find(a => a.name === 'Cash');
    const incomeAccount = accounts.find(a => a.id === 'acc_income');

    const hasWalletEntry = migrated!.entries.some(e => e.accountId === walletAccount?.id);
    const hasIncomeEntry = migrated!.entries.some(e => e.accountId === incomeAccount?.id);

    expect(hasWalletEntry).toBe(true);
    expect(hasIncomeEntry).toBe(true);
  });
});

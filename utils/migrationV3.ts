/**
 * Migration V3 — one-time data migration from single-entry to double-entry accounting.
 *
 * This pipeline runs after password verification when the 'migrationV3Complete' flag
 * is not set. The user must export/backup data first (enforced by the UI).
 *
 * Migration steps:
 *   1. Create accounts (wallets, system, debt, investment)
 *   2. Convert simple transactions (income/expense/reconciliation)
 *   3. Convert transfers
 *   4. Convert debts + installments
 *   5. Convert investments
 *   6. Migrate settings (wallets → accounts, defaultWallet → accountId)
 *   7. Set migration complete flag
 */

import { db } from './db';
import type { Transaction, Debt, Investment, InvestmentTransaction, DebtInstallment } from '../types';
import type { DoubleEntryTransaction, TransactionEntry, TransactionKind } from '../src/db/doubleEntryTypes';
import { validateBalancedEntries, extractEntryAccountIds } from '../src/db/doubleEntryTypes';
import type { Account } from '../src/db/accounts';
import {
  SYSTEM_ACCOUNT_IDS,
  walletAccountId,
  debtAccountId,
  investmentAccountId,
  createSystemAccounts,
  createWalletAccount,
  createDebtAccount,
  createInvestmentAccount,
} from '../src/db/accounts';

// --- Helpers ---

function generateId(): string {
  return crypto.randomUUID();
}

function buildDoubleEntryTxn(
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

// --- Migration Status ---

export async function isMigrationComplete(): Promise<boolean> {
  try {
    const setting = await db.settings.get('migrationV3Complete');
    return setting?.value === true;
  } catch {
    return false;
  }
}

// --- Main Migration ---

export async function runMigrationV3(
  onProgress?: (step: string, detail: string) => void
): Promise<void> {
  const log = (step: string, detail: string) => {
    console.log(`[Migration V3] ${step}: ${detail}`);
    onProgress?.(step, detail);
  };

  // Check idempotency
  if (await isMigrationComplete()) {
    log('Skip', 'Migration already complete');
    return;
  }

  log('Start', 'Beginning double-entry migration...');

  // --- Step 1: Create Accounts ---
  log('Step 1', 'Creating accounts...');

  // 1a. System accounts
  const systemAccounts = createSystemAccounts();
  for (const acc of systemAccounts) {
    try {
      await db.accounts.put(acc);
      log('Step 1', `Created/Updated system account: ${acc.name} (${acc.id})`);
    } catch (e) {
      log('Step 1', `System account creation failed: ${acc.id}`);
    }
  }

  // 1b. Wallet accounts from settings
  let walletNames: string[] = [];
  try {
    const walletsSetting = await db.settings.get('wallets');
    if (walletsSetting?.value && Array.isArray(walletsSetting.value)) {
      walletNames = walletsSetting.value;
    }
  } catch {
    log('Step 1', 'No wallets setting found, using defaults');
  }

  // Ensure at least default wallets exist
  if (walletNames.length === 0) {
    walletNames = ['Cash / ரொக்கம்', 'Bank / வங்கி'];
  }

  const walletAccountMap = new Map<string, string>(); // walletName → accountId
  for (const wName of walletNames) {
    const acc = createWalletAccount(wName);
    try {
      await db.accounts.put(acc);
      log('Step 1', `Created/Updated wallet account: ${acc.name} (${acc.id})`);
    } catch {
      log('Step 1', `Wallet account creation failed: ${acc.id}`);
    }
    walletAccountMap.set(wName, acc.id);
  }

  // 1c. Debt accounts
  const debts = await db.debts.toArray() as Debt[];
  for (const debt of debts) {
    const dType = debt.type === 'owed' ? 'owed' : 'lent';
    const acc = createDebtAccount(debt.id, dType as 'owed' | 'lent', debt.person);
    try {
      await db.accounts.put(acc);
      log('Step 1', `Created/Updated debt account: ${acc.name} (${acc.id})`);
    } catch {
      log('Step 1', `Debt account creation failed: ${acc.id}`);
    }
  }

  // 1d. Investment accounts
  const investments = await db.investments.toArray() as Investment[];
  for (const inv of investments) {
    const acc = createInvestmentAccount(inv.id, inv.name);
    try {
      await db.accounts.put(acc);
      log('Step 1', `Created/Updated investment account: ${acc.name} (${acc.id})`);
    } catch {
      log('Step 1', `Investment account creation failed: ${acc.id}`);
    }
  }

  // --- Step 2–5: Convert Transactions ---
  log('Step 2', 'Loading existing transactions...');

  const oldTransactions = await db.transactionItems.toArray() as Transaction[];
  const debtInstallments = await db.debtInstallements.toArray() as DebtInstallment[];
  const investmentTransactions = await db.investmentTransactions.toArray() as InvestmentTransaction[];

  // Build lookup maps
  const debtMap = new Map<string, Debt>();
  for (const d of debts) debtMap.set(d.id, d);

  const dInstMap = new Map<string, DebtInstallment>();
  for (const di of debtInstallments) dInstMap.set(di.id, di);

  const invTxMap = new Map<string, InvestmentTransaction>();
  for (const it of investmentTransactions) invTxMap.set(it.id, it);

  const invMap = new Map<string, Investment>();
  for (const inv of investments) invMap.set(inv.id, inv);

  // Resolve wallet: fall back to first wallet if missing
  const fallbackWalletId = walletNames.length > 0
    ? walletAccountId(walletNames[0])
    : walletAccountId('Cash / ரொக்கம்');

  const resolveWallet = (walletName?: string): string => {
    if (walletName && walletAccountMap.has(walletName)) {
      return walletAccountMap.get(walletName)!;
    }
    // Try to find by generating the account ID
    if (walletName) {
      return walletAccountId(walletName);
    }
    return fallbackWalletId;
  };

  // Group transfers by transferId
  const transferGroups = new Map<string, Transaction[]>();
  const processedTransferIds = new Set<string>();

  let convertedCount = 0;
  const newTransactions: DoubleEntryTransaction[] = [];

  for (const txn of oldTransactions) {
    // Skip transfer components (handled as grouped pairs)
    if (txn.transferId) {
      if (!transferGroups.has(txn.transferId)) {
        transferGroups.set(txn.transferId, []);
      }
      transferGroups.get(txn.transferId)!.push(txn);
      continue;
    }

    const wAccId = resolveWallet(txn.wallet);

    // --- Debt-linked transactions ---
    if (txn.debtInstallmentId) {
      const di = dInstMap.get(txn.debtInstallmentId);
      const debt = di ? debtMap.get(di.debtId) : undefined;
      if (debt) {
        const dType = debt.type === 'owed' ? 'owed' : 'lent';
        const debtAccId = debtAccountId(debt.id, dType as 'owed' | 'lent');
        const entries: TransactionEntry[] = dType === 'owed'
          ? [
              { accountId: debtAccId, type: 'debit', amount: txn.amount },
              { accountId: wAccId, type: 'credit', amount: txn.amount },
            ]
          : [
              { accountId: wAccId, type: 'debit', amount: txn.amount },
              { accountId: debtAccId, type: 'credit', amount: txn.amount },
            ];

        newTransactions.push(
          buildDoubleEntryTxn(txn.date, txn.description, entries, 'debt_payment', {
            debtId: debt.id,
            debtInstallmentId: txn.debtInstallmentId,
            sourceId: txn.id,
          })
        );
        convertedCount++;
        continue;
      }
    }

    if (txn.debtId && !txn.debtInstallmentId) {
      const debt = debtMap.get(txn.debtId);
      if (debt) {
        const dType = debt.type === 'owed' ? 'owed' : 'lent';
        const debtAccId = debtAccountId(debt.id, dType as 'owed' | 'lent');
        const entries: TransactionEntry[] = dType === 'owed'
          ? [
              { accountId: wAccId, type: 'debit', amount: txn.amount },
              { accountId: debtAccId, type: 'credit', amount: txn.amount },
            ]
          : [
              { accountId: debtAccId, type: 'debit', amount: txn.amount },
              { accountId: wAccId, type: 'credit', amount: txn.amount },
            ];

        newTransactions.push(
          buildDoubleEntryTxn(txn.date, txn.description, entries, 'debt_create', {
            debtId: txn.debtId,
            sourceId: txn.id,
          })
        );
        convertedCount++;
        continue;
      }
    }

    // --- Investment-linked transactions ---
    if (txn.investmentTransactionId) {
      const invTx = invTxMap.get(txn.investmentTransactionId);
      if (invTx) {
        const invAccId = investmentAccountId(invTx.investmentId);
        let entries: TransactionEntry[];
        let kind: TransactionKind;

        switch (invTx.type) {
          case 'contribution':
            entries = [
              { accountId: invAccId, type: 'debit', amount: txn.amount },
              { accountId: wAccId, type: 'credit', amount: txn.amount },
            ];
            kind = 'investment_buy';
            break;
          case 'withdrawal':
            entries = [
              { accountId: wAccId, type: 'debit', amount: txn.amount },
              { accountId: invAccId, type: 'credit', amount: txn.amount },
            ];
            kind = 'investment_sell';
            break;
          case 'dividend':
            entries = [
              { accountId: wAccId, type: 'debit', amount: txn.amount },
              { accountId: SYSTEM_ACCOUNT_IDS.INCOME, type: 'credit', amount: txn.amount },
            ];
            kind = 'investment_dividend';
            break;
          default:
            entries = [
              { accountId: invAccId, type: 'debit', amount: txn.amount },
              { accountId: wAccId, type: 'credit', amount: txn.amount },
            ];
            kind = 'investment_buy';
        }

        newTransactions.push(
          buildDoubleEntryTxn(txn.date, txn.description, entries, kind, {
            investmentId: invTx.investmentId,
            sourceId: txn.id,
          })
        );
        convertedCount++;
        continue;
      }
    }

    // --- Reconciliation ---
    if (txn.isReconciliation) {
      const isPositive = txn.type === 'income';
      const entries: TransactionEntry[] = isPositive
        ? [
            { accountId: wAccId, type: 'debit', amount: txn.amount },
            { accountId: SYSTEM_ACCOUNT_IDS.EQUITY_OPENING, type: 'credit', amount: txn.amount },
          ]
        : [
            { accountId: SYSTEM_ACCOUNT_IDS.EQUITY_OPENING, type: 'debit', amount: txn.amount },
            { accountId: wAccId, type: 'credit', amount: txn.amount },
          ];

      newTransactions.push(
        buildDoubleEntryTxn(txn.date, txn.description, entries, 'adjustment', {
          isReconciliation: true,
          sourceId: txn.id,
        })
      );
      convertedCount++;
      continue;
    }

    // --- Simple income/expense ---
    if (txn.type === 'income') {
      newTransactions.push(
        buildDoubleEntryTxn(txn.date, txn.description, [
          { accountId: wAccId, type: 'debit', amount: txn.amount },
          { accountId: SYSTEM_ACCOUNT_IDS.INCOME, type: 'credit', amount: txn.amount },
        ], 'income', { sourceId: txn.id })
      );
    } else {
      newTransactions.push(
        buildDoubleEntryTxn(txn.date, txn.description, [
          { accountId: SYSTEM_ACCOUNT_IDS.EXPENSE, type: 'debit', amount: txn.amount },
          { accountId: wAccId, type: 'credit', amount: txn.amount },
        ], 'expense', { sourceId: txn.id })
      );
    }
    convertedCount++;
  }

  // --- Step 3: Convert Transfers ---
  log('Step 3', `Converting ${transferGroups.size} transfers...`);
  for (const [transferId, txns] of transferGroups) {
    if (processedTransferIds.has(transferId)) continue;
    processedTransferIds.add(transferId);

    // Find expense (source) and income (destination) legs
    const expenseLeg = txns.find((t) => t.type === 'expense');
    const incomeLeg = txns.find((t) => t.type === 'income');

    if (expenseLeg && incomeLeg) {
      const sourceAccId = resolveWallet(expenseLeg.wallet);
      const destAccId = resolveWallet(incomeLeg.wallet);

      newTransactions.push(
        buildDoubleEntryTxn(
          expenseLeg.date,
          expenseLeg.description || 'Transfer',
          [
            { accountId: destAccId, type: 'debit', amount: expenseLeg.amount },
            { accountId: sourceAccId, type: 'credit', amount: expenseLeg.amount },
          ],
          'transfer',
          {
            transferId,
            sourceId: expenseLeg.id,
          }
        )
      );
      convertedCount++;
    }
  }

  // --- Write all converted transactions ---
  log('Step 4', `Writing ${newTransactions.length} converted transactions...`);
  for (const txn of newTransactions) {
    try {
      await db.transactions_v2.put(txn);
    } catch (e) {
      console.error(`Failed to write transaction ${txn.id}:`, e);
      throw new Error(`Migration failed at transaction write: ${e}`);
    }
  }

  // --- Step 6: Migrate Settings ---
  log('Step 6', 'Migrating settings...');

  // Update defaultWallet from name to accountId
  try {
    const defaultWalletSetting = await db.settings.get('defaultWallet');
    if (defaultWalletSetting?.value && typeof defaultWalletSetting.value === 'string') {
      const oldName = defaultWalletSetting.value;
      const newAccId = resolveWallet(oldName);
      await db.settings.put({ key: 'defaultWallet', value: newAccId });
      log('Step 6', `Updated defaultWallet: "${oldName}" → "${newAccId}"`);
    }
  } catch (e) {
    log('Step 6', `Warning: Failed to migrate defaultWallet setting: ${e}`);
  }

  // --- Step 7: Set migration flag ---
  await db.settings.put({ key: 'migrationV3Complete', value: true });
  log('Complete', `Migration finished. Converted ${convertedCount} transactions, created ${newTransactions.length} double-entry records.`);
}

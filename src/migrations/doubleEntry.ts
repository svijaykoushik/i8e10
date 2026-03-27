/**
 * Double-Entry Migration Job
 * 
 * Migrates data from legacy i8e10DB (v3) to new i8e10LedgerDB (v1)
 * Transforms single-entry transactions to double-entry ledger format
 * 
 * This runs AFTER:
 * 1. User has provided password (encryption key is unlocked)
 * 2. User has confirmed backup
 * 3. User has confirmed they want to proceed with migration
 */

import type {
  Transaction as LegacyTransaction,
  TransactionType,
  Account,
  LedgerTransaction,
  TransactionEntry,
  LedgerTransactionType,
  Wallet,
  Debt,
  Investment,
  InvestmentTransaction,
  DebtInstallment,
  MigrationStatus,
} from '../../types';
import { db as legacyDb } from '../../utils/db';
import { CustomDatabase } from '../db/database';
import { initializeSystemAccounts, LedgerDatabaseFactory } from '../db/ledgerDatabase';

/**
 * Main migration function
 * Call this after user confirms backup and migration
 */
export async function migrateToDoubleEntry(): Promise<{
  success: boolean;
  message: string;
  summary?: {
    accountsCreated: number;
    transactionsMigrated: number;
    debtsMigrated: number;
    investmentsMigrated: number;
  };
  error?: string;
}> {
  try {
    // Step 1: Open the new ledger database
    const ledgerDb = LedgerDatabaseFactory.getInstance();
    await ledgerDb.open(1);

    // Step 2: Initialize system accounts
    const systemAccountIds = await initializeSystemAccounts(ledgerDb);

    // Step 3: Read and migrate wallets → accounts
    const wallets = await legacyDb.wallets.toArray();
    const walletToAccountMap = await migrateWallets(ledgerDb, wallets);
    console.log(`✓ Migrated ${walletToAccountMap.size} wallets to accounts`);

    // Step 4: Read and migrate transactions
    const legacyTransactions = await legacyDb.transactionItems.toArray();
    const { migrated: transactionCount, errors: txErrors } = await migrateTransactions(
      ledgerDb,
      legacyTransactions,
      walletToAccountMap,
      systemAccountIds
    );
    console.log(`✓ Migrated ${transactionCount} transactions`);

    // Step 5: Convert debts + investments through ledger engine into transactions
    const debts = await legacyDb.debts.toArray();
    const debtConvertResults = await migrateDebtEntities(
      ledgerDb,
      debts,
      walletToAccountMap,
      systemAccountIds
    );
    console.log(`✓ Translated ${debtConvertResults.migrated} debts to ledger transactions`);

    const investments = await legacyDb.investments.toArray();
    const investmentConvertResults = await migrateInvestmentEntities(
      ledgerDb,
      investments,
      walletToAccountMap,
      systemAccountIds
    );
    console.log(`✓ Translated ${investmentConvertResults.migrated} investments to ledger transactions`);

    const investmentTransactions = await legacyDb.investmentTransactions.toArray();
    const invTxConvertResults = await migrateInvestmentTransactions(
      ledgerDb,
      investmentTransactions,
      walletToAccountMap,
      systemAccountIds
    );
    console.log(`✓ Translated ${invTxConvertResults.migrated} investment transactions`);

    const debtInstallments = await legacyDb.debtInstallments.toArray();
    const debtInstConvertResults = await migrateDebtInstallments(
      ledgerDb,
      debtInstallments,
      walletToAccountMap,
      systemAccountIds
    );
    console.log(`✓ Translated ${debtInstConvertResults.migrated} debt installments`);

    // Note: legacy detail stores (debts, investments, etc.) remain available in legacy DB for current UI until fully removed.
    // Ledger DB now contains double-entry representation in accounts+transactions.

    // Step 7: Mark migration as complete in legacy DB only
    // Ledger DB is accounts+transactions only (as per target model)
    console.log('Marking migration as complete in legacy DB...');
    await legacyDb.settings.put({
      key: 'migration.doubleEntryV1',
      value: 'completed',
      completedAt: new Date().toISOString(),
    });

    // Verify the status was actually written
    console.log('Verifying migration status was written...');
    const verifyStatus = await legacyDb.settings.get('migration.doubleEntryV1');
    if (verifyStatus?.value !== 'completed') {
      throw new Error(
        `Migration completion status was not properly persisted. Expected 'completed', got '${verifyStatus?.value}'`
      );
    }
    console.log(`✓ Migration status verified as 'completed'`);

    return {
      success: true,
      message: 'Migration to double-entry successful!',
      summary: {
        accountsCreated: walletToAccountMap.size,
        transactionsMigrated: transactionCount,
        debtsMigrated: debtCount,
        investmentsMigrated: investmentCount,
      },
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      message: 'Migration failed. Your data is safe. Please try again or contact support.',
      error: String(error),
    };
  }
}

// /**
//  * Initialize system accounts in the ledger DB
//  */
// async function initializeSystemAccounts(
//   db: CustomDatabase
// ): Promise<{
//   expense: string;
//   income: string;
//   reconciliation: string;
//   debtReceivable: string;
//   debtPayable: string;
//   investment: string;
// }> {
//   const accountsTable = db.table('accounts');

//   const systemAccounts: Account[] = [
//     {
//       id: 'sys-default-expense',
//       name: 'Default Expense / ডিফল্ট খরচ',
//       type: 'EXPENSE',
//       subType: 'GENERAL',
//       currencyCode: 'INR',
//       isSystem: true,
//       isArchived: false,
//     },
//     {
//       id: 'sys-default-income',
//       name: 'Default Income / ডিফল্ট আয়',
//       type: 'REVENUE',
//       subType: 'GENERAL',
//       currencyCode: 'INR',
//       isSystem: true,
//       isArchived: false,
//     },
//     {
//       id: 'sys-opening-balance-equity',
//       name: 'Opening Balance Equity',
//       type: 'EQUITY',
//       subType: 'OPENING_BALANCE',
//       currencyCode: 'INR',
//       isSystem: true,
//       isArchived: false,
//     },
//     {
//       id: 'sys-reconciliation-adjustment',
//       name: 'Reconciliation Adjustment',
//       type: 'EXPENSE',
//       subType: 'GENERAL',
//       currencyCode: 'INR',
//       isSystem: true,
//       isArchived: false,
//     },
//     {
//       id: 'sys-debt-receivable',
//       name: 'Debt Receivable',
//       type: 'ASSET',
//       subType: 'DEBT_RECEIVABLE',
//       currencyCode: 'INR',
//       isSystem: true,
//       isArchived: false,
//     },
//     {
//       id: 'sys-debt-payable',
//       name: 'Debt Payable',
//       type: 'LIABILITY',
//       subType: 'DEBT_PAYABLE',
//       currencyCode: 'INR',
//       isSystem: true,
//       isArchived: false,
//     },
//     {
//       id: 'sys-investment',
//       name: 'Investment',
//       type: 'ASSET',
//       subType: 'INVESTMENT',
//       currencyCode: 'INR',
//       isSystem: true,
//       isArchived: false,
//     },
//   ];

//   for (const account of systemAccounts) {
//     await accountsTable.put(account);
//   }

//   return {
//     expense: 'sys-default-expense',
//     income: 'sys-default-income',
//     reconciliation: 'sys-reconciliation-adjustment',
//     debtReceivable: 'sys-debt-receivable',
//     debtPayable: 'sys-debt-payable',
//     investment: 'sys-investment',
//   };
// }

/**
 * Migrate wallets → accounts
 * Returns a map of walletId → accountId
 */
async function migrateWallets(
  db: CustomDatabase,
  wallets: Wallet[]
): Promise<Map<string, string>> {
  const accountsTable = db.table('accounts');
  const walletToAccountMap = new Map<string, string>();

  for (const wallet of wallets) {
    const accountType = mapWalletTypeToAccountType(wallet.type);
    const accountSubType = mapWalletTypeToAccountSubType(wallet.type);

    const account: Account = {
      id: wallet.id, // Reuse wallet ID as account ID
      name: wallet.name,
      type: accountType as any, // Type-safe: mapWalletTypeToAccountType returns correct enum
      subType: accountSubType as any,
      currencyCode: 'INR', // Default to INR; would be customizable in future
      isSystem: false,
      isArchived: wallet.isArchived ?? false,
    };

    await accountsTable.put(account);
    walletToAccountMap.set(wallet.id, account.id);
  }

  return walletToAccountMap;
}

/**
 * Convert legacy wallet type to account type
 */
function mapWalletTypeToAccountType(
  walletType: 'cash' | 'bank' | 'credit_card' | 'other'
): string {
  switch (walletType) {
    case 'credit_card':
      return 'LIABILITY';
    case 'cash':
    case 'bank':
    case 'other':
    default:
      return 'ASSET';
  }
}

/**
 * Convert legacy wallet type to account sub-type
 */
function mapWalletTypeToAccountSubType(
  walletType: 'cash' | 'bank' | 'credit_card' | 'other'
): string {
  switch (walletType) {
    case 'cash':
      return 'CASH';
    case 'bank':
      return 'BANK';
    case 'credit_card':
      return 'CREDIT_CARD';
    case 'other':
    default:
      return 'GENERAL';
  }
}

/**
 * Migrate legacy transactions to double-entry transactions
 */
async function migrateTransactions(
  db: CustomDatabase,
  legacyTransactions: LegacyTransaction[],
  walletToAccountMap: Map<string, string>,
  systemAccountIds: { expense: string; income: string; reconciliation: string }
): Promise<{ migrated: number; errors: Array<{ id: string; error: string }> }> {
  const transactionsTable = db.table('transactions');
  let migrated = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const legacyTx of legacyTransactions) {
    try {
      // Determine wallet -> account mapping
      const walletAccountId = walletToAccountMap.get(legacyTx.walletId);
      if (!walletAccountId) {
        throw new Error(
          `Wallet ${legacyTx.walletId} not found in migration map`
        );
      }

      // Build double-entry transaction
      const ledgerTx = buildLedgerTransaction(
        legacyTx,
        walletAccountId,
        systemAccountIds
      );

      // Write to ledger DB
      await transactionsTable.put(ledgerTx);
      migrated++;
    } catch (error) {
      errors.push({
        id: legacyTx.id,
        error: String(error),
      });
      console.warn(`Failed to migrate transaction ${legacyTx.id}:`, error);
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} transactions failed to migrate`);
  }

  return { migrated, errors };
}

/**
 * Build a double-entry ledger transaction from a legacy transaction
 */
function buildLedgerTransaction(
  legacyTx: LegacyTransaction,
  walletAccountId: string,
  systemAccountIds: ReturnType<typeof initializeSystemAccounts>
): LedgerTransaction {
  // Convert amount to cents
  const cents = Math.round(legacyTx.amount * 100);

  let type: LedgerTransactionType;
  let entries: TransactionEntry[];
  let accountIds: string[];

  if (legacyTx.isReconciliation) {
    // Reconciliation: Debit reconciliation account, Credit wallet
    type = 'RECONCILIATION';
    entries = [
      { accountId: systemAccountIds.reconciliation, amount: cents }, // Debit
      { accountId: walletAccountId, amount: -cents }, // Credit
    ];
    accountIds = [systemAccountIds.reconciliation, walletAccountId];
  } else if (legacyTx.type === 'INCOME') {
    // Income: Debit wallet, Credit income account
    type = 'INCOME';
    entries = [
      { accountId: walletAccountId, amount: cents }, // Debit
      { accountId: systemAccountIds.income, amount: -cents }, // Credit
    ];
    accountIds = [walletAccountId, systemAccountIds.income];
  } else if (legacyTx.type === 'EXPENSE') {
    // Expense: Debit expense account, Credit wallet
    type = 'EXPENSE';
    entries = [
      { accountId: systemAccountIds.expense, amount: cents }, // Debit
      { accountId: walletAccountId, amount: -cents }, // Credit
    ];
    accountIds = [systemAccountIds.expense, walletAccountId];
  } else {
    throw new Error(`Unknown transaction type: ${legacyTx.type}`);
  }

  // Validate zero-sum
  const sum = entries.reduce((acc, e) => acc + e.amount, 0);
  if (sum !== 0) {
    throw new Error(
      `Transaction ${legacyTx.id} does not balance: sum=${sum}`
    );
  }

  return {
    id: legacyTx.id,
    date: legacyTx.date,
    description: legacyTx.description,
    type,
    amount: cents,
    entries,
    accountIds,
    beneficiary: undefined,
    currencyCode: 'INR',
    isReverted: false,
    createdAt: new Date().toISOString(),
  };
}

async function migrateDebtEntities(
  db: CustomDatabase,
  debts: Debt[],
  walletToAccountMap: Map<string, string>,
  systemAccountIds: ReturnType<typeof initializeSystemAccounts>
): Promise<{ migrated: number; errors: string[] }> {
  const transactionsTable = db.table('transactions');
  let migrated = 0;
  const errors: string[] = [];

  for (const debt of debts) {
    try {
      const debtTx = buildLedgerDebtTransaction(
        debt,
        walletToAccountMap,
        systemAccountIds
      );
      await transactionsTable.put(debtTx);
      migrated++;
    } catch (error) {
      errors.push(String(error));
      console.warn(`Failed to convert debt ${debt.id}:`, error);
    }
  }

  return { migrated, errors };
}

function buildLedgerDebtTransaction(
  debt: Debt,
  walletToAccountMap: Map<string, string>,
  systemAccountIds: ReturnType<typeof initializeSystemAccounts>
): LedgerTransaction {
  const cents = Math.round(debt.amount * 100);
  const primaryWalletAccount =
    walletToAccountMap.values().next().value || systemAccountIds.reconciliation;

  if (cents === 0) {
    throw new Error(`Debt ${debt.id} has zero amount`);
  }

  const entries: TransactionEntry[] = [];
  let type: LedgerTransactionType = 'TRANSFER';

  if (debt.type === 'lent') {
    // You lent money to someone: you lose cash, add receivable
    entries.push({ accountId: primaryWalletAccount, amount: -cents });
    entries.push({ accountId: systemAccountIds.debtReceivable, amount: cents });
  } else {
    // owed: you owe someone, increase payable liability and decrease cash
    entries.push({ accountId: primaryWalletAccount, amount: -cents });
    entries.push({ accountId: systemAccountIds.debtPayable, amount: cents });
  }

  const sum = entries.reduce((acc, e) => acc + e.amount, 0);
  if (sum !== 0) {
    throw new Error(`Debt ${debt.id} does not balance (sum=${sum})`);
  }

  return {
    id: `debt-${debt.id}`,
    date: debt.date,
    description: `Debt ${debt.type} ${debt.person}: ${debt.description}`,
    type,
    amount: Math.abs(cents),
    entries,
    accountIds: [primaryWalletAccount, debt.type === 'lent' ? systemAccountIds.debtReceivable : systemAccountIds.debtPayable],
    beneficiary: debt.person,
    currencyCode: 'INR',
    isReverted: debt.status !== 'outstanding',
    createdAt: new Date().toISOString(),
  };
}

async function migrateInvestmentEntities(
  db: CustomDatabase,
  investments: Investment[],
  walletToAccountMap: Map<string, string>,
  systemAccountIds: ReturnType<typeof initializeSystemAccounts>
): Promise<{ migrated: number; errors: string[] }> {
  const transactionsTable = db.table('transactions');
  let migrated = 0;
  const errors: string[] = [];

  for (const investment of investments) {
    try {
      const invAccountId = `investment-${investment.id}`;
      await db.table('accounts').put({
        id: invAccountId,
        name: investment.name,
        type: 'ASSET',
        subType: 'INVESTMENT',
        currencyCode: 'INR',
        isSystem: false,
        isArchived: false,
      });

      const invTx = buildLedgerInvestmentOpeningTransaction(
        investment,
        invAccountId,
        walletToAccountMap,
        systemAccountIds
      );
      await transactionsTable.put(invTx);
      migrated++;
    } catch (error) {
      errors.push(String(error));
      console.warn(`Failed to convert investment ${investment.id}:`, error);
    }
  }

  return { migrated, errors };
}

function buildLedgerInvestmentOpeningTransaction(
  investment: Investment,
  investmentAccountId: string,
  walletToAccountMap: Map<string, string>,
  systemAccountIds: ReturnType<typeof initializeSystemAccounts>
): LedgerTransaction {
  const cents = Math.round(investment.currentValue * 100);
  const primaryWalletAccount =
    walletToAccountMap.values().next().value || systemAccountIds.reconciliation;

  if (cents === 0) {
    throw new Error(`Investment ${investment.id} has zero value`);
  }

  const entries: TransactionEntry[] = [
    { accountId: investmentAccountId, amount: cents },
    { accountId: primaryWalletAccount, amount: -cents },
  ];

  return {
    id: `investment-${investment.id}`,
    date: investment.startDate,
    description: `Investment ${investment.name} opening balance`,
    type: 'TRANSFER',
    amount: cents,
    entries,
    accountIds: [investmentAccountId, primaryWalletAccount],
    currencyCode: 'INR',
    isReverted: false,
    createdAt: new Date().toISOString(),
  };
}

async function migrateInvestmentTransactions(
  db: CustomDatabase,
  invTxs: InvestmentTransaction[],
  walletToAccountMap: Map<string, string>,
  systemAccountIds: ReturnType<typeof initializeSystemAccounts>
): Promise<{ migrated: number; errors: string[] }> {
  const transactionsTable = db.table('transactions');
  let migrated = 0;
  const errors: string[] = [];

  for (const invTx of invTxs) {
    try {
      const transaction = buildLedgerInvestmentTransaction(
        invTx,
        walletToAccountMap,
        systemAccountIds
      );
      await transactionsTable.put(transaction);
      migrated++;
    } catch (error) {
      errors.push(String(error));
      console.warn(`Failed to convert investment transaction ${invTx.id}:`, error);
    }
  }

  return { migrated, errors };
}

function buildLedgerInvestmentTransaction(
  invTx: InvestmentTransaction,
  walletToAccountMap: Map<string, string>,
  systemAccountIds: ReturnType<typeof initializeSystemAccounts>
): LedgerTransaction {
  const cents = Math.round(invTx.amount * 100);
  const primaryWalletAccount =
    walletToAccountMap.values().next().value || systemAccountIds.reconciliation;

  const accountId = `investment-${invTx.investmentId}`;

  let entries: TransactionEntry[];
  let type: LedgerTransactionType = 'TRANSFER';

  if (invTx.type === 'contribution') {
    entries = [
      { accountId, amount: cents },
      { accountId: primaryWalletAccount, amount: -cents },
    ];
  } else if (invTx.type === 'withdrawal') {
    entries = [
      { accountId, amount: -cents },
      { accountId: primaryWalletAccount, amount: cents },
    ];
  } else {
    entries = [
      { accountId: systemAccountIds.income, amount: cents },
      { accountId, amount: -cents },
    ];
    type = 'INCOME';
  }

  const sum = entries.reduce((acc, e) => acc + e.amount, 0);
  if (sum !== 0) {
    throw new Error(`Investment transaction ${invTx.id} does not balance: sum=${sum}`);
  }

  return {
    id: `investment-tx-${invTx.id}`,
    date: invTx.date,
    description: `Investment ${invTx.type} - ${invTx.notes || ''}`,
    type,
    amount: Math.abs(cents),
    entries,
    accountIds: [accountId, primaryWalletAccount, systemAccountIds.income],
    currencyCode: 'INR',
    isReverted: false,
    createdAt: new Date().toISOString(),
  };
}

async function migrateDebtInstallments(
  db: CustomDatabase,
  debtInstallments: DebtInstallment[],
  walletToAccountMap: Map<string, string>,
  systemAccountIds: ReturnType<typeof initializeSystemAccounts>
): Promise<{ migrated: number; errors: string[] }> {
  const txTable = db.table('transactions');
  let migrated = 0;
  const errors: string[] = [];

  for (const installment of debtInstallments) {
    try {
      const transaction: LedgerTransaction = {
        id: `debt-installment-${installment.id}`,
        date: installment.date,
        description: `Debt installment ${installment.debtId}`,
        type: 'TRANSFER',
        amount: Math.abs(Math.round(installment.amount * 100)),
        entries: [
          { accountId: systemAccountIds.debtPayable, amount: -Math.round(installment.amount * 100) },
          { accountId: walletToAccountMap.values().next().value || systemAccountIds.reconciliation, amount: Math.round(installment.amount * 100) },
        ],
        accountIds: [systemAccountIds.debtPayable],
        currencyCode: 'INR',
        isReverted: false,
        createdAt: new Date().toISOString(),
      };

      const sum = transaction.entries.reduce((sum, entry) => sum + entry.amount, 0);
      if (sum !== 0) {
        throw new Error(`Debt installment ${installment.id} not balanced (sum=${sum})`);
      }

      await txTable.put(transaction);
      migrated++;
    } catch (error) {
      errors.push(String(error));
      console.warn(`Failed to convert debt installment ${installment.id}:`, error);
    }
  }

  return { migrated, errors };
}

/**
 * Check if migration has been previously started (in-progress or complete)
 */
export async function checkMigrationStatus(): Promise<MigrationStatus> {
  try {
    const setting = await legacyDb.settings.get('migration.doubleEntryV1');
    if (!setting || !setting.value) {
      return { version: 1, status: 'pending' };
    }

    return { version: 1, status: setting.value as any };
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return { version: 1, status: 'pending' };
  }
}

/**
 * Mark migration as in-progress (should be called before migration starts)
 */
export async function markMigrationInProgress(): Promise<void> {
  await legacyDb.settings.put({
    key: 'migration.doubleEntryV1',
    value: 'in-progress',
  });
}

/**
 * Reset migration status to pending (for retry after failure)
 */
export async function resetMigrationStatus(): Promise<void> {
  await legacyDb.settings.put({
    key: 'migration.doubleEntryV1',
    value: 'pending',
  });
}

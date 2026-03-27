/**
 * LedgerDatabase - New IndexedDB instance for Double-Entry Accounting
 * 
 * Separate database from legacy i8e10DB to allow safe migration and easy rollback.
 * Uses a new database name (i8e10LedgerDB) and v1 schema for double-entry accounts + transactions.
 */

import {
  Account,
  AccountSubType,
  AccountType
} from '../../types';
import { CustomDatabase } from './database';

/**
 * Factory to create and initialize the ledger database.
 * This is a NEW IndexedDB instance separate from the legacy i8e10DB.
 */
export class LedgerDatabaseFactory {
  private static instance: CustomDatabase | null = null;

  static getInstance(): CustomDatabase {
    if (!LedgerDatabaseFactory.instance) {
      LedgerDatabaseFactory.instance = new CustomDatabase({
        name: 'i8e10LedgerDB',
        version: 1,
        schema: {
          accounts: {
            key: { path: 'id' },
            indexes: [
              { name: 'type' },
              { name: 'subType' },
              { name: 'name' },
              { name: 'isArchived' },
            ],
          },
          transactions: {
            key: { path: 'id' },
            indexes: [
              { name: 'date' },
              { name: 'type' },
              { name: 'isReverted' },
              { name: 'createdAt' },
              { name: 'currencyCode' },
              { name: 'accountIds', multiEntry: true },
            ],
          },
          settings: {
            key: { path: 'key' },
            indexes: [],
          },
        },
        migrations: [],
        requireMigrationContinuity: false,
      });
    }
    return LedgerDatabaseFactory.instance;
  }

  static async open(): Promise<CustomDatabase> {
    const db = LedgerDatabaseFactory.getInstance();
    await db.open();
    return db;
  }

  static async close(): Promise<void> {
    if (LedgerDatabaseFactory.instance) {
      LedgerDatabaseFactory.instance.close();
      LedgerDatabaseFactory.instance = null;
    }
  }
}

/**
 * Helper function to initialize system accounts in the ledger database.
 * These accounts are required to balance transactions.
 */
export async function initializeSystemAccounts(db: CustomDatabase): Promise<void> {
  const accounts = db.table('accounts');
  
  const systemAccounts: Account[] = [
    {
      id: 'sys-asset-cash',
      name: 'Cash / ரொக்கம்',
      type: AccountType.ASSET,
      subType: AccountSubType.CASH,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-asset-bank',
      name: 'Bank / வங்கி',
      type: AccountType.ASSET,
      subType: AccountSubType.BANK,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-liability-credit-card',
      name: 'Credit Card / கடன் அட்டை',
      type: AccountType.LIABILITY,
      subType: AccountSubType.CREDIT_CARD,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    // --- Income Accounts ---
    {
      id: 'sys-income-salary',
      name: 'Salary / சம்பளம்',
      type: AccountType.REVENUE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-income-freelance',
      name: 'Freelance / பகுதிநேர வருமானம்',
      type: AccountType.REVENUE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-income-gift',
      name: 'Gift / பரிசு',
      type: AccountType.REVENUE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-income-bonus',
      name: 'Bonus / போனஸ்',
      type: AccountType.REVENUE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-income-interest',
      name: 'Interest / வட்டி',
      type: AccountType.REVENUE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-income-dividend',
      name: 'Dividend / ஈவுத்தொகை',
      type: AccountType.REVENUE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },

    // --- Expense Accounts ---
    {
      id: 'sys-expense-groceries',
      name: 'Groceries / மளிகை',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-bills',
      name: 'Bills / கட்டணங்கள்',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-rent',
      name: 'Rent / வாடகை',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-food',
      name: 'Food / உணவு',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-shopping',
      name: 'Shopping / ஷாப்பிங்',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-travel',
      name: 'Travel / பயணம்',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-health',
      name: 'Health / மருத்துவம்',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-entertainment',
      name: 'Entertainment / பொழுதுபோக்கு',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-gift',
      name: 'Gift / பரிசு',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-transport',
      name: 'Transport / போக்குவரத்து',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-education',
      name: 'Education / கல்வி',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-expense-others',
      name: 'Others / மற்றவை',
      type: AccountType.EXPENSE,
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },

    // --- Equity accounts for balancing ---
    {
      id: 'sys-opening-balance-equity',
      name: 'Opening Balance Equity / தொடக்க இருப்பு மூலதனம்',
      type: AccountType.EQUITY,
      subType: AccountSubType.OPENING_BALANCE,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-reconciliation-adjustment',
      name: 'Reconciliation Adjustment / ஒப்புமைச் சரிசெய்தல்',
      type: AccountType.EXPENSE, // Can be EXPENSE or REVENUE - we default to EXPENSE
      subType: AccountSubType.GENERAL,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
    {
      id: 'sys-retained-earnings',
      name: 'Retained Earnings / தேக்கி வைக்கப்பட்ட வருவாய்',
      type: AccountType.EQUITY,
      subType: AccountSubType.RETAINED_EARNINGS,
      currencyCode: 'INR',
      isSystem: true,
      isArchived: false,
    },
  ];

  // Add each system account (use put to avoid duplicates on retry)
  for (const account of systemAccounts) {
    try {
      await accounts.put(account);
    } catch (error) {
      console.error(`Failed to initialize system account ${account.id}:`, error);
      throw error;
    }
  }

  console.log('System accounts initialized in ledger database');
}

/**
 * Helper to get a system account ID by type/subType.
 * Used during migration and transaction creation.
 */
export function getSystemAccountId(type: 'expense' | 'income' | 'reconciliation'): string {
  switch (type) {
    case 'expense':
      return 'sys-default-expense';
    case 'income':
      return 'sys-default-income';
    case 'reconciliation':
      return 'sys-reconciliation-adjustment';
    default:
      return 'sys-default-expense';
  }
}

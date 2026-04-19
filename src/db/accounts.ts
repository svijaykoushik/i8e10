/**
 * Account type definitions for the double-entry accounting system.
 *
 * Every financial entity (wallet, debt, investment) is represented as an Account
 * in the Chart of Accounts. Wallets are proper Account entities with stable IDs,
 * replacing the old settings.wallets string array.
 */

export type AccountType = 'asset' | 'liability' | 'income' | 'expense' | 'equity';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  subtype?: string;
  isActive: boolean;
  createdAt: string;
}

// --- System Account IDs (well-known, deterministic) ---

export const SYSTEM_ACCOUNT_IDS = {
  EXPENSE: 'acc_expense',
  INCOME: 'acc_income',
  EQUITY_OPENING: 'acc_equity_opening',
  CREDIT_CARD: 'acc_credit_card',
} as const;

// --- Helpers ---

/**
 * Generates a deterministic account ID for a wallet based on its name.
 * Used during migration to create stable, predictable IDs from existing wallet names.
 */
export function walletAccountId(walletName: string): string {
  const slug = walletName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `acc_wallet_${slug}`;
}

/**
 * Generates a deterministic account ID for a debt entity.
 */
export function debtAccountId(debtId: string, debtType: 'owed' | 'lent'): string {
  return debtType === 'owed'
    ? `acc_debt_payable_${debtId}`
    : `acc_debt_receivable_${debtId}`;
}

/**
 * Generates a deterministic account ID for an investment entity.
 */
export function investmentAccountId(investmentId: string): string {
  return `acc_investment_${investmentId}`;
}

// --- Seed Data Factories ---

export function createSystemAccounts(): Account[] {
  const now = new Date().toISOString();
  return [
    {
      id: SYSTEM_ACCOUNT_IDS.EXPENSE,
      name: 'Expense',
      type: 'expense',
      isActive: true,
      createdAt: now,
    },
    {
      id: SYSTEM_ACCOUNT_IDS.INCOME,
      name: 'Income',
      type: 'income',
      isActive: true,
      createdAt: now,
    },
    {
      id: SYSTEM_ACCOUNT_IDS.EQUITY_OPENING,
      name: 'Opening Balance',
      type: 'equity',
      subtype: 'opening_balance',
      isActive: true,
      createdAt: now,
    },
    {
      id: SYSTEM_ACCOUNT_IDS.CREDIT_CARD,
      name: 'Credit Card',
      type: 'liability',
      subtype: 'wallet',
      isActive: true,
      createdAt: now,
    },
  ];
}

/**
 * Creates a wallet account from a wallet name.
 */
export function createWalletAccount(walletName: string): Account {
  return {
    id: walletAccountId(walletName),
    name: walletName,
    type: 'asset',
    subtype: 'wallet',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates a debt account for a specific debt entity.
 */
export function createDebtAccount(debtId: string, debtType: 'owed' | 'lent', personName: string): Account {
  const isOwed = debtType === 'owed';
  return {
    id: debtAccountId(debtId, debtType),
    name: `${isOwed ? 'Payable' : 'Receivable'} — ${personName}`,
    type: isOwed ? 'liability' : 'asset',
    subtype: isOwed ? 'debt_payable' : 'debt_receivable',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates an investment account for a specific investment entity.
 */
export function createInvestmentAccount(investmentId: string, investmentName: string): Account {
  return {
    id: investmentAccountId(investmentId),
    name: `Investment — ${investmentName}`,
    type: 'asset',
    subtype: 'investment',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

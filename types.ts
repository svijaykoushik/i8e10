

export type ActiveView = 'transactions' | 'debts' | 'health' | 'investments';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card' | 'other';
  isDefault?: boolean;
  isArchived?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD format
  amount: number;
  description: string;
  walletId: string; // Foreign key to Wallet
  isReconciliation?: boolean;
  transferId?: string;
  investmentTransactionId?: string;
  debtId?: string;
  debtInstallmentId?: string;
}

export enum DebtType {
  LENT = 'lent', // Money you gave to someone
  OWED = 'owed', // Money you owe someone
}

export enum DebtStatus {
  OUTSTANDING = 'outstanding',
  SETTLED = 'settled',
  WAIVED = 'waived',
}

export interface DebtInstallment {
    id: string;
    debtId: string;
    date: string;
    amount: number;
    note?: string;
}

export interface Debt {
  id: string;
  type: DebtType;
  person: string;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  status: DebtStatus;
}

export enum InvestmentStatus {
    ACTIVE = 'active',
    SOLD = 'sold',
}

export interface Investment {
    id: string;
    name: string;
    type: string; // e.g., Stocks, Mutual Fund, Real Estate
    startDate: string;
    currentValue: number;
    status: InvestmentStatus;
    notes?: string;
}

export enum InvestmentTransactionType {
    CONTRIBUTION = 'contribution',
    WITHDRAWAL = 'withdrawal',
    DIVIDEND = 'dividend',
}

export interface InvestmentTransaction {
    id: string;
    investmentId: string;
    type: InvestmentTransactionType;
    date: string;
    amount: number;
    notes?: string;
}

export enum ActionType {
    TRANSACTION = 'transaction',
    DEBT = 'debt',
    INVESTMENT = 'investment'
}


export enum FilterPeriod {
  ALL = 'all',
  TODAY = 'today',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  CUSTOM = 'custom',
}

export enum TransactionFilterType {
  ALL = 'all',
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
}

export interface FilterState {
  period: FilterPeriod;
  startDate: string;
  endDate: string;
  walletId: string;
  transactionType: TransactionFilterType;
}

export enum DebtFilterStatus {
    ALL = 'all',
    OUTSTANDING = 'outstanding',
    SETTLED = 'settled',
}

export enum DebtFilterType {
    ALL = 'all',
    LENT = 'lent',
    OWED = 'owed',
}

export interface DebtFilterState {
    status: DebtFilterStatus;
    type: DebtFilterType;
    period: FilterPeriod;
    startDate: string;
    endDate: string;
}

export enum InvestmentFilterStatus {
    ALL = 'all',
    ACTIVE = 'active',
    SOLD = 'sold',
}

export interface InvestmentFilterState {
    status: InvestmentFilterStatus;
    type: string; // 'all' or a specific type name
    period: FilterPeriod;
    startDate: string;
    endDate: string;
}

export interface CashFlowFilterState {
  period: FilterPeriod;
    startDate: string;
    endDate: string;
}

// ============================================
// DOUBLE-ENTRY ACCOUNTING SYSTEM (Ledger)
// ============================================

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum AccountSubType {
  BANK = 'bank',
  WALLET = 'wallet',
  CASH = 'cash',
  INVESTMENT = 'investment',
  DEBT_RECEIVABLE = 'debt_receivable',
  DEBT_PAYABLE = 'debt_payable',
  CREDIT_CARD = 'credit_card',
  OPENING_BALANCE = 'opening_balance',
  RETAINED_EARNINGS = 'retained_earnings',
  GENERAL = 'general',
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  subType: AccountSubType;
  currencyCode: string; // ISO 4217 (e.g., 'USD', 'INR')
  isSystem: boolean; // true for system accounts like "Default Expense"
  isArchived: boolean;
}

export interface TransactionEntry {
  accountId: string;
  amount: number; // In cents. Positive = Debit, Negative = Credit
}

export enum LedgerTransactionType {
  EXPENSE = 'expense',
  INCOME = 'income',
  TRANSFER = 'transfer',
  RECONCILIATION = 'reconciliation',
}

export interface LedgerTransaction {
  id: string;
  date: string; // ISO 8601
  description: string;
  type: LedgerTransactionType;
  amount: number; // Absolute value in cents
  entries: TransactionEntry[]; // Embedded double-entry lines
  accountIds: string[]; // Array of account IDs involved (for multiEntry indexing)
  beneficiary?: string; // Payee or payer name
  currencyCode?: string; // ISO 4217
  exchangeRate?: number; // For multi-currency support (future)
  isReverted?: boolean; // Soft reversal flag
  createdAt?: string; // Audit timestamp
}

// Migration/System metadata
export interface MigrationStatus {
  version: number; // e.g., 1 for first double-entry migration
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}
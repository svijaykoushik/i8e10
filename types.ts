

export type ActiveView = 'transactions' | 'debts' | 'health' | 'investments';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD format
  amount: number;
  description: string;
  wallet?: string;
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
  wallet: string;
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
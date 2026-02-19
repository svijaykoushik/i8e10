import type {
  Transaction,
  Debt,
  Investment,
  InvestmentTransaction,
  DebtInstallment,
  Wallet,
} from "../../types";

// Minimal database interface used by CustomCollection to avoid circular import
export interface DatabaseLike {
  iterate<T = any>(storeName: string, direction?: IDBCursorDirection, filterFn?: (item: T) => boolean, whereCriteria?: string | Partial<T>, indexName?: string): Promise<T[]>;
  get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined>;
  put<T>(storeName: string, item: T): Promise<IDBValidKey>;
  add<T>(storeName: string, item: T): Promise<IDBValidKey>;
  delete(storeName: string, key: IDBValidKey): Promise<void>;
  iterateKeys?(storeName: string, direction?: IDBCursorDirection, filterFn?: (item: any) => boolean, whereCriteria?: string | Partial<any>, indexName?: string): Promise<IDBValidKey[]>;
  getKeyPath(storeName: string): string;
  clear(storeName: string): Promise<void>;
}

export interface IDBResult<T> {
  value: T;
  key: IDBValidKey;
}

export interface WhereClause<T> {
  equals(value: any): Collection<T>;
  above(value: any): Collection<T>;
  below(value: any): Collection<T>;
  between(
    lower: any,
    upper: any,
    includeLower?: boolean,
    includeUpper?: boolean
  ): Collection<T>;
  startsWith(prefix: string): Collection<T>;
  anyOf(values: any[]): Collection<T>;
  delete(): Promise<void>;
}

export interface Collection<T> {
  toArray(): Promise<T[]>;
  first(): Promise<T | undefined>;
  last(): Promise<T | undefined>;
  count(): Promise<number>;
  each(fn: (item: T, cursor: IDBCursorWithValue) => any): Promise<void>;
  filter(predicate: (item: T) => boolean): Collection<T>;
  where(criteria: string | Partial<T>): Collection<T>;
  reverse(): Collection<T>;
  bulkAdd(items: T[]): Promise<string[]>;
  bulkPut(items: T[]): Promise<string[]>;
  bulkDelete(keys: string[]): Promise<void>;
  update(id: string | number, changes: Partial<T>): Promise<void>;
  primaryKeys(): Promise<string[]>;
}

export interface Table<T, TKey = string> {
  name: string;
  get(key: TKey): Promise<T | undefined>;
  add(item: T): Promise<TKey>;
  put(item: T): Promise<TKey>;
  delete(key: TKey): Promise<void>;
  clear(): Promise<void>;
  where(keyPath: string): WhereClause<T>;
  toCollection(): Collection<T>;
  orderBy(keyPath: string): Collection<T>;
  reverse(): Collection<T>;
  filter(predicate: (item: T) => boolean): Collection<T>;
  bulkAdd(items: T[]): Promise<string[]>;
  bulkPut(items: T[]): Promise<string[]>;
  bulkDelete(keys: string[]): Promise<void>;
  update(id: TKey, changes: Partial<T>): Promise<void>;
}

export interface AppSetting {
  key: string;
  value: any;
}

export interface DatabaseSchema {
  transactionItems: Table<Transaction, string>;
  debts: Table<Debt, string>;
  investments: Table<Investment, string>;
  investmentTransactions: Table<InvestmentTransaction, string>;
  debtInstallments: Table<DebtInstallment>;
  settings: Table<AppSetting, string>;
  wallets: Table<Wallet, string>; // Added wallets to DatabaseSchema
}

export interface Middleware {
  table?: (name: string) => {
    beforeAdd?: <T>(v: T) => Promise<T> | T;
    afterGet?: <T>(v: T | undefined) => Promise<T | undefined> | T | undefined;
  };
}

export type TableNames = keyof DatabaseSchema;
export type TableType<T extends TableNames> = DatabaseSchema[T] extends Table<
  infer U
>
  ? U
  : never;


type GetItemType<T> = T extends Table<infer ItemType, any> ? keyof ItemType : never;
export type SensitiveFieldsMap = {
  // Map over the keys of DatabaseSchema (e.g., 'debts', 'transactionItems')
  [K in keyof DatabaseSchema]: ReadonlyArray<
    // For each key K, get the underlying item type (e.g., 'Transaction' for 'transactionItems')
    // and extract all its keys as allowed string literals (e.g., 'id', 'type', 'amount', etc.)
    GetItemType<DatabaseSchema[K]>
  >;
};
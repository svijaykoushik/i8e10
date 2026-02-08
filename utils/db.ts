import { db as coreDb } from "../src/db";
import type {
  Transaction,
  Debt,
  Investment,
  InvestmentTransaction,
  DebtInstallment,
} from "../types";
import type {
  AppSetting,
  DatabaseSchema,
  Middleware,
  SensitiveFieldsMap,
  TableNames,
  TableType,
} from "../src/db/types";
import * as cryptoService from "./cryptoService";
import { CustomTable } from "../src/db/table";

// Ensure core DB opens immediately (best-effort)
coreDb.open().catch(() => {});

type Model =
  | Transaction
  | Debt
  | Investment
  | InvestmentTransaction
  | DebtInstallment
  | AppSetting;

// Small helper that normalizes access to core table
const getCoreTable = async <N extends keyof DatabaseSchema>(
  name: N
): Promise<CustomTable<TableType<N>, string>> => {
  try {
    await coreDb.open();
    const table = coreDb.table<N>(name);
    if (!table) {
      throw new Error(`Table '${name}' not found`);
    }
    return table;
  } catch (error) {
    console.error(`Failed to access table '${name}':`, error);
    throw error;
  }
};

class TableProxy<T extends Model> {
  constructor(public name: keyof DatabaseSchema) {}

  private async core(): Promise<CustomTable<T, string>> {
    const coreTable = await getCoreTable(this.name);
    return coreTable as CustomTable<T, string>;
  }

  async get(key: string) {
    try {
      const t = await this.core();
      return await t.get(key);
    } catch (error) {
      console.error(
        `Failed to get item with key '${key}' from table '${this.name}':`,
        error
      );
      return undefined;
    }
  }

  async add(item: T) {
    try {
      const t = await this.core();
      return await t.add(item);
    } catch (error) {
      console.error(`Failed to add item to table '${this.name}':`, error);
      throw error;
    }
  }

  async put(item: T) {
    try {
      const t = await this.core();
      return await t.put(item);
    } catch (error) {
      console.error(`Failed to put item in table '${this.name}':`, error);
      throw error;
    }
  }

  async delete(key: string) {
    try {
      const t = await this.core();
      return await t.delete(key);
    } catch (error) {
      console.error(
        `Failed to delete item with key '${key}' from table '${this.name}':`,
        error
      );
      throw error;
    }
  }

  async clear() {
    try {
      const t = await this.core();
      return await t.clear();
    } catch (error) {
      console.error(`Failed to clear table '${this.name}':`, error);
      throw error;
    }
  }

  async toArray() {
    try {
      const t = await this.core();
      return await t.toCollection().toArray() as T[];
    } catch (error) {
      console.error(`Failed to get items from table '${this.name}':`, error);
      return [];
    }
  }

  async toCollection() {
    try {
      const t = await this.core();
      return t.toCollection();
    } catch (error) {
      console.error(
        `Failed to get collections from table '${this.name}':`,
        error
      );
      return null;
    }
  }

  orderBy(keyPath: string) {
    try {
      return coreDb.table(this.name).orderBy(keyPath);
    } catch (error) {
      console.error(
        `Failed to order items by '${keyPath}' in table '${this.name}':`,
        error
      );
      throw error;
    }
  }

  reverse() {
    try {
      return coreDb.table(this.name).reverse();
    } catch (error) {
      console.error(`Failed to reverse items in table '${this.name}':`, error);
      throw error;
    }
  }

  filter(fn: (item: T) => boolean) {
    try {
      return coreDb.table(this.name).filter(fn);
    } catch (error) {
      console.error(`Failed to filter items in table '${this.name}':`, error);
      throw error;
    }
  }

  async bulkAdd(items: T[]) {
    const t = await this.core();
    return t.bulkAdd(items);
  }
  async bulkPut(items: T[]) {
    const t = await this.core();
    return t.bulkPut(items);
  }
  async bulkDelete(keys: string[]) {
    const t = await this.core();
    return t.bulkDelete(keys);
  }

  async update(id: string, changes: Partial<T>) {
    const t = await this.core();
    const existing = await t.get(id);
    if (!existing) return 0;
    await t.put({ ...existing, ...changes });
    return 1;
  }

  where(criteria: string | Partial<T>) {
    // Return a lightweight query object with toArray() and delete()
    const self = this;
    return {
      async toArray(): Promise<T[]> {
        const coll = (coreDb.table(self.name)).toCollection();
        const items = await coll.toArray();
        if (typeof criteria === "string") return items as T[];
        return items.filter((item: any) =>
          Object.entries(criteria).every(([k, v]) => item[k] === v)
        ) as T[];
      },
      async delete() {
        const matches = await this.toArray();
        for (const it of matches) {
          await coreDb.table(self.name).delete(it.id);
        }
      },
      anyOf(values: any[]) {
        return {
          async delete() {
            const coll = coreDb.table(self.name).toCollection();
            const items = await coll.toArray();
            const matches = items.filter((item: any) =>
              values.includes(item[criteria as string])
            );
            for (const it of matches) {
              await coreDb.table(self.name).delete((it as any).id);
            }
          },
          async toArray() {
            const coll = coreDb.table(self.name).toCollection();
            const items = await coll.toArray();
            return items.filter((item: any) =>
              values.includes(item[criteria as string])
            );
          },
          async primaryKeys() {
            const arr = await this.toArray();
            return arr.map((i: any) => i.id);
          },
        };
      },
    };
  }
}

type TableName =
  | "transactionItems"
  | "debts"
  | "investments"
  | "investmentTransactions"
  | "settings";

interface DBTransaction {
  // Signature 1: db.transaction('rw', callback) => ALL tables
  <T>(mode: "rw" | "r", callback: TransactionCallback<T>): Promise<T>;

  // Signature 2: db.transaction('rw', tables[], callback)
  <T>(
    mode: "rw" | "r",
    tables: TableArg[],
    callback: TransactionCallback<T>
  ): Promise<T>;

  // Signature 3: db.transaction('rw', table1, table2, ..., callback)
  // This uses a rest parameter for tables and requires the last element to be the callback.
  <T>(
    mode: "rw" | "r",
    t1: TableArg,
    t2: TableArg | TransactionCallback<T>,
    t3?: TableArg | TransactionCallback<T>,
    t4?: TableArg | TransactionCallback<T>,
    t5?: TableArg | TransactionCallback<T>,
    // You can add more optional arguments here if you expect more tables
    ...rest: (TableArg | TransactionCallback<T>)[]
  ): Promise<T>;
}

interface DB {
  // 1. Table Properties with strict types
  transactionItems: TableProxy<Transaction>;
  debts: TableProxy<Debt>;
  investments: TableProxy<Investment>;
  investmentTransactions: TableProxy<InvestmentTransaction>;
  debtInstallements: TableProxy<DebtInstallment>;
  settings: TableProxy<AppSetting>;

  // A helper structure to map names to proxies, useful for transaction overloads
  readonly tables: {
    transactionItems: TableProxy<Transaction>;
    debts: TableProxy<Debt>;
    investments: TableProxy<Investment>;
    investmentTransactions: TableProxy<InvestmentTransaction>;
    settings: TableProxy<AppSetting>;
  };

  // 2. Utility Methods
  // The 'transaction' method will be defined with overloads below
  transaction: DBTransaction;

  // Strict typing for use()
  use(middleware: Middleware): this; // The return type `this` allows method chaining

  // Strict typing for liveQuery()
  liveQuery<T>(queryFn: () => Promise<T>): any; // Return type depends on Dexie's LiveQuery type, using `any` as a shim for the complex Observable/Promise type

  // Methods added at the end of the file
  delete(): Promise<void>;
  open(): Promise<void>;
}

// Transaction Callback Type
type TransactionCallback<T> = () => Promise<T> | T;

// A Table argument can be a TableName string OR the TableProxy instance itself.
type TableArg = TableName | TableProxy<any>;

// Build the compatibility `db` object expected by the app
export const db: DB = {
  transactionItems: new TableProxy<Transaction>("transactionItems"),
  debts: new TableProxy<Debt>("debts"),
  investments: new TableProxy<Investment>("investments"),
  debtInstallements: new TableProxy<DebtInstallment>("debtInstallments"),
  investmentTransactions: new TableProxy<InvestmentTransaction>(
    "investmentTransactions"
  ),
  settings: new TableProxy<AppSetting>("settings"),

  // Helper object for table properties
  tables: {
    transactionItems: new TableProxy<Transaction>("transactionItems"),
    debts: new TableProxy<Debt>("debts"),
    investments: new TableProxy<Investment>("investments"),
    investmentTransactions: new TableProxy<InvestmentTransaction>(
      "investmentTransactions"
    ),
    settings: new TableProxy<AppSetting>("settings"),
  },

  // transaction shim: support multiple signatures used across the app
  async transaction(modeOrTables: any, ...rest: any[]) {
    // Possible call patterns:
    // db.transaction('rw', [tables], callback)
    // db.transaction('rw', db.table1, db.table2, callback)
    // db.transaction('rw', callback) => use all tables
    let mode: IDBTransactionMode = "readwrite";
    let tables: TableNames[] = [];
    let callback: () => Promise<any> | any;

    if (typeof modeOrTables === "string") {
      mode = modeOrTables === "rw" ? "readwrite" : "readonly";
      if (rest.length === 1 && typeof rest[0] === "function") {
        // db.transaction('rw', callback)
        tables = [
          "transactionItems",
          "debts",
          "investments",
          "investmentTransactions",
          "settings",
        ];
        callback = rest[0];
      } else {
        // last arg is callback
        callback = rest[rest.length - 1];
        const tableArgs = rest.slice(0, -1);
        if (tableArgs.length === 1 && Array.isArray(tableArgs[0])) {
          tables = tableArgs[0].map((t: any) =>
            typeof t === "string" ? t : t.name
          );
        } else {
          tables = tableArgs.map((t: any) =>
            typeof t === "string" ? t : t.name
          );
        }
      }
    } else {
      throw new Error("Unsupported db.transaction signature");
    }

    // delegate to coreDb (which expects tables, mode, callback)
    return coreDb.transaction(tables, mode, callback);
  },

  use(middleware: any) {
    // If coreDb supports use, call it; otherwise, provide basic hook
    if (coreDb.use) return coreDb.use(middleware);
    return this;
  },

  liveQuery<T>(queryFn: () => Promise<T>) {
    return coreDb.liveQuery(queryFn);
  },

  // passthrough for operations expected by the app
  async delete() {
    try {
      if (coreDb.deleteStore) {
        const allTables: TableName[] = [
          "transactionItems",
          "debts",
          "investments",
          "investmentTransactions",
          "settings"
        ];
        await Promise.all(allTables.map((table)=>coreDb.truncate(table)));
        return;
      }
    } catch (error) {
      console.error("Fatal error during database deletion:", error);
      throw error;
    }
  },

  async open() {
    try {
      await coreDb.open();
    } catch (error) {
      console.error("Failed to open database:", error);
      throw error;
    }
  },
};

export const applyEncryptionMiddleware = (cs = cryptoService) => {
  if (!db.use) return;

  interface EncryptedField {
    iv: string;
    ciphertext: string;
  }

  const sensitiveFieldsMap: SensitiveFieldsMap = {
    transactionItems: ["description", "amount"],
    debts: ["description", "amount", "person"],
    investments: ["name", "notes", "currentValue"],
    investmentTransactions: ["amount", "notes"],
    debtInstallments: ["amount", "note"],
    settings: [],
  } as const;

  function isModel(value: unknown): value is Model {
    if (!value || typeof value !== "object") return false;
    // Basic check for common properties that should exist in Model types
    return "id" in value;
  }

  const encryptObject = async (
    obj: unknown,
    fields: ReadonlyArray<string>
  ): Promise<unknown> => {
    if (!isModel(obj) || !fields.length) return obj;

    const key = cs.getKey();
    if (!key) {
      console.error("No encryption key available");
      return obj;
    }

    const encrypted = { ...obj };
    for (const field of fields) {
      if (field in obj && obj[field as keyof typeof obj] != null) {
        const value = obj[field as keyof typeof obj];
        if (typeof value === "string" || typeof value === "number") {
          const { iv, ciphertext } = await cs.encrypt(String(value), key);
          (encrypted as Record<string, unknown>)[field] = { iv, ciphertext };
        }
      }
    }
    return encrypted;
  };

  const decryptObject = async (
    obj: unknown,
    fields: ReadonlyArray<string>
  ): Promise<unknown> => {
    if (!isModel(obj) || !fields.length) return obj;

    const key = cs.getKey();
    if (!key) {
      console.error("No encryption key available");
      return obj;
    }

    const decrypted = { ...obj };
    for (const field of fields) {
      const value = obj[field as keyof typeof obj];
      if (
        value &&
        typeof value === "object" &&
        "iv" in value &&
        "ciphertext" in value &&
        typeof (value as EncryptedField).iv === "string" &&
        typeof (value as EncryptedField).ciphertext === "string"
      ) {
        try {
          const decryptedValue = await cs.decrypt(value as EncryptedField, key);
          (decrypted as Record<string, unknown>)[field] =
            field === "amount" ? parseFloat(decryptedValue) : decryptedValue;
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          decrypted[field] = value;
        }
      }
    }
    return decrypted;
  };

  db.use({
    table: (name: string) => ({
      beforeAdd: async <T>(value: T): Promise<T> => {
        if (typeof value === "object" && value !== null) {
          const fields =
            sensitiveFieldsMap[name as keyof typeof sensitiveFieldsMap] || [];
          return (await encryptObject(value, fields)) as T;
        }
        return value;
      },
      afterGet: async <T>(value: T): Promise<T> => {
        if (!value) return value;
        const fields =
          sensitiveFieldsMap[name as keyof typeof sensitiveFieldsMap] || [];

        if((fields as readonly string[]).includes('note')) debugger;

        if (Array.isArray(value)) {
          return Promise.all(
            value.map((v) =>
              typeof v === "object" ? decryptObject(v, fields) : v
            )
          ) as Promise<T>;
        }

        return typeof value === "object"
          ? ((await decryptObject(value, fields)) as T)
          : value;
      },
    }),
  });
};

// Initialize middleware immediately so the compatibility `db` object
// uses encryption/decryption hooks where applicable.
// This is safe to call here because `db.use` is a lightweight shim
// and `cryptoService` manages the session key separately.
applyEncryptionMiddleware();

export type { AppSetting };

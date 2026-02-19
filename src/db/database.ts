import { EventEmitter } from "./eventEmitter";
import { CustomTable } from "./table";
import { DatabaseLike, Middleware, TableNames, TableType } from "./types";

export class CustomDatabase implements DatabaseLike{
  private db?: IDBDatabase;
  private eventEmitter: EventEmitter;
  private storeSpecs: Record<string, { keyPath: string; indexes: string[] }> =
    {};
  private static instance: CustomDatabase;
  private transactionDepth = 0; // Track nested transaction depth

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  // Middleware support
  private middleware: {
    table?: (name: string) => {
      beforeAdd?: <T>(v: T) => Promise<T> | T;
      afterGet?: <T>(
        v: T | undefined
      ) => Promise<T | undefined> | T | undefined;
    };
  } = {};

  private getTableMiddleware<T>(name: string) {
    if (this.middleware.table) {
      return this.middleware.table(name) as {
        beforeAdd?: (v: T) => Promise<T> | T;
        afterGet?: (v: T | undefined) => Promise<T | undefined> | T | undefined;
      };
    }
    return {};
  }

  use(middleware: Middleware): this {
    this.middleware = middleware;
    return this;
  }

  static getInstance(): CustomDatabase {
    if (!CustomDatabase.instance) {
      CustomDatabase.instance = new CustomDatabase();
    }
    return CustomDatabase.instance;
  }

  async open(version: number = 3): Promise<void> {
    if (this.db) {
       if (this.db.version === version) return;
       // If versions mismatch and we are forcing a different one (e.g. for backup check on v2)
       // we might need to close and reopen, but usually we just return if already open.
       // For this migration flow, we might be calling open(2) then open(3).
       this.db.close();
       this.db = undefined;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open("i8e10DB", version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;

        // Handle version changes from other tabs
        if (this.db) {
          this.db.onversionchange = () => {
            this.db!.close();
            // We don't prefer rejecting here as it might happen after successful open
            // reject("Database version changed in another tab, connection closed"); 
          };
        }
        resolve();
      };

      request.onupgradeneeded = async (event) => {
        const db = request.result;
        const transaction = request.transaction!; // Transaction for the upgrade
        
        // --- V1/V2 Stores (Existing) ---
        const stores: Record<string, { keyPath: string; indexes: string[] }> = {
          transactionItems: {
            keyPath: "id",
            indexes: [
              "date",
              "wallet", // Old index, we might want to keep or add walletId too
              "walletId", // New index
              "type",
              "transferId",
              "investmentTransactionId",
              "debtId",
              "debtInstallMentId"
            ],
          },
          debts: { keyPath: "id", indexes: ["date", "status", "type"] },
          investments: {
            keyPath: "id",
            indexes: ["startDate", "status", "type"],
          },
          investmentTransactions: {
            keyPath: "id",
            indexes: ["investmentId", "date", "type"],
          },
          debtInstallments: {
            keyPath: "id",
            indexes: ["debtId", "date"]
          },
          settings: { keyPath: "key", indexes: [] },
          // --- V3 Store ---
          wallets: { keyPath: "id", indexes: ["name"] },
        };

        // keep specs for later lookup (though specs might not be fully accurate during upgrade transaction usage)
        this.storeSpecs = stores;

        // 1. Create/Update Stores
        Object.entries(stores).forEach(([storeName, spec]) => {
          let store: IDBObjectStore;
          if (!db.objectStoreNames.contains(storeName)) {
            store = db.createObjectStore(storeName, { keyPath: spec.keyPath });
          } else {
            store = transaction.objectStore(storeName);
          }
          
          spec.indexes.forEach((indexName) => {
            if (indexName !== spec.keyPath && !store.indexNames.contains(indexName)) {
              store.createIndex(indexName, indexName);
            }
          });
        });

        // 2. Migration Logic (V2 -> V3)
        if (event.oldVersion < 3) {
           console.log("Migrating to Database Version 3...");
           
           const txStore = transaction.objectStore("transactionItems");
           const walletsStore = transaction.objectStore("wallets");
           const settingsStore = transaction.objectStore("settings");
           
           // Helper to get all items from a store
           const getAll = (store: IDBObjectStore): Promise<any[]> => {
               return new Promise((resolve, reject) => {
                   const req = store.getAll();
                   req.onsuccess = () => resolve(req.result);
                   req.onerror = () => reject(req.error);
               });
           };

           // We need to wait for data retrieval *inside* the upgrade transaction?
           // Actually, we can just attach onsuccess handlers to requests.
           // However, using async/await inside onupgradeneeded can be tricky because the transaction
           // might auto-commit if we await something that isn't an IDBRequest.
           // BUT, since we are using promises wrapping IDBRequests, it should be fine IF we chain them properly.
           // To be safe, we will use a more callback-based approach or ensure the transaction stays active.
           // EDIT: Promisified IDB calls usually work fine if they are part of the chain.
           
           const transactions = await getAll(txStore);
           const settingsItems = await getAll(settingsStore);
           
           // Extract existing wallets from Settings (prefer user order)
           const walletsSetting = settingsItems.find(s => s.key === "wallets");
           const currentDefaultWalletSetting = settingsItems.find(s => s.key === "defaultWallet");
           
           const existingWalletNames: string[] = walletsSetting ? walletsSetting.value : ['Cash / ரொக்கம்', 'Bank / வங்கி'];
           const capturedUniqueWallets = new Set<string>(existingWalletNames);
           
           // Also capture any wallets mentioned in transactions that might have been deleted/orphaned from settings
           transactions.forEach(tx => {
               if (tx.wallet) capturedUniqueWallets.add(tx.wallet);
           });
           
           // Create Wallet Entities
           const walletNameMap = new Map<string, string>(); // Name -> ID
           
           for (const name of Array.from(capturedUniqueWallets)) {
                // Generate a simple ID or UUID. Since we don't have crypto.randomUUID in all contexts reliably inside this scope without imports?
                // We can use a simple random string generator or rely on the one from utils if imported. 
                // Since this is inside the class method, we can't easily import if not already there, but we can assume global crypto or Math.random
                const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                
                // Determine type based on name keywords for fun/future-proofing
                let type = 'other';
                 const lowerName = name.toLowerCase();
                if (lowerName.includes('bank') || lowerName.includes('வங்கி')) type = 'bank';
                else if (lowerName.includes('cash') || lowerName.includes('ரொக்கம்')) type = 'cash';
                
                const walletObj = {
                    id,
                    name,
                    type,
                    isDefault: name === currentDefaultWalletSetting?.value,
                    isArchived: false
                };
                
                walletNameMap.set(name, id);
                await new Promise<void>((resolve, reject) => {
                    const req = walletsStore.add(walletObj);
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                });
           }
           
           // Update Transactions with walletId
           for (const tx of transactions) {
               if (tx.wallet && walletNameMap.has(tx.wallet)) {
                   tx.walletId = walletNameMap.get(tx.wallet);
                   // We keep tx.wallet for a moment if we want, OR delete it. 
                   // The plan says "Replace". Let's verify if we should keep it for safety.
                   // Types updated to remove `wallet`, so we should probably remove it.
                   // But since this is `any` during migration, it's fine.
                   // Ideally we delete it to clean up.
                   delete tx.wallet; 
               } else if (!tx.walletId) {
                   // Fallback for transactions without wallet (legacy/bug?)
                   // Assign to default or first wallet?
                   // For now, let's leave valid ones.
               }
               
               await new Promise<void>((resolve, reject) => {
                   const req = txStore.put(tx);
                   req.onsuccess = () => resolve();
                   req.onerror = () => reject(req.error);
               });
           }
           
           // Update Settings
           // 1. Remove 'wallets' string array
           await new Promise<void>((resolve, reject) => {
                const req = settingsStore.delete("wallets");
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
           });
           
           // 2. Update defaultWallet to use ID
           if (currentDefaultWalletSetting && walletNameMap.has(currentDefaultWalletSetting.value)) {
                currentDefaultWalletSetting.value = walletNameMap.get(currentDefaultWalletSetting.value);
                await new Promise<void>((resolve, reject) => {
                    const req = settingsStore.put(currentDefaultWalletSetting);
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                });
           }
           
           console.log("Migration to V3 Complete.");
        }
      };
    });
  }

  // Check if a wallet has dependencies (Transactions)
  async checkWalletDependencies(walletId: string): Promise<number> {
      if (!this.db) await this.open();
      // We only strictly check transactions as per final plan
      const txCount = await this.count("transactionItems", "walletId", walletId);
      return txCount;
  }
  
  // Helper to count items by index
  async count(storeName: string, indexName: string, value: any): Promise<number> {
      if (!this.db) throw new Error("Database not opened");
      return new Promise((resolve, reject) => {
          const tx = this.db!.transaction(storeName, "readonly");
          const store = tx.objectStore(storeName);
          const index = store.index(indexName);
          const req = index.count(value);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
      });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = undefined;
    }
  }

  table<T extends TableNames>(name: T): CustomTable<TableType<T>> {
    if (!this.db) {
      throw new Error("Database not opened. Call open() first.");
    }
    return new CustomTable<TableType<T>>(this, name);
  }

  // Expose keyPath for a store
  getKeyPath(storeName: string): string {
    const spec = this.storeSpecs[storeName];
    if (spec) return spec.keyPath;
    // fallback: read from live db objectStore (synchronous during open)
    if (!this.db) throw new Error("Database not opened. Call open() first.");
    const tx = this.db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    return store.keyPath as string;
  }

  // Low-level CRUD helpers that centralize IndexedDB access
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    if (!this.db) throw new Error("Database not opened. Call open() first.");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = async () => {
        let result = req.result as T | undefined;
        const mw = this.getTableMiddleware<T>(storeName);
        if (mw.afterGet) {
          try {
            result = await mw.afterGet(result);
          } catch (e) {
            // If middleware throws, fallback to original result
          }
        }
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    if (!this.db) throw new Error("Database not opened. Call open() first.");
    let toAdd = item;
    const mw = this.getTableMiddleware<T>(storeName);
    if (mw.beforeAdd) {
      try {
        toAdd = await mw.beforeAdd(item);
      } catch (e) {
        // If middleware throws, fallback to original item
      }
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.add(toAdd);
      req.onsuccess = () => {
        try {
          // Only notify if not inside a managed transaction
          if (this.transactionDepth === 0) {
            this.notifyChange();
          }
        } catch (_) {}
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(storeName: string, item: T): Promise<IDBValidKey> {
    if (!this.db) throw new Error("Database not opened. Call open() first.");
    let toPut = item;
    const mw = this.getTableMiddleware<T>(storeName);
    if (mw.beforeAdd) {
      try {
        toPut = await mw.beforeAdd(item);
      } catch (e) {
        // If middleware throws, fallback to original item
      }
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.put(toPut);
      req.onsuccess = () => {
        try {
          // Only notify if not inside a managed transaction
          if (this.transactionDepth === 0) {
            this.notifyChange();
          }
        } catch (_) {}
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) throw new Error("Database not opened. Call open() first.");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => {
        try {
          // Only notify if not inside a managed transaction
          if (this.transactionDepth === 0) {
            this.notifyChange();
          }
        } catch (_) {}
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error("Database not opened. Call open() first.");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => {
        try {
          this.notifyChange();
        } catch (_) {}
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Delete an entire object store (datastore) from the IndexedDB database.
  // This requires opening the database with a higher version and removing
  // the store in the onupgradeneeded handler.
  async deleteDatastore(storeName: string): Promise<void> {
    // Ensure DB is open so we can read the current version and objectStoreNames
    if (!this.db) await this.open();

    // If store doesn't exist, ensure we remove any stored spec and return.
    if (!this.db!.objectStoreNames.contains(storeName)) {
      delete this.storeSpecs[storeName];
      return;
    }

    return new Promise((resolve, reject) => {
      const oldDb = this.db!;
      const newVersion = oldDb.version + 1;

      // Close the current connection before attempting an upgrade.
      try {
        oldDb.close();
      } catch (_) {}

      const request = indexedDB.open("i8e10DB", newVersion);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (db.objectStoreNames.contains(storeName)) {
          try {
            db.deleteObjectStore(storeName);
          } catch (e) {
            // swallow — we'll handle errors on onsuccess/ onerror
          }
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        // Remove spec if present
        delete this.storeSpecs[storeName];
        try {
          this.notifyChange();
        } catch (_) {}
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Alias for convenience
  async deleteStore(storeName: string): Promise<void> {
    return this.deleteDatastore(storeName);
  }

  // Iterate items using a cursor and return items matching optional filter/where
  async iterate<T = any>(
    storeName: string,
    direction: IDBCursorDirection = "next",
    filterFn?: (item: T) => boolean,
    whereCriteria?: string | Partial<T>,
    indexName?: string
  ): Promise<T[]> {
    if (!this.db) throw new Error("Database not opened. Call open() first.");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const items: T[] = [];
      const mw = this.getTableMiddleware<T>(storeName);
      const rawItems: T[] = [];
      // If an indexName was provided and the store has that index, iterate via the index
      let request: IDBRequest<IDBCursorWithValue | null>;
      try {
        if (indexName && (store.indexNames as any).contains && (store.indexNames as any).contains(indexName)) {
          const idx = store.index(indexName);
          request = idx.openCursor(null, direction);
        } else if (indexName && Array.from(store.indexNames).includes(indexName)) {
          const idx = store.index(indexName);
          request = idx.openCursor(null, direction);
        } else {
          request = store.openCursor(null, direction);
        }
      } catch (e) {
        // In case index lookup fails, fallback to store cursor
        request = store.openCursor(null, direction);
      }

      // Collect raw items synchronously while the transaction is active.
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          rawItems.push(cursor.value as T);
          cursor.continue();
        } else {
          // Cursor finished — transaction is complete now. Apply middleware
          // transforms and filtering outside the transaction to avoid
          // "transaction not active" errors.
          (async () => {
            const finalItems: T[] = [];

            if (mw.afterGet) {
              // Process items sequentially to preserve order and to match
              // potential side-effects ordering.
              for (const raw of rawItems) {
                try {
                  const maybe = await mw.afterGet(raw);
                  if (maybe === undefined) continue; // skip this item
                  finalItems.push(maybe as T);
                } catch (e) {
                  // If middleware throws, fall back to original item
                  finalItems.push(raw);
                }
              }
            } else {
              // No middleware — keep raw items
              finalItems.push(...rawItems);
            }

            // Apply whereCriteria and filterFn on the transformed items.
            const filtered: T[] = [];
            for (const item of finalItems) {
              let keep = true;
              if (whereCriteria) {
                if (typeof whereCriteria === "string") {
                  keep = this.getValue(item, whereCriteria) !== undefined;
                } else {
                  keep = Object.entries(whereCriteria as Partial<T>).every(
                    ([k, v]) => (item as any)[k] === v
                  );
                }
              }
              if (keep && (!filterFn || filterFn(item))) filtered.push(item);
            }

            resolve(filtered);
          })().catch((err) => reject(err));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Iterate and return primary keys (cursor.primaryKey)
  async iterateKeys(
     storeName: string,
     direction: IDBCursorDirection = "next",
     filterFn?: (item: any) => boolean,
     whereCriteria?: string | Partial<any>,
     indexName?: string
  ): Promise<IDBValidKey[]> {
    if (!this.db) throw new Error("Database not opened. Call open() first.");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const keys: IDBValidKey[] = [];
      let request: IDBRequest<IDBCursorWithValue | null>;
      try {
        if (indexName && (store.indexNames as any).contains && (store.indexNames as any).contains(indexName)) {
          const idx = store.index(indexName);
          request = idx.openCursor(null, direction);
        } else if (indexName && Array.from(store.indexNames).includes(indexName)) {
          const idx = store.index(indexName);
          request = idx.openCursor(null, direction);
        } else {
          request = store.openCursor(null, direction);
        }
      } catch (e) {
        request = store.openCursor(null, direction);
      }
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const item = cursor.value;
          let keep = true;
          if (whereCriteria) {
            if (typeof whereCriteria === "string") {
              keep = this.getValue(item, whereCriteria) !== undefined;
            } else {
              keep = Object.entries(whereCriteria as Partial<any>).every(
                ([k, v]) => item[k] === v
              );
            }
          }
          if (keep && (!filterFn || filterFn(item)))
            keys.push(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve(keys);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private getValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  }

  // Live Query Implementation
  liveQuery<T>(queryFn: () => Promise<T>): {
    subscribe: (callback: (result: T) => void) => () => void;
  } {
    let currentResult: T | undefined;
    let subscribers: ((result: T) => void)[] = [];

    const notify = async () => {
      try {
        const result = await queryFn();
        if (JSON.stringify(result) !== JSON.stringify(currentResult)) {
          currentResult = result;
          subscribers.forEach((callback) => callback(result));
        }
      } catch (error) {
        console.error("Live query error:", error);
      }
    };

    // Set up change detection
    this.eventEmitter.on("change", notify);

    return {
      subscribe: (callback: (result: T) => void) => {
        subscribers.push(callback);
        notify(); // Initial execution
        return () => {
          subscribers = subscribers.filter((cb) => cb !== callback);
          if (subscribers.length === 0) {
            this.eventEmitter.removeListener("change", notify);
          }
        };
      },
    };
  }

  // Method to notify changes
  notifyChange(): void {
    this.eventEmitter.emit("change");
  }

  // Transaction support
  async transaction<T>(
    tables: TableNames[],
    mode: IDBTransactionMode,
    callback: () => Promise<T>
  ): Promise<T> {
    if (!this.db) {
      throw new Error("Database not opened. Call open() first.");
    }
    
    this.transactionDepth++;
    
    let _resolveResult!: (value: T) => void;
    let _rejectResult!: (error: any) => void;
    
    const callbackResultPromise = new Promise<T>((resolve, reject) => {
        _resolveResult = resolve;
        _rejectResult = reject;
    });
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(tables, mode);

      let result: T | undefined; // Variable to hold the final result

      // Ensure we only resolve/reject once and always notify listeners
      let settled = false;
      const settleResolve = (value: T) => {
        if (!settled) {
          settled = true;
          this.transactionDepth--;
          try {
            this.notifyChange();
          } catch (e) {
            /* swallow - shouldn't fail */
          }
          resolve(value);
        }
      };
      const settleReject = (err: any) => {
        if (!settled) {
          settled = true;
          this.transactionDepth--;
          try {
            this.notifyChange();
          } catch (e) {
            /* swallow - shouldn't fail */
          }
          reject(err);
        }
      };

      tx.onerror = () => settleReject(tx.error);
      tx.onabort = () =>
        settleReject(tx.error ?? new Error("Transaction aborted"));
      tx.oncomplete = () => {
        callbackResultPromise.then((finalResult)=>settleResolve(finalResult))
        // settleResolve(result as T);
      };

      // Execute callback
      Promise.resolve()
        .then(() => callback()) 
        .then((value) => {
          _resolveResult(value);
        })
        .catch((error) => {
          // If the callback fails, we immediately abort the IndexedDB transaction
          // and reject the wrapper promise.
          _rejectResult(error);
          try {
            tx.abort();
          } catch (_) {}
          settleReject(error);
        });
    });
  }

  // Version management
  version(versionNumber: number): CustomDatabase {
    // Implementation for versioning if needed
    return this;
  }

  /**
   * Truncates a table by removing all records while keeping the table structure intact
   * @param tableName The name of the table to truncate
   * @returns Promise that resolves when the table has been truncated
   * @throws Error if the database is not opened or if the table doesn't exist
   */
  async truncate(tableName: TableNames): Promise<void> {
    if (!this.db) {
      throw new Error("Database not opened. Call open() first.");
    }

    return this.transaction([tableName], "readwrite", async () => {
      const store = this.db!.transaction(tableName, "readwrite").objectStore(tableName);
      const clearRequest = store.clear();

      return new Promise<void>((resolve, reject) => {
        clearRequest.onerror = () => reject(clearRequest.error);
        clearRequest.onsuccess = () => resolve();
      });
    });
  }
}

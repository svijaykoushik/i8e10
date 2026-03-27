import { EventEmitter } from './eventEmitter';
import { CustomTable } from './table';
import {
  DatabaseLike,
  CustomDatabaseConfig,
  SchemaDefinition,
  MigrationDefinition,
  MigrationContext,
  TableNames,
  TableType,
  Middleware,
} from './types';

export class CustomDatabase implements DatabaseLike {
  private db?: IDBDatabase;
  private eventEmitter = new EventEmitter();
  private storeSpecs: SchemaDefinition = {};
  private transactionDepth = 0;
  private migrationsRun: number[] = [];

  constructor(private config: CustomDatabaseConfig) {
    this.storeSpecs = config.schema;
  }

  use(middleware: Middleware): this {
    this.middleware = middleware;
    return this;
  }

  private middleware: Middleware = {};

  private getTableMiddleware<T>(name: string) {
    if (this.middleware.table) {
      return this.middleware.table(name) as {
        beforeAdd?: (v: T) => Promise<T> | T;
        afterGet?: (v: T | undefined) => Promise<T | undefined> | T | undefined;
      };
    }
    return {};
  }

  async open(version?: number): Promise<void> {
    const targetVersion = version ?? this.config.version;

    if (this.db) {
      if (this.db.version === targetVersion) return;
      this.db.close();
      this.db = undefined;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, targetVersion);

      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        // In some browsers, onblocked indicates older connections still active.
      };

      request.onupgradeneeded = async (event) => {
        const db = request.result;
        const tx = request.transaction!;

        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || this.config.version;

        const migrations = this.config.migrations || [];
        const migrationMap = new Map<number, MigrationDefinition>();
        for (const migration of migrations) {
          migrationMap.set(migration.version, migration);
        }

        const requireContinuity = this.config.requireMigrationContinuity ?? true;

        for (let targetVersion = oldVersion + 1; targetVersion <= newVersion; targetVersion++) {
          const migration = migrationMap.get(targetVersion);

          if (!migration) {
            if (targetVersion === 1 && oldVersion === 0) {
              this.applySchema(this.config.schema, db, tx);
              this.storeSpecs = this.config.schema;
              continue;
            }

            if (requireContinuity) {
              throw new Error(`Missing migration for version ${targetVersion} while upgrading ${this.config.name} from ${oldVersion} to ${newVersion}`);
            } else {
              console.warn(`Skipping unknown migration version ${targetVersion} for ${this.config.name}`);
              continue;
            }
          }

          this.applySchema(migration.schema, db, tx);
          this.storeSpecs = migration.schema;

          if (migration.up) {
            await migration.up({ db, tx });
          }

          this.migrationsRun.push(targetVersion);
        }

        // ensure final schema from config (optional, idempotent)
        if (newVersion === this.config.version && (!migrationMap.has(this.config.version) || this.config.migrations?.length === 0)) {
          this.applySchema(this.config.schema, db, tx);
          this.storeSpecs = this.config.schema;
        }
      };

      request.onsuccess = () => {
        this.db = request.result;

        this.db.onversionchange = () => {
          this.db?.close();
        };

        resolve();
      };
    });
  }

  private applySchema(schema: SchemaDefinition, db: IDBDatabase, tx: IDBTransaction): void {
    Object.entries(schema).forEach(([storeName, storeDef]) => {
      const hasStore = db.objectStoreNames.contains(storeName);
      let store: IDBObjectStore;

      if (!hasStore) {
        store = db.createObjectStore(storeName, {
          keyPath: storeDef.key.path,
          autoIncrement: storeDef.key.autoIncrement || false,
        });
      } else {
        store = tx.objectStore(storeName);
      }

      (storeDef.indexes || []).forEach((indexDef) => {
        if (!store.indexNames.contains(indexDef.name)) {
          store.createIndex(indexDef.name, indexDef.keyPath || indexDef.name, {
            unique: indexDef.unique || false,
            multiEntry: indexDef.multiEntry || false,
          });
        }
      });
    });
  }

  getKeyPath(storeName: string): string {
    const spec = this.storeSpecs[storeName];
    if (spec) return spec.key.path;

    if (!this.db) throw new Error('Database not opened. Call open() first.');

    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const keyPath = store.keyPath;

    if (typeof keyPath === 'string') return keyPath;
    if (Array.isArray(keyPath)) return keyPath.join(',');

    throw new Error(`Key path for store ${storeName} is undefined`);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = undefined;
    }
  }

  table<T extends TableNames>(name: T): CustomTable<TableType<T>> {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return new CustomTable<TableType<T>>(this, name);
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not opened. Call open() first.');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = async () => {
        let result = req.result as T | undefined;
        const mw = this.getTableMiddleware<T>(storeName);
        if (mw.afterGet) {
          try {
            result = await mw.afterGet(result);
          } catch (_) {
            // fallback to raw
          }
        }
        resolve(result);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    if (!this.db) throw new Error('Database not opened. Call open() first.');

    let toAdd = item;
    const mw = this.getTableMiddleware<T>(storeName);
    if (mw.beforeAdd) {
      try {
        toAdd = await mw.beforeAdd(item);
      } catch (_) {
        // fallback to raw
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.add(toAdd);

      req.onsuccess = () => {
        if (this.transactionDepth === 0) this.notifyChange();
        resolve(req.result);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(storeName: string, item: T): Promise<IDBValidKey> {
    if (!this.db) throw new Error('Database not opened. Call open() first.');

    let toPut = item;
    const mw = this.getTableMiddleware<T>(storeName);
    if (mw.beforeAdd) {
      try {
        toPut = await mw.beforeAdd(item);
      } catch (_) {
        // fallback to raw
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(toPut);

      req.onsuccess = () => {
        if (this.transactionDepth === 0) this.notifyChange();
        resolve(req.result);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) throw new Error('Database not opened. Call open() first.');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => {
        if (this.transactionDepth === 0) this.notifyChange();
        resolve();
      };

      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not opened. Call open() first.');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => {
        if (this.transactionDepth === 0) this.notifyChange();
        resolve();
      };

      req.onerror = () => reject(req.error);
    });
  }

  async deleteDatastore(storeName: string): Promise<void> {
    if (!this.db) await this.open();

    if (!this.db!.objectStoreNames.contains(storeName)) {
      delete this.storeSpecs[storeName];
      return;
    }

    return new Promise((resolve, reject) => {
      const oldDb = this.db!;
      const newVersion = oldDb.version + 1;

      try {
        oldDb.close();
      } catch (_) {}

      const request = indexedDB.open(this.config.name, newVersion);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (db.objectStoreNames.contains(storeName)) {
          db.deleteObjectStore(storeName);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        delete this.storeSpecs[storeName];
        this.notifyChange();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteStore(storeName: string): Promise<void> {
    return this.deleteDatastore(storeName);
  }

  async iterate<T = any>(
    storeName: string,
    direction: IDBCursorDirection = 'next',
    filterFn?: (item: T) => boolean,
    whereCriteria?: string | Partial<T>,
    indexName?: string
  ): Promise<T[]> {
    if (!this.db) throw new Error('Database not opened. Call open() first.');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const rawItems: T[] = [];
      const mw = this.getTableMiddleware<T>(storeName);

      let request: IDBRequest<IDBCursorWithValue | null>;
      try {
        if (indexName && (store.indexNames as any).contains && (store.indexNames as any).contains(indexName)) {
          request = store.index(indexName).openCursor(null, direction);
        } else if (indexName && Array.from(store.indexNames).includes(indexName)) {
          request = store.index(indexName).openCursor(null, direction);
        } else {
          request = store.openCursor(null, direction);
        }
      } catch (_) {
        request = store.openCursor(null, direction);
      }

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          rawItems.push(cursor.value as T);
          cursor.continue();
          return;
        }

        (async () => {
          const finalItems: T[] = [];

          if (mw.afterGet) {
            for (const item of rawItems) {
              try {
                const mapped = await mw.afterGet(item);
                if (mapped !== undefined) finalItems.push(mapped as T);
              } catch (_) {
                finalItems.push(item);
              }
            }
          } else {
            finalItems.push(...rawItems);
          }

          const filtered: T[] = finalItems.filter((item) => {
            let keep = true;
            if (whereCriteria) {
              if (typeof whereCriteria === 'string') {
                keep = this.getValue(item, whereCriteria) !== undefined;
              } else {
                keep = Object.entries(whereCriteria).every(
                  ([key, value]) => (item as any)[key] === value
                );
              }
            }
            if (keep && filterFn) keep = filterFn(item);
            return keep;
          });

          resolve(filtered);
        })().catch((err) => reject(err));
      };

      request.onerror = () => reject(request.error);
    });
  }

  async iterateKeys(
    storeName: string,
    direction: IDBCursorDirection = 'next',
    filterFn?: (item: any) => boolean,
    whereCriteria?: string | Partial<any>,
    indexName?: string
  ): Promise<IDBValidKey[]> {
    if (!this.db) throw new Error('Database not opened. Call open() first.');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const keys: IDBValidKey[] = [];

      let request: IDBRequest<IDBCursorWithValue | null>;
      try {
        if (indexName && (store.indexNames as any).contains && (store.indexNames as any).contains(indexName)) {
          request = store.index(indexName).openCursor(null, direction);
        } else if (indexName && Array.from(store.indexNames).includes(indexName)) {
          request = store.index(indexName).openCursor(null, direction);
        } else {
          request = store.openCursor(null, direction);
        }
      } catch (_) {
        request = store.openCursor(null, direction);
      }

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const item = cursor.value;
          let keep = true;
          if (whereCriteria) {
            if (typeof whereCriteria === 'string') {
              keep = this.getValue(item, whereCriteria) !== undefined;
            } else {
              keep = Object.entries(whereCriteria).every(
                ([key, value]) => item[key] === value
              );
            }
          }

          if (keep && (!filterFn || filterFn(item))) {
            keys.push(cursor.primaryKey);
          }
          cursor.continue();
          return;
        }

        resolve(keys);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  liveQuery<T>(queryFn: () => Promise<T>): {
    subscribe: (callback: (result: T) => void) => () => void;
  } {
    let currentResult: T | undefined;
    let subscribers: Array<(result: T) => void> = [];

    const notify = async () => {
      try {
        const result = await queryFn();
        if (JSON.stringify(result) !== JSON.stringify(currentResult)) {
          currentResult = result;
          subscribers.forEach((callback) => callback(result));
        }
      } catch (error) {
        console.error('Live query error:', error);
      }
    };

    this.eventEmitter.on('change', notify);

    return {
      subscribe: (callback: (result: T) => void) => {
        subscribers.push(callback);
        notify();

        return () => {
          subscribers = subscribers.filter((cb) => cb !== callback);
          if (subscribers.length === 0) {
            this.eventEmitter.removeListener('change', notify);
          }
        };
      },
    };
  }

  notifyChange(): void {
    this.eventEmitter.emit('change');
  }

  async transaction<T>(tables: TableNames[], mode: IDBTransactionMode, callback: () => Promise<T>): Promise<T> {
    if (!this.db) throw new Error('Database not opened. Call open() first.');

    this.transactionDepth++;

    let asyncResultResolve: (value: T) => void;
    let asyncResultReject: (reason?: any) => void;

    const callbackResultPromise = new Promise<T>((resolve, reject) => {
      asyncResultResolve = resolve;
      asyncResultReject = reject;
    });

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(tables, mode);
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        this.transactionDepth--;
        try {
          this.notifyChange();
        } catch (_) {}
        fn();
      };

      tx.onerror = () => settle(() => reject(tx.error));
      tx.onabort = () => settle(() => reject(tx.error ?? new Error('Transaction aborted')));
      tx.oncomplete = () => {
        callbackResultPromise.then((result) => settle(() => resolve(result))).catch((err) => settle(() => reject(err)));
      };

      Promise.resolve()
        .then(() => callback())
        .then((result) => asyncResultResolve(result))
        .catch((err) => {
          asyncResultReject(err);
          try {
            tx.abort();
          } catch (_) {}
          settle(() => reject(err));
        });
    });
  }

  version(versionNumber: number): CustomDatabase {
    // no-op fluent style (compat)
    return this;
  }

  async truncate(tableName: TableNames): Promise<void> {
    await this.transaction([tableName], 'readwrite', async () => {
      if (!this.db) throw new Error('Database not opened. Call open() first.');
      const store = this.db.transaction(tableName, 'readwrite').objectStore(tableName);
      const clearReq = store.clear();
      return new Promise<void>((resolve, reject) => {
        clearReq.onsuccess = () => resolve();
        clearReq.onerror = () => reject(clearReq.error);
      });
    });
  }
}

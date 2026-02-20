import { Table, Collection, WhereClause, DatabaseLike } from './types';
import { CustomCollection } from './collection';
import { CustomWhereClause } from './where-clause';

export class CustomTable<T, TKey = string> implements Table<T, TKey> {
  private keyPath: string;
  private db: DatabaseLike;
  public name: string;

  constructor(db: DatabaseLike, name: string) {
    this.db = db;
    this.name = name;
    // Get the store's keyPath via database helper
    this.keyPath = this.db.getKeyPath(this.name);
  }

  async get(key: TKey): Promise<T | undefined> {
    return this.db.get<T>(this.name, key as unknown as IDBValidKey);
  }

  async add(item: T): Promise<TKey> {
    const key = await this.db.add<T>(this.name, item);
    return key as unknown as TKey;
  }

  async put(item: T): Promise<TKey> {
    const resultKey = await this.db.put<T>(this.name, item);
    return resultKey as unknown as TKey;
  }

  async delete(key: TKey): Promise<void> {
    return this.db.delete(this.name, key as unknown as IDBValidKey);
  }

  async clear(): Promise<void> {
    return this.db.clear(this.name);
  }

  where(keyPath: string): WhereClause<T> {
    return new CustomWhereClause<T>(this.db, this.name, keyPath);
  }

  toCollection(): Collection<T> {
    return new CustomCollection<T>(this.db, this.name, this.keyPath);
  }

  orderBy(keyPath: string): Collection<T> {
    return new CustomCollection<T>(this.db, this.name, keyPath);
  }

  reverse(): Collection<T> {
    return new CustomCollection<T>(this.db, this.name, undefined, true);
  }

  filter(predicate: (item: T) => boolean): Collection<T> {
    return new CustomCollection<T>(this.db, this.name, this.keyPath).filter(predicate);
  }

  async bulkAdd(items: T[]): Promise<string[]> {
    const results: string[] = [];
    for (const it of items) {
      const key = await this.add(it);
      results.push(key as unknown as string);
    }
    return results;
  }

  async bulkPut(items: T[]): Promise<string[]> {
    const results: string[] = [];
    for (const it of items) {
      const key = await this.put(it);
      results.push(key as unknown as string);
    }
    return results;
  }

  async bulkDelete(keys: string[]): Promise<void> {
    for (const k of keys) {
      await this.delete(k as unknown as TKey);
    }
  }

  async update(key: TKey, changes: Partial<T>): Promise<void> {
    const existing = await this.get(key);
    if (!existing) return;
    await this.put({ ...existing, ...changes } as T);
  }

  async count(): Promise<number> {
    return this.toCollection().count();
  }
}
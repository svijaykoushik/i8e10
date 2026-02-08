import { WhereClause, Collection } from './types';
import { CustomCollection } from './collection';

interface DatabaseLike {
  iterate<T = any>(storeName: string, direction?: IDBCursorDirection, filterFn?: (item: T) => boolean, whereCriteria?: string | Partial<T>): Promise<T[]>;
  delete(storeName: string, key: IDBValidKey): Promise<void>;
}

export class CustomWhereClause<T> implements WhereClause<T> {
  private db: DatabaseLike;
  private storeName: string;
  private keyPath: string;

  constructor(db: DatabaseLike, storeName: string, keyPath: string) {
    this.db = db;
    this.storeName = storeName;
    this.keyPath = keyPath;
  }

  equals(value: any): Collection<T> {
    return new CustomCollection<T>(this.db as any, this.storeName, this.keyPath).filter(item => 
      this.getValue(item, this.keyPath) === value
    );
  }

  above(value: any): Collection<T> {
    return new CustomCollection<T>(this.db as any, this.storeName, this.keyPath).filter(item => 
      this.getValue(item, this.keyPath) > value
    );
  }

  below(value: any): Collection<T> {
    return new CustomCollection<T>(this.db as any, this.storeName, this.keyPath).filter(item => 
      this.getValue(item, this.keyPath) < value
    );
  }

  between(lower: any, upper: any, includeLower = true, includeUpper = true): Collection<T> {
    return new CustomCollection<T>(this.db as any, this.storeName, this.keyPath).filter(item => {
      const value = this.getValue(item, this.keyPath);
      const aboveLower = includeLower ? value >= lower : value > lower;
      const belowUpper = includeUpper ? value <= upper : value < upper;
      return aboveLower && belowUpper;
    });
  }

  startsWith(prefix: string): Collection<T> {
    const upperBound = prefix + '\uffff';
    return this.between(prefix, upperBound, true, true);
  }

  anyOf(values: any[]): Collection<T> {
    const col = new CustomCollection<T>(this.db as any, this.storeName, this.keyPath);
    col.filter(item => values.includes(this.getValue(item, this.keyPath)));
    return col;
  }

  async delete(): Promise<void> {
    const coll = new CustomCollection<T>(this.db as any, this.storeName, this.keyPath);
    const items = await coll.toArray();
    for (const it of items) {
      await this.db.delete(this.storeName, (it as any).id);
    }
  }

  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}
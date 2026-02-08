// Re-export all public types and classes
export * from './types';
import { CustomDatabase } from './database';
export { CustomDatabase as Database } from './database';

const core = CustomDatabase.getInstance();

export const liveQuery = <T>(queryFn: () => Promise<T>) => core.liveQuery(queryFn as any);

export const db = core;
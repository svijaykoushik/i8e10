// Re-export all public types and classes
export * from './types';
import { CustomDatabase } from './database';
import { migrateV2toV3 } from './migrations/legacy/migrateV2ToV3';
import { legacySchema } from './schemas/legacySchema';
export { CustomDatabase as Database } from './database';

const core = new CustomDatabase({
  name: 'i8e10DB',
  version: 3,
  schema: legacySchema,
  migrations: [{
    schema: legacySchema,
    version: 3,
    up: migrateV2toV3
  }],
  requireMigrationContinuity: false,
});

export const liveQuery = <T>(queryFn: () => Promise<T>) => core.liveQuery(queryFn as any);

export const db = core;
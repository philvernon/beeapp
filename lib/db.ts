import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
  // In dev, reuse the global pool to avoid HMR exhausting connections
  const g = global as typeof global & { pgPool?: Pool };
  if (!g.pgPool) {
    g.pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  pool = g.pgPool;
}

// Drizzle instance with schema for type-safe queries
export const db = drizzle(pool, { schema });

// Re-export schema and Zod schemas for convenience
export { schema };
export {
  ApiaryInsert,
  ApiarySelect,
  ApiaryUpdate,
  HiveInsert,
  HiveSelect,
  HiveUpdate,
  InspectionInsert,
  InspectionSelect,
  queenColourLabels,
  varroaLevelLabels,
  weatherConditionLabels,
} from './schema';

export default pool;

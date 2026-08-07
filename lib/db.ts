import { Pool } from 'pg';

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

export default pool;

import "server-only";

import { Pool } from "pg";

type PgGlobal = typeof globalThis & { heiligProductPool?: Pool };
const globalForPg = globalThis as PgGlobal;

export function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!globalForPg.heiligProductPool) {
    const pool = new Pool({
      connectionString,
      max: 3,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    });
    pool.on("error", () => {
      console.error("[database] An idle PostgreSQL connection reported an error.");
    });
    globalForPg.heiligProductPool = pool;
  }

  return globalForPg.heiligProductPool;
}

export function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error("Configure DATABASE_URL to use the admin and database-backed catalog.");
  }
  return pool;
}

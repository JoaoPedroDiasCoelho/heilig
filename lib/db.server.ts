import "server-only";

import { Pool } from "pg";

type PgGlobal = typeof globalThis & { heiligProductPool?: Pool };
const globalForPg = globalThis as PgGlobal;

export function getPool() {
  const connectionString = process.env.DATABASE_URL;
  const host = process.env.PGHOST;
  const database = process.env.PGDATABASE;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const hasSplitConfig = Boolean(host && database && user && password);
  if (!hasSplitConfig && !connectionString) return null;

  if (!globalForPg.heiligProductPool) {
    const pool = new Pool({
      ...(hasSplitConfig
        ? {
            host,
            port: Number(process.env.PGPORT || "5432"),
            database,
            user,
            password,
            ...(process.env.PGSSLMODE === "require"
              ? { ssl: { rejectUnauthorized: false } }
              : {}),
          }
        : { connectionString }),
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
    throw new Error(
      "Configure DATABASE_URL or PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD to use the database."
    );
  }
  return pool;
}

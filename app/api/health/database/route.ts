import { NextResponse } from "next/server";
import { getPool } from "@/lib/db.server";

export const dynamic = "force-dynamic";

const requiredTables = [
  { name: "products", migration: "db/schema.sql" },
  { name: "admin_users", migration: "db/admin-schema.sql" },
  { name: "admin_sessions", migration: "db/admin-schema.sql" },
  { name: "admin_login_attempts", migration: "db/admin-schema.sql" },
  { name: "product_images", migration: "db/product-images.sql" },
  { name: "product_stock", migration: "db/product-stock.sql" },
] as const;

function unavailable(message: string, details: Record<string, unknown> = {}) {
  return NextResponse.json(
    { status: "error", database: "unavailable", message, ...details },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  try {
    const pool = getPool();
    if (!pool) {
      return unavailable(
        "Configure DATABASE_URL ou todas as variáveis PGHOST, PGDATABASE, PGUSER e PGPASSWORD.",
        {
        database: "not_configured",
        }
      );
    }

    await pool.query("SELECT 1");
    const tableResult = await pool.query<{ table_name: string; exists: boolean }>(
      `SELECT required.table_name, to_regclass(format('public.%I', required.table_name)) IS NOT NULL AS exists
       FROM unnest($1::text[]) AS required(table_name)`,
      [requiredTables.map((table) => table.name)]
    );
    const missingTables = tableResult.rows
      .filter((table) => !table.exists)
      .map((table) => table.table_name);
    const columnResult = await pool.query<{ column_name: string }>(
      `SELECT required.column_name
       FROM unnest(ARRAY['category', 'featured']::text[]) AS required(column_name)
       WHERE NOT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'products'
           AND information_schema.columns.column_name = required.column_name
       )`
    );
    const missingProductColumns = columnResult.rows.map((column) => column.column_name);
    const missingMigrations = [
      ...new Set([
        ...requiredTables
          .filter((table) => missingTables.includes(table.name))
          .map((table) => table.migration),
        ...(missingProductColumns.length ? ["db/product-catalog.sql"] : []),
      ]),
    ];

    if (missingMigrations.length > 0) {
      return unavailable("Banco conectado, mas há migrações pendentes.", {
        database: "connected",
        schema: "incomplete",
        missingTables,
        missingProductColumns,
        missingMigrations,
      });
    }

    return NextResponse.json(
      { status: "ok", database: "connected", schema: "ready" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string" &&
      /^[A-Za-z0-9_]{1,16}$/.test(error.code)
        ? error.code
        : "unknown";
    console.error("[database-health] Database diagnostic failed.", { code });
    return unavailable("Não foi possível conectar ou verificar o esquema do banco.", {
      database: "connection_failed",
      errorCode: code,
    });
  }
}

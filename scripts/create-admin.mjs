import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import nextEnv from "@next/env";
import pg from "pg";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { Pool } = pg;
const deriveKey = promisify(scrypt);
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.ADMIN_NAME?.trim();
const password = process.env.ADMIN_PASSWORD;

if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL before creating the first admin.");
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || name.length > 120) {
  throw new Error("Set a valid ADMIN_EMAIL and ADMIN_NAME.");
}
if (!password || password.length < 12 || password.length > 128) {
  throw new Error("ADMIN_PASSWORD must contain between 12 and 128 characters.");
}

const salt = randomBytes(16);
const key = await deriveKey(password, salt, 64);
const passwordHash = `${salt.toString("base64url")}.${key.toString("base64url")}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 });

try {
  const result = await pool.query(
    `INSERT INTO public.admin_users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [name, email, passwordHash]
  );
  if (result.rowCount === 0) {
    throw new Error("An account already exists with that email; no account was changed.");
  }
  console.log(`Admin created: ${email}`);
} finally {
  await pool.end();
}

import "server-only";

import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePool } from "@/lib/db.server";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "heilig_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor";
  active: boolean;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("base64url")}.${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [saltValue, keyValue] = storedHash.split(".");

  try {
    const salt = saltValue ? Buffer.from(saltValue, "base64url") : Buffer.alloc(0);
    const expected = keyValue ? Buffer.from(keyValue, "base64url") : Buffer.alloc(0);
    const validHash = salt.length === 16 && expected.length === 64;
    const actual = (await scrypt(
      password,
      validHash ? salt : Buffer.alloc(16),
      64
    )) as Buffer;
    return validHash && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const pool = requirePool();
  await pool.query(
    `INSERT INTO public.admin_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + interval '8 hours')`,
    [hashSessionToken(token), userId]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const pool = requirePool();
  const tokenHash = hashSessionToken(token);
  const result = await pool.query<AdminUser>(
    `SELECT u.id, u.name, u.email, u.role, u.active
     FROM public.admin_sessions s
     JOIN public.admin_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active = true
     LIMIT 1`,
    [tokenHash]
  );

  if (!result.rows[0]) {
    await pool.query("DELETE FROM public.admin_sessions WHERE token_hash = $1", [tokenHash]);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return result.rows[0];
}

export async function requireAdminUser() {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireAdminRole() {
  const user = await requireAdminUser();
  if (user.role !== "admin") redirect("/admin");
  return user;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await requirePool().query("DELETE FROM public.admin_sessions WHERE token_hash = $1", [
      hashSessionToken(token),
    ]);
  }
  cookieStore.delete(SESSION_COOKIE);
}

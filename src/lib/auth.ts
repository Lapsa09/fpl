import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "fpl_admin";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET no configurado");
  return value;
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(password.padEnd(64, " "));
  const b = Buffer.from(expected.padEnd(64, " "));
  return a.length === b.length && timingSafeEqual(a, b) && password === expected;
}

export function signSession(expiresAt: number): string {
  const payload = String(expiresAt);
  return `${payload}.${signature(payload)}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = signature(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

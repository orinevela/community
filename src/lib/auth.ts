import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db, now } from "./db";
import { getUser, type User } from "./repo";

const SESSION_COOKIE = "cc_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days
const OTP_TTL_MS = 1000 * 60 * 10;
const OTP_MAX_ATTEMPTS = 5;

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

/** True when no real SMS/WhatsApp provider is configured: the code is shown in the UI (dev only). */
export function otpDevMode() {
  return !process.env.TWILIO_ACCOUNT_SID || process.env.OTP_DEV_MODE === "1";
}

async function deliverOtp(phone: string, code: string) {
  if (otpDevMode()) {
    console.log(`[otp] code for ${phone}: ${code}`);
    return;
  }
  // Twilio Verify-compatible SMS via the Messages API. Swap for a WhatsApp provider as needed.
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM!;
  const body = new URLSearchParams({ To: phone, From: from, Body: `קוד הכניסה שלך לקהילה מחוברת: ${code}` });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(`SMS send failed: ${res.status}`);
}

export async function sendOtp(phone: string): Promise<{ devCode?: string }> {
  const code = String(crypto.randomInt(100000, 1000000));
  db()
    .prepare(
      `INSERT INTO otp_codes (phone, code_hash, expires_at, attempts) VALUES (?, ?, ?, 0)
       ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, attempts=0`,
    )
    .run(phone, sha256(phone + code), now() + OTP_TTL_MS);
  await deliverOtp(phone, code);
  return otpDevMode() ? { devCode: code } : {};
}

export function verifyOtp(phone: string, code: string): boolean {
  const row = db().prepare("SELECT code_hash, expires_at, attempts FROM otp_codes WHERE phone = ?").get(phone) as
    | { code_hash: string; expires_at: number; attempts: number }
    | undefined;
  if (!row || row.expires_at < now() || row.attempts >= OTP_MAX_ATTEMPTS) return false;
  const ok = crypto.timingSafeEqual(Buffer.from(row.code_hash), Buffer.from(sha256(phone + code.trim())));
  if (!ok) {
    db().prepare("UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?").run(phone);
    return false;
  }
  db().prepare("DELETE FROM otp_codes WHERE phone = ?").run(phone);
  return true;
}

export function findOrCreateUserByPhone(phone: string): string {
  const existing = db().prepare("SELECT id FROM users WHERE phone = ?").get(phone) as { id: string } | undefined;
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  db().prepare("INSERT INTO users (id, phone, created_at, updated_at) VALUES (?, ?, ?, ?)").run(id, phone, now(), now());
  return id;
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  db()
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(sha256(token), userId, now() + SESSION_TTL_MS);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db().prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?").get(sha256(token)) as
    | { user_id: string; expires_at: number }
    | undefined;
  if (!row || row.expires_at < now()) return null;
  return getUser(row.user_id);
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

const COOKIE = "anilo_admin_session";
const SESSION_VALUE = "authenticated";

async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !email || !password) return null;

  const existing = await query<{ id: string; username: string; email: string; password_hash: string }>(
    `SELECT id, username, email, password_hash FROM anilo.users WHERE is_admin = TRUE OR email = $1 OR username = $2 LIMIT 1`,
    [email, username],
  );
  if (existing.rows[0]) return existing.rows[0];

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await query<{ id: string; username: string; email: string; password_hash: string }>(
    `INSERT INTO anilo.users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, TRUE) RETURNING id, username, email, password_hash`,
    [username, email, passwordHash],
  );
  return created.rows[0] ?? null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  try {
    const admin = await ensureAdmin();
    const credentialsMatch = admin
      ? (username.trim().toLowerCase() === admin.username.trim().toLowerCase() || username.trim().toLowerCase() === admin.email.trim().toLowerCase()) && await bcrypt.compare(password, admin.password_hash)
      : false;
    if (!credentialsMatch) {
      return NextResponse.json({ error: "Login yoki parol noto‘g‘ri" }, { status: 401 });
    }
  } catch (error) {
    console.error("[v0] Admin Neon login failed", error);
    return NextResponse.json({ error: "Server xatosi. Keyinroq urinib ko‘ring." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}

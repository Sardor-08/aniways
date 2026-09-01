import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { query } from "@/lib/db"

const COOKIE = "anilo_session"
const secret = () => process.env.BETTER_AUTH_SECRET || process.env.ADMIN_PASSWORD || ""
function sign(value: string) {
  return `${value}.${crypto.createHmac("sha256", secret()).update(value).digest("hex")}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const username = String(body.username || "").trim()
    const password = String(body.password || "")
    const email = String(body.email || `${username}@anilo.uz`).trim().toLowerCase()

    if (!username || username.length < 3) {
      return NextResponse.json({ detail: "Username kamida 3 ta belgidan iborat bo‘lishi kerak" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ detail: "Parol kamida 6 ta belgidan iborat bo‘lishi kerak" }, { status: 400 })
    }

    const existing = await query<{ id: string }>(
      "SELECT id FROM anilo.users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = $2 LIMIT 1",
      [username, email],
    )
    if (existing.rows[0]) {
      return NextResponse.json({ detail: "Bu username yoki email allaqachon mavjud" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const result = await query<{ id: string; username: string; email: string }>(
      "INSERT INTO anilo.users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, passwordHash],
    )
    const user = result.rows[0]
    const token = sign(user.id)
    const response = NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user: { id: Number(user.id), username: user.username, email: user.email, created_at: new Date().toISOString() },
    }, { status: 201 })
    response.cookies.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
    return response
  } catch (error) {
    console.error("[v0] Signup failed", error)
    return NextResponse.json({ detail: "Ro‘yxatdan o‘tishda server yoki baza xatosi" }, { status: 500 })
  }
}

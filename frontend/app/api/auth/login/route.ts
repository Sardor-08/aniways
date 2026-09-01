import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { query } from "@/lib/db"

const COOKIE = "anilo_session"
const secret = () => process.env.BETTER_AUTH_SECRET || process.env.ADMIN_PASSWORD || ""

function sign(value: string) {
  return `${value}.${crypto.createHmac("sha256", secret()).update(value).digest("hex")}`
}

function verify(value: string) {
  const [id, signature] = value.split(".")
  if (!id || !signature || !secret()) return null
  const expected = crypto.createHmac("sha256", secret()).update(id).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? id : null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const identifier = String(body.username || body.email || "").trim().toLowerCase()
    const password = String(body.password || "")
    if (!identifier || !password) return NextResponse.json({ detail: "Username va parol kerak" }, { status: 400 })
    const result = await query<{ id: string; username: string; email: string; password_hash: string }>(
      "SELECT id, username, email, password_hash FROM anilo.users WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1",
      [identifier],
    )
    const user = result.rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ detail: "Username yoki parol noto‘g‘ri" }, { status: 401 })
    }
    const response = NextResponse.json({
      access_token: sign(user.id),
      token_type: "bearer",
      user: { id: Number(user.id), username: user.username, email: user.email, created_at: new Date().toISOString() },
    })
    response.cookies.set(COOKIE, sign(user.id), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
    return response
  } catch {
    return NextResponse.json({ detail: "Server yoki baza xatosi" }, { status: 500 })
  }
}

export async function GET() {
  const token = (await cookies()).get(COOKIE)?.value
  const id = token ? verify(token) : null
  if (!id) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
  const result = await query<{ id: string; username: string; email: string }>("SELECT id, username, email FROM anilo.users WHERE id = $1", [id])
  return result.rows[0] ? NextResponse.json(result.rows[0]) : NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
  return response
}

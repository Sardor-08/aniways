import { NextResponse } from "next/server"
import { query } from "@/lib/db"

function authorized(request: Request) {
  const token = request.headers.get("x-admin-token")
  return Boolean(token && token === process.env.ADMIN_PASSWORD)
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Ruxsat berilmadi" }, { status: 401 })

  try {
    const result = await query(
      "select id, username, email, avatar_url, is_admin, created_at, updated_at from anilo.users order by created_at desc limit 100",
    )
    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error("[v0] Neon users query failed", error)
    return NextResponse.json({ error: "Foydalanuvchilarni yuklab bo‘lmadi" }, { status: 500 })
  }
}

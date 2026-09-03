import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/db"

async function authorized() {
  const cookieStore = await cookies()
  return cookieStore.get("anilo_admin_session")?.value === "authenticated"
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Ruxsat berilmadi" }, { status: 401 })

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

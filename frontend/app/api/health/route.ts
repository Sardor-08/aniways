import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const result = await query<{ now: string }>("select now() as now")
    return NextResponse.json({ ok: true, database: "neon", time: result.rows[0]?.now })
  } catch (error) {
    console.error("[v0] Neon health check failed", error)
    return NextResponse.json({ ok: false, database: "neon" }, { status: 503 })
  }
}

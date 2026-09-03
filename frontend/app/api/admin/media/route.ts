import { put, list } from "@vercel/blob"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

async function authorized() {
  return (await cookies()).get("anilo_admin_session")?.value === "authenticated"
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Ruxsat berilmadi" }, { status: 401 })
  const { blobs } = await list({ prefix: "anilo/" })
  return NextResponse.json({ files: blobs.map((file) => ({ url: file.url, pathname: file.pathname, size: file.size, uploadedAt: file.uploadedAt })) })
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Ruxsat berilmadi" }, { status: 401 })
  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Fayl tanlanmagan" }, { status: 400 })
  const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]
  const limit = file.type.startsWith("video/") ? 500 * 1024 * 1024 : 10 * 1024 * 1024
  if (!allowed.includes(file.type) || file.size > limit) return NextResponse.json({ error: "Fayl turi yoki hajmi noto‘g‘ri" }, { status: 400 })
  const blob = await put(`anilo/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, file, { access: "public", addRandomSuffix: false })
  return NextResponse.json({ url: blob.url, pathname: blob.pathname })
}

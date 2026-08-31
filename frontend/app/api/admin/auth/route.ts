import { NextResponse } from "next/server";

const COOKIE = "anilo_admin_session";
const SESSION_VALUE = "authenticated";

function validCredentials(username: string, password: string) {
  const allowedUsernames = [process.env.ADMIN_USERNAME, process.env.ADMIN_EMAIL].filter(Boolean);
  return allowedUsernames.includes(username) && password === process.env.ADMIN_PASSWORD;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!process.env.ADMIN_PASSWORD || !validCredentials(username, password)) {
    return NextResponse.json({ error: "Login yoki parol noto‘g‘ri" }, { status: 401 });
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

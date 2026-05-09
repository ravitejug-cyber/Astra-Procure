import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  const validUsername = process.env.APP_USERNAME ?? "admin";
  const validPassword = process.env.APP_PASSWORD ?? "astra2024";
  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  const token = await createSession(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}

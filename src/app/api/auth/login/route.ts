import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    let body: { username?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const validUsername = process.env.APP_USERNAME ?? "ravitej";
    const validPassword = process.env.APP_PASSWORD ?? "ravitej1989";

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
  } catch (err) {
    console.error("[login] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

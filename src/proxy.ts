import { NextRequest, NextResponse } from "next/server";

export async function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  // Clear any leftover session cookie from the old auth system
  response.cookies.delete("astra_session");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};

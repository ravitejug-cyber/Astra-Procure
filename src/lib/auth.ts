import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "astra_session";

const SECRET = new TextEncoder().encode(
  process.env.APP_SECRET ?? "astra-procure-default-secret-change-in-prod"
);

export async function createSession(username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

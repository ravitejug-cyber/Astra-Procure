import crypto from "crypto";

export const COOKIE_NAME = "astra_session";

const SECRET = process.env.APP_SECRET ?? "astra-procure-default-secret-change-in-prod";

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function createSession(username: string): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(Buffer.from(JSON.stringify({ username, iat: now, exp: now + 8 * 60 * 60 })));
  const sig = b64url(crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

export function verifySession(token: string): { username: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const expected = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
    if (sig !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

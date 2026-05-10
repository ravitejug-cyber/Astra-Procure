export const COOKIE_NAME = "astra_session";

const SECRET = process.env.APP_SECRET ?? "astra-procure-default-secret-change-in-prod";

function toB64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function strToB64url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlToBytes(b64: string): Uint8Array {
  const binary = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage
  );
}

export async function createSession(username: string): Promise<string> {
  const header = strToB64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = strToB64url(JSON.stringify({ username, iat: now, exp: now + 8 * 60 * 60 }));
  const key = await getKey(["sign"]);
  const sig = toB64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`)));
  return `${header}.${payload}.${sig}`;
}

export async function verifySession(token: string): Promise<{ username: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const key = await getKey(["verify"]);
    const sigBytes = b64urlToBytes(sig);
    const valid = await crypto.subtle.verify(
      "HMAC", key, sigBytes as unknown as ArrayBuffer,
      new TextEncoder().encode(`${header}.${payload}`)
    );
    if (!valid) return null;
    const data = JSON.parse(decodeURIComponent(escape(String.fromCharCode(...b64urlToBytes(payload)))));
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

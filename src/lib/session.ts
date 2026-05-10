import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "./auth";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

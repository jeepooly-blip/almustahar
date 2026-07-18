import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "lnp.session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-use-32-chars-min",
);
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload {
  id: string;
  name: string;
  role: "CITIZEN" | "LAWYER" | "ADMIN";
  phone: string;
  lawyerId?: string;
}

/**
 * Create a signed JWT and return a Set-Cookie header value.
 */
export async function createSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(JWT_SECRET);

  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}

/**
 * Verify and decode the JWT from the session cookie.
 * Returns null if the cookie is missing, expired, or invalid.
 */
export async function verifySession(): Promise<SessionPayload | null> {
  try {
    const c = await cookies();
    const raw = c.get(SESSION_COOKIE)?.value;
    if (!raw) return null;

    const { payload } = await jwtVerify(raw, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      role: payload.role as SessionPayload["role"],
      phone: payload.phone as string,
      lawyerId: payload.lawyerId as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Return a Set-Cookie header that clears the session cookie.
 */
export function destroySessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
import { verifySession, type SessionPayload } from "./auth";

export type { SessionPayload };
export { verifySession as getServerSession };

/**
 * Require a valid session; throw a redirect if not authenticated.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await verifySession();
  if (!session) {
    // Import dynamically to avoid circular deps
    const { redirect } = await import("next/navigation");
    redirect("/auth/login");
    // TypeScript needs a hint that redirect() never returns
    return undefined as unknown as SessionPayload;
  }
  return session;
}

/**
 * Require a specific role; throw a redirect if the user doesn't have it.
 */
export async function requireRole(
  ...roles: SessionPayload["role"][]
): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    const { redirect } = await import("next/navigation");
    redirect("/");
  }
  return session;
}
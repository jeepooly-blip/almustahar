import { cookies } from "next/headers";

export interface ServerSession {
  user: {
    id: string;
    name: string;
    role: "CITIZEN" | "LAWYER" | "ADMIN";
    phone: string;
    lawyerId?: string;
  } | null;
}

export async function getServerSession(): Promise<ServerSession["user"]> {
  const c = await cookies();
  const raw = c.get("lnp.session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

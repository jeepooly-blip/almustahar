"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface SessionUser {
  id: string;
  name: string;
  role: "CITIZEN" | "LAWYER" | "ADMIN";
  phone: string;
  lawyerId?: string;
}

interface SessionContextValue {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "lnp.session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUserState(JSON.parse(raw));
    } catch {}
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      setUser: (u) => {
        setUserState(u);
        try {
          if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          else window.localStorage.removeItem(STORAGE_KEY);
        } catch {}
      },
      signOut: () => {
        setUserState(null);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {}
        // Clear the HttpOnly cookie via API
        fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
      },
    }),
    [user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

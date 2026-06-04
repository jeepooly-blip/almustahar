"use client";

import { useLocale } from "@/lib/locale-provider";
import type { ReactNode } from "react";

export function LocaleProviderClient({ children }: { children: ReactNode }) {
  useLocale();
  return <>{children}</>;
}

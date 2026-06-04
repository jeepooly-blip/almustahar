import type { Metadata, Viewport } from "next";
import { Inter, Tajawal } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale-provider";
import { SessionProvider } from "@/lib/session-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToastViewport } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  variable: "--font-tajawal",
  display: "swap",
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://legalnavigator.jo"),
  title: {
    default: "Legal Navigator Pro — افهم حقوقك وتعامل مع القانون بثقة",
    template: "%s | Legal Navigator Pro",
  },
  description:
    "منصة قانونية ذكية لتحليل الوثائق القانونية بالعربية، مع توجيه صادق نحو محامين موثوقين في الأردن.",
  keywords: [
    "قانون",
    "محامي",
    "الأردن",
    "تحليل عقد",
    "إيجار",
    "عمل",
    "مرور",
    "AI legal",
    "Jordan lawyer",
  ],
  authors: [{ name: "Legal Navigator Pro" }],
  openGraph: {
    type: "website",
    locale: "ar_JO",
    alternateLocale: "en_US",
    title: "Legal Navigator Pro",
    description: "افهم حقوقك. تعامل مع القانون بثقة.",
    siteName: "Legal Navigator Pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal Navigator Pro",
    description: "افهم حقوقك. تعامل مع القانون بثقة.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${inter.variable} ${tajawal.variable}`}>
      <body className="min-h-screen bg-white text-ink-900 antialiased">
        <LocaleProvider>
          <SessionProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
              <ToastViewport />
            </div>
          </SessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

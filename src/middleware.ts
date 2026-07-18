import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-use-32-chars-min",
);

const PROTECTED_PREFIXES = ["/dashboard", "/upload", "/lawyer/dashboard"];
const ADMIN_ONLY_PREFIXES = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if this path needs protection
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const needsAdmin = ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  if (!needsAuth && !needsAdmin) {
    return NextResponse.next();
  }

  // API routes under /admin are handled by their own auth checks
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("lnp.session")?.value;

  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    if (needsAdmin && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Inject user info into request headers for downstream use
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.id as string);
    requestHeaders.set("x-user-role", role);
    requestHeaders.set("x-user-phone", payload.phone as string);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    // Invalid or expired token
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/upload/:path*", "/lawyer/dashboard/:path*"],
};
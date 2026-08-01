import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_PREFIXES, PROTECTED_PREFIXES, ROUTES } from "@/lib/constants";

/**
 * Next 16 renamed `middleware` to `proxy`. Same hook, node runtime only.
 *
 * This is an OPTIMISTIC check and nothing more: it looks for the presence of
 * a session cookie so signed-out users get bounced to login without paying for
 * a server render. It does NOT decode or verify the token, and it does NOT
 * enforce roles.
 *
 * Real authorization is done per page and per route handler by
 * `src/lib/auth/session.ts`. Anyone who forges a cookie gets past this file
 * and straight into a proper check.
 */

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  if (!hasSessionCookie(request)) {
    const login = new URL(ROUTES.login, request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // Admin paths get the same optimistic treatment — the role itself is
  // verified by requireAdmin() inside the route, which is where it belongs.
  const isAdmin = ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isAdmin) {
    const response = NextResponse.next();
    // Admin screens list users and leads; never let them into any cache.
    response.headers.set("Cache-Control", "no-store, private");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/pro/:path*", "/admin/:path*"],
};

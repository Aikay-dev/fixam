import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { ROUTES, type Role } from "@/lib/constants";

/**
 * Real authorization lives here, not in proxy.ts.
 *
 * Next's own docs are explicit that proxy (formerly middleware) is for
 * optimistic checks only — it runs before the route and must not be trusted as
 * the sole gate. Every protected page and route handler calls one of these.
 */

export type SessionUser = Session["user"];

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.status === "suspended") return null;
  return session.user;
}

/** For pages. Redirects to login, preserving where the user was going. */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const target = nextPath
      ? `${ROUTES.login}?next=${encodeURIComponent(nextPath)}`
      : ROUTES.login;
    redirect(target);
  }
  return user;
}

/** For pages that also require a verified email address. */
export async function requireVerifiedUser(
  nextPath?: string,
): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!user.isVerified) {
    redirect(
      `${ROUTES.verifyEmail}?email=${encodeURIComponent(user.email ?? "")}`,
    );
  }
  return user;
}

export async function requireRole(
  role: Role,
  nextPath?: string,
): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!user.roles?.includes(role)) {
    // 404 rather than 403: admin routes should not confirm they exist to a
    // signed-in customer poking at URLs.
    redirect("/404");
  }
  return user;
}

export const requireAdmin = (nextPath?: string) =>
  requireRole("admin", nextPath);

export const requireArtisan = (nextPath?: string) =>
  requireRole("artisan", nextPath);

// --- Route handler variants ----------------------------------------------

export type ApiAuthFailure = { ok: false; status: number; reason: string };
export type ApiAuthSuccess = { ok: true; user: SessionUser };
export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

/**
 * For route handlers, which must return a response rather than redirect.
 * The distinct `unverified` reason lets the client show "check your inbox"
 * instead of bouncing the user to a login screen they're already past.
 */
export async function authenticateRequest(options?: {
  requireVerified?: boolean;
  role?: Role;
}): Promise<ApiAuthResult> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return { ok: false, status: 401, reason: "unauthenticated" };
  }

  if (user.status === "suspended") {
    return { ok: false, status: 403, reason: "suspended" };
  }

  if (options?.requireVerified && !user.isVerified) {
    return { ok: false, status: 403, reason: "unverified" };
  }

  if (options?.role && !user.roles?.includes(options.role)) {
    return { ok: false, status: 403, reason: "forbidden" };
  }

  return { ok: true, user };
}

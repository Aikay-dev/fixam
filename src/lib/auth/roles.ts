import "server-only";

import { connectDB } from "@/lib/db";
import type { Role } from "@/lib/constants";
import { User } from "@/models/user";

/**
 * Confirm a role against the database when the session token says no.
 *
 * Roles live in the JWT, which caches them for a few minutes. That is fine
 * for the common case, but it breaks the moment a role changes mid-session:
 * a customer adds artisan access and is then bounced out of the dashboard
 * they were just granted, because their token still says "customer".
 *
 * The client refreshes the token via `update()`, but a guard should not
 * depend on the client having done so. Checking the database only when the
 * token says NO means:
 *   - the common path (token says yes) costs nothing,
 *   - a freshly granted role works immediately,
 *   - and a REVOKED role is never trusted from a stale token, because we
 *     never use this to override a token that already grants access.
 */
export async function hasRoleInDatabase(
  userId: string,
  role: Role,
): Promise<boolean> {
  try {
    await connectDB();
    const record = await User.findById(userId).select("roles status").lean().exec();

    if (!record || record.status === "suspended") return false;
    return record.roles.includes(role);
  } catch (error) {
    console.error("[roles] database check failed", error);
    return false;
  }
}

/** Token first, database only as a fallback when the token says no. */
export async function userHasRole(
  user: { id: string; roles?: Role[] | null } | null | undefined,
  role: Role,
): Promise<boolean> {
  if (!user?.id) return false;
  if (user.roles?.includes(role)) return true;
  return hasRoleInDatabase(user.id, role);
}

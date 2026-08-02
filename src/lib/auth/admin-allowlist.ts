/**
 * ⭐ WHO IS ALLOWED TO BE AN ADMIN.
 *
 * Add an email address to the array below to let that person hold admin
 * access. Remove one to revoke it instantly, everywhere.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  Why this lives in code rather than only in the database
 * ─────────────────────────────────────────────────────────────────────────
 * This list is checked every time an admin action happens — not just when
 * the role is granted. That matters: if the `roles` array in Mongo were ever
 * the only authority, then anyone who got write access to the database (a
 * leaked connection string, a stray script, a compromised Atlas password)
 * could make themselves an admin and start approving profiles, reading
 * every lead, and exporting customer data.
 *
 * Because this file is in version control, adding an admin requires a commit
 * and a deploy — visible, reviewable, and revertable. A database write is
 * none of those things.
 *
 * A user still needs BOTH:
 *   1. their email on this list, AND
 *   2. the `admin` role on their account (`npm run make-admin -- <email>`)
 *
 * Losing either one removes access.
 */

/** Admin email addresses. Case-insensitive. Edit this list. */
export const ADMIN_EMAILS: string[] = [
  "emmanese2020@gmail.com",
  // Add more below, one per line:
  // "second.admin@example.com",
];

/**
 * Optional extra addresses via the `ADMIN_EMAILS` env var (comma-separated).
 *
 * Useful for granting temporary access on a staging deploy without a commit.
 * The array above remains the source of truth for production.
 */
function envAdmins(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Every address currently permitted to hold admin access. */
export function allowedAdminEmails(): string[] {
  return [
    ...new Set([
      ...ADMIN_EMAILS.map((email) => email.trim().toLowerCase()),
      ...envAdmins(),
    ]),
  ].filter(Boolean);
}

/**
 * Is this address permitted to be an admin?
 *
 * Note this answers "may they be an admin", not "are they one" — holding the
 * role is a separate, additional requirement.
 */
export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowedAdminEmails().includes(email.trim().toLowerCase());
}

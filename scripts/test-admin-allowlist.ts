/**
 * ⭐ ADMIN ALLOW-LIST TEST.
 *
 * The claim being tested: holding the `admin` role in the database is NOT
 * sufficient. The email must also be on the allow-list in code.
 *
 * This is the scenario that matters — someone with database write access
 * (leaked connection string, stray script, compromised Atlas password)
 * grants themselves the admin role. If the role alone worked, they would now
 * be able to approve profiles, read every lead and export customer data.
 *
 * The test does exactly that: creates a user, forces the admin role straight
 * into Mongo, and confirms the application still refuses them.
 *
 * Requires the dev server running.
 *   npm run test:admin-allowlist
 *   BASE_URL=http://localhost:3001 npm run test:admin-allowlist
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const IMPOSTOR = {
  name: "Not An Admin",
  email: `impostor-${Date.now()}@fixam.local`,
  password: "allowlist-test-7733",
};

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

/** Minimal cookie-aware client (same approach as the journey test). */
class Session {
  private cookies = new Map<string, string>();

  private absorb(response: Response) {
    for (const cookie of response.headers.getSetCookie?.() ?? []) {
      const [pair] = cookie.split(";");
      const i = pair!.indexOf("=");
      if (i === -1) continue;
      const name = pair!.slice(0, i).trim();
      const value = pair!.slice(i + 1).trim();
      if (!value || value === "deleted") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const cookie = [...this.cookies.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    if (cookie) headers.set("cookie", cookie);

    const response = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      redirect: "manual",
    });
    this.absorb(response);
    return response;
  }

  async signIn(email: string, password: string): Promise<boolean> {
    const { csrfToken } = (await (await this.fetch("/api/auth/csrf")).json()) as {
      csrfToken: string;
    };
    await this.fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, email, password }).toString(),
    });
    return [...this.cookies.keys()].some((k) => k.includes("session-token"));
  }
}

async function main() {
  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { RateLimit, User } = await import("../src/models");
  const { allowedAdminEmails, isAllowedAdminEmail } = await import(
    "../src/lib/auth/admin-allowlist"
  );

  await connectDB();

  console.log(`Admin allow-list test against ${BASE}\n`);
  console.log("Allowed addresses:");
  for (const email of allowedAdminEmails()) console.log(`  • ${email}`);
  console.log("");

  // --- Unit-level ------------------------------------------------------
  console.log("1. The allow-list function itself\n");
  check(
    "a listed address is allowed",
    isAllowedAdminEmail(allowedAdminEmails()[0]!),
  );
  check(
    "case and whitespace are ignored",
    isAllowedAdminEmail(`  ${allowedAdminEmails()[0]!.toUpperCase()}  `),
  );
  check("an unlisted address is refused", !isAllowedAdminEmail(IMPOSTOR.email));
  check("empty is refused", !isAllowedAdminEmail(""));
  check("null is refused", !isAllowedAdminEmail(null));

  // --- The real scenario ------------------------------------------------
  console.log("\n2. Database says admin, allow-list says no\n");

  await RateLimit.deleteMany({ key: /^signup:/ });
  await User.deleteMany({ email: /^impostor-/ });

  const session = new Session();

  const register = await session.fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...IMPOSTOR, role: "customer" }),
  });
  check("impostor account created", register.status === 201, `got ${register.status}`);

  // Force the role straight into the database, bypassing every guard —
  // exactly what an attacker with database access would do.
  await User.updateOne(
    { email: IMPOSTOR.email },
    { $set: { emailVerified: new Date() }, $addToSet: { roles: "admin" } },
  );

  const impostor = await User.findOne({ email: IMPOSTOR.email })
    .select("roles")
    .lean()
    .exec();
  check(
    "database now records them as an admin",
    Boolean(impostor?.roles?.includes("admin")),
  );

  check("impostor signs in", await session.signIn(IMPOSTOR.email, IMPOSTOR.password));

  // Page guard.
  const adminPage = await session.fetch("/admin");
  check(
    "/admin still refused (redirects away)",
    adminPage.status === 307 || adminPage.status === 404,
    `got ${adminPage.status}`,
  );
  check(
    "not redirected INTO the admin area",
    !(adminPage.headers.get("location") ?? "").includes("/admin/"),
  );

  const settingsPage = await session.fetch("/admin/settings");
  check(
    "/admin/settings still refused",
    settingsPage.status === 307 || settingsPage.status === 404,
    `got ${settingsPage.status}`,
  );

  // API guard — the one that actually moves data.
  const moderate = await session.fetch(
    "/api/admin/artisans/000000000000000000000001",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    },
  );
  check("cannot moderate artisans", moderate.status === 403, `got ${moderate.status}`);

  const exportCsv = await session.fetch("/api/admin/leads/export");
  check(
    "cannot export the lead data",
    exportCsv.status === 403,
    `got ${exportCsv.status}`,
  );

  // --- Cleanup ----------------------------------------------------------
  await User.deleteMany({ email: /^impostor-/ });
  await disconnectDB();

  console.log(`\n${"─".repeat(52)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log("─".repeat(52));

  if (failed > 0) {
    console.error(
      "\n✗ The allow-list is not holding. A database write could grant admin.",
    );
    process.exit(1);
  }
  console.log(
    "\n✓ Admin requires BOTH the role and the allow-list. A database write alone is not enough.",
  );
}

main().catch((error) => {
  console.error("\n✗ test errored:", error);
  process.exit(1);
});

/**
 * ⭐ FULL USER JOURNEY TEST.
 *
 * Drives the real HTTP API exactly as a browser would — cookies, CSRF, the
 * lot — through the complete two-sided flow:
 *
 *   ARTISAN   sign up -> verify -> build a MULTI-TRADE profile -> submit
 *   ADMIN     review -> reject with a reason -> approve -> verify badge
 *   CUSTOMER  sign up -> verify -> browse -> search by EACH trade
 *             -> unlock the number -> re-unlock (dedupe) -> see it in contacts
 *
 * Every step asserts. Nothing is assumed to have worked because it didn't
 * error. Run against a dev server:
 *
 *   npm run test:journey
 *   BASE_URL=http://localhost:3001 npm run test:journey
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const STAMP = Date.now();

const ARTISAN = {
  name: "Tunde Adeyemi",
  email: `journey-artisan-${STAMP}@fixam.local`,
  password: "journey-test-9911",
};

const CUSTOMER = {
  name: "Amaka Obi",
  email: `journey-customer-${STAMP}@fixam.local`,
  password: "journey-test-9911",
};

/** The point of the multi-trade requirement: one artisan, three trades. */
const TRADE_SLUGS = ["plumber", "carpenter", "tiler"];

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`    ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`    ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function step(n: number, title: string) {
  console.log(`\n${n}. ${title}`);
}

// --- A tiny cookie-aware HTTP client -------------------------------------

class Session {
  private cookies = new Map<string, string>();

  constructor(readonly label: string) {}

  private header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private absorb(response: Response) {
    // Node exposes multiple Set-Cookie headers via getSetCookie().
    const raw = response.headers.getSetCookie?.() ?? [];
    for (const cookie of raw) {
      const [pair] = cookie.split(";");
      const index = pair!.indexOf("=");
      if (index === -1) continue;
      const name = pair!.slice(0, index).trim();
      const value = pair!.slice(index + 1).trim();
      if (value === "" || value === "deleted") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const cookie = this.header();
    if (cookie) headers.set("cookie", cookie);

    const response = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      redirect: "manual",
    });

    this.absorb(response);
    return response;
  }

  async json<T = Record<string, unknown>>(
    path: string,
    init?: RequestInit,
  ): Promise<{ status: number; body: T }> {
    const response = await this.fetch(path, init);
    const text = await response.text();
    let body: T;
    try {
      body = JSON.parse(text) as T;
    } catch {
      body = {} as T;
    }
    return { status: response.status, body };
  }

  post(path: string, payload: unknown) {
    return this.json(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  patch(path: string, payload: unknown) {
    return this.json(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  get isSignedIn() {
    return [...this.cookies.keys()].some((k) => k.includes("session-token"));
  }

  /** Full Auth.js credentials sign-in, CSRF and all. */
  async signIn(email: string, password: string): Promise<boolean> {
    const csrfResponse = await this.fetch("/api/auth/csrf");
    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

    const body = new URLSearchParams({ csrfToken, email, password });

    await this.fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    return this.isSignedIn;
  }
}

// --- Helpers --------------------------------------------------------------

/**
 * Pull the OTP out of the notification log.
 *
 * These journey addresses are fake, so nothing is actually delivered — but
 * the code is recorded in the subject line, which is exactly what the real
 * user would read in their inbox.
 */
async function readOtp(email: string): Promise<string | null> {
  const { Notification } = await import("../src/models");
  const note = await Notification.findOne({
    to: email.toLowerCase(),
    type: "verify-email-otp",
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const match = note?.subject?.match(/\b(\d{6})\b/);
  return match?.[1] ?? null;
}

async function main() {
  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { ArtisanProfile, Category, Lead, Lga, State, User } = await import(
    "../src/models"
  );

  await connectDB();

  console.log(`Full journey against ${BASE}`);
  console.log(`Artisan:  ${ARTISAN.email}`);
  console.log(`Customer: ${CUSTOMER.email}`);

  // Clear accounts left by earlier runs so the directory doesn't fill up with
  // test artisans and repeat runs start from the same place.
  const stale = await User.find({ email: /^journey-(artisan|customer)-/ })
    .select("_id")
    .lean()
    .exec();

  if (stale.length > 0) {
    const staleIds = stale.map((u) => u._id);
    const staleProfiles = await ArtisanProfile.find({ userId: { $in: staleIds } })
      .select("_id")
      .lean()
      .exec();

    await Promise.all([
      Lead.deleteMany({
        $or: [
          { customerUserId: { $in: staleIds } },
          { artisanProfileId: { $in: staleProfiles.map((p) => p._id) } },
        ],
      }),
      ArtisanProfile.deleteMany({ userId: { $in: staleIds } }),
      User.deleteMany({ _id: { $in: staleIds } }),
    ]);

    console.log(`(cleared ${stale.length} account(s) from previous runs)`);

    // Deleting profiles straight from Mongo skips the admin route that
    // maintains artisanCount — exactly how those counters drifted to
    // "Plumber — 7 artisans" against a real total of 2. Same function the
    // reconcile script uses, so this can't diverge from it.
    const { reconcileCounts } = await import("../src/lib/artisan/counts");
    const report = await reconcileCounts();
    if (report.total > 0) {
      console.log(`(realigned ${report.total} artisan counter(s))`);
    }
  }

  // Reset the signup rate-limit bucket.
  //
  // NOT a workaround for a bug — the limiter is doing its job. It caps signups
  // per IP, and this test drives two separate users down a single loopback
  // address, which real customers and artisans never would. Without this, the
  // journey is only runnable a couple of times an hour.
  const { RateLimit } = await import("../src/models");
  await RateLimit.deleteMany({ key: /^signup:/ });

  // Reference data the profile needs.
  const [tradeDocs, lagos] = await Promise.all([
    Category.find({ slug: { $in: TRADE_SLUGS } }).select("name slug").lean().exec(),
    State.findOne({ slug: "lagos" }).select("_id").lean().exec(),
  ]);

  if (tradeDocs.length !== TRADE_SLUGS.length || !lagos) {
    console.error("\n✗ Reference data missing. Run `npm run seed` first.");
    process.exit(1);
  }

  const lga = await Lga.findOne({ stateId: lagos._id, slug: "ikeja" })
    .select("_id name")
    .lean()
    .exec();

  if (!lga) {
    console.error("\n✗ Ikeja LGA missing. Run `npm run seed` first.");
    process.exit(1);
  }

  const artisanSession = new Session("artisan");
  const customerSession = new Session("customer");
  const adminSession = new Session("admin");

  // =====================================================================
  step(1, "ARTISAN — registers");
  // =====================================================================
  const register = await artisanSession.post("/api/auth/register", {
    ...ARTISAN,
    role: "artisan",
  });
  check("account created", register.status === 201, `got ${register.status}`);
  check(
    "told to verify email",
    (register.body as { requiresVerification?: boolean }).requiresVerification === true,
  );

  const artisanOtp = await readOtp(ARTISAN.email);
  check("verification code issued", Boolean(artisanOtp));

  // =====================================================================
  step(2, "ARTISAN — verifies email");
  // =====================================================================
  const wrongCode = await artisanSession.post("/api/auth/verify-otp", {
    email: ARTISAN.email,
    code: "000000",
  });
  check("wrong code rejected", wrongCode.status === 400);

  const verify = await artisanSession.post("/api/auth/verify-otp", {
    email: ARTISAN.email,
    code: artisanOtp,
  });
  check("correct code accepted", verify.status === 200);
  check(
    "recognised as an artisan",
    (verify.body as { isArtisan?: boolean }).isArtisan === true,
  );

  const replay = await artisanSession.post("/api/auth/verify-otp", {
    email: ARTISAN.email,
    code: artisanOtp,
  });
  check("code cannot be replayed", replay.status === 400);

  // =====================================================================
  step(3, "ARTISAN — signs in");
  // =====================================================================
  check("sign-in succeeds", await artisanSession.signIn(ARTISAN.email, ARTISAN.password));

  const session = await artisanSession.json<{ user?: { roles?: string[] } }>(
    "/api/auth/session",
  );
  check("session carries the artisan role", Boolean(session.body.user?.roles?.includes("artisan")));

  // =====================================================================
  step(4, "ARTISAN — builds a profile with THREE trades");
  // =====================================================================
  const basics = await artisanSession.patch("/api/me/profile", {
    basics: {
      displayName: ARTISAN.name,
      bio: "Plumbing, carpentry and tiling across Ikeja and Lagos mainland for 12 years. Bathrooms, kitchens, fittings and finishing.",
      yearsExperience: 12,
    },
  });
  check("basics saved", basics.status === 200);

  const badPhone = await artisanSession.patch("/api/me/profile", {
    contact: { phone: "0123456789" },
  });
  check("invalid phone rejected", badPhone.status === 400);

  const contact = await artisanSession.patch("/api/me/profile", {
    contact: { phone: "0805 447 2210" },
  });
  check("valid phone saved", contact.status === 200);
  check(
    "phone normalised to E.164",
    (contact.body as { profile?: { phone?: string } }).profile?.phone === "+2348054472210",
    (contact.body as { profile?: { phone?: string } }).profile?.phone,
  );

  // ⭐ The multi-trade requirement.
  const trades = await artisanSession.patch("/api/me/profile", {
    trades: tradeDocs.map((t, i) => ({
      categoryId: String(t._id),
      isPrimary: i === 0,
    })),
  });
  check("three trades saved", trades.status === 200);
  check(
    "profile lists all three",
    (trades.body as { profile?: { tradeIds?: string[] } }).profile?.tradeIds?.length === 3,
    `got ${(trades.body as { profile?: { tradeIds?: string[] } }).profile?.tradeIds?.length}`,
  );

  const location = await artisanSession.patch("/api/me/profile", {
    location: {
      stateId: String(lagos._id),
      lgaId: String(lga._id),
      areaText: "Allen Avenue",
      landmark: "Opposite the GTB on Allen",
    },
  });
  check("location saved", location.status === 200);
  check(
    "profile is complete enough to submit",
    (location.body as { completeness?: { canSubmit?: boolean } }).completeness?.canSubmit === true,
  );

  // =====================================================================
  step(5, "ARTISAN — submits for review");
  // =====================================================================
  const submit = await artisanSession.post("/api/me/profile/submit", {});
  check("submitted", submit.status === 200);
  check(
    "status is pending_review, NOT auto-approved",
    (submit.body as { status?: string }).status === "pending_review",
    (submit.body as { status?: string }).status,
  );

  // Look the profile up by the user we just created, never by display name —
  // names repeat across runs and would silently resolve to an older profile,
  // making every later assertion test the wrong record.
  const artisanUserDoc = await User.findOne({ email: ARTISAN.email })
    .select("_id")
    .lean()
    .exec();

  const profileDoc = await ArtisanProfile.findOne({
    userId: artisanUserDoc!._id,
  })
    .select("slug status searchKeywords")
    .lean()
    .exec();

  const slug = profileDoc!.slug;
  check("SEO slug generated", Boolean(slug), slug);
  check(
    "search keywords built from all trades + synonyms",
    (profileDoc!.searchKeywords?.length ?? 0) > 5,
    `${profileDoc!.searchKeywords?.length} keywords`,
  );

  // =====================================================================
  step(6, "PUBLIC — unapproved profile is invisible");
  // =====================================================================
  const hiddenProfile = await artisanSession.fetch(`/professionals/${slug}`);
  check("profile page 404s before approval", hiddenProfile.status === 404, `got ${hiddenProfile.status}`);

  // Assert on the SLUG, not the display name: the search box echoes whatever
  // was typed back into the input, so a name match here is a false positive.
  const hiddenSearch = await (
    await fetch(`${BASE}/professionals?q=${encodeURIComponent(ARTISAN.name)}`)
  ).text();
  check("no result card links to the profile", !hiddenSearch.includes(`/professionals/${slug}`));

  // Asserted with a query that CANNOT match anything, not with the test
  // artisan's name. The demo directory contains real people called "Tunde"
  // and "Adeyemi", so searching the fixture name legitimately returns hits
  // and the empty state never renders — that made this check fail for a
  // reason that had nothing to do with the moderation gate it exists to test.
  const impossible = await (
    await fetch(`${BASE}/professionals?q=zzzzqqqxnomatch`)
  ).text();
  check("directory reports no matches", impossible.includes("No professionals found"));

  // And it must not leak into an unfiltered browse either.
  const browseAll = await (await fetch(`${BASE}/professionals`)).text();
  check("absent from the unfiltered directory", !browseAll.includes(`/professionals/${slug}`));

  // =====================================================================
  step(7, "ADMIN — reviews and approves");
  // =====================================================================
  const admin = await User.findOne({ roles: "admin" }).select("email").lean().exec();

  if (!admin) {
    console.log("    ⚠ no admin account — skipping (run: npm run make-admin -- you@example.com)");
  } else {
    const signedIn = await adminSession.signIn(admin.email, "fixam-test-8899");
    check("admin signs in", signedIn);

    if (signedIn) {
      const id = String(profileDoc!._id);

      const noReason = await adminSession.patch(`/api/admin/artisans/${id}`, {
        action: "reject",
      });
      check("reject without a reason refused", noReason.status === 400);

      const rejected = await adminSession.patch(`/api/admin/artisans/${id}`, {
        action: "reject",
        reason: "Please add photos of finished work — customers judge on those more than anything.",
      });
      check("rejected with a reason", (rejected.body as { status?: string }).status === "rejected");

      const approved = await adminSession.patch(`/api/admin/artisans/${id}`, {
        action: "approve",
      });
      check("approved", (approved.body as { status?: string }).status === "approved");

      const badge = await adminSession.patch(`/api/admin/artisans/${id}`, {
        action: "verify",
      });
      check("verified badge granted", (badge.body as { isVerified?: boolean }).isVerified === true);

      const notAdmin = await artisanSession.patch(`/api/admin/artisans/${id}`, {
        action: "approve",
      });
      check("non-admin cannot moderate", notAdmin.status === 403);
    }
  }

  // =====================================================================
  step(8, "PUBLIC — approved profile is now visible under EVERY trade");
  // =====================================================================
  const liveProfile = await fetch(`${BASE}/professionals/${slug}`);
  const liveHtml = await liveProfile.text();
  check("profile page loads", liveProfile.status === 200);
  check("shows the artisan's name", liveHtml.includes(ARTISAN.name));
  check(
    "phone number NOT on the public page",
    !liveHtml.includes("+2348054472210") && !liveHtml.includes("0805 447 2210"),
  );

  for (const trade of tradeDocs) {
    const html = await (
      await fetch(`${BASE}/professionals?categoryId=${String(trade._id)}`)
    ).text();
    check(`findable under "${trade.name}"`, html.includes(ARTISAN.name));
  }

  // =====================================================================
  step(9, "CUSTOMER — registers and verifies");
  // =====================================================================
  const custRegister = await customerSession.post("/api/auth/register", {
    ...CUSTOMER,
    role: "customer",
  });
  check("account created", custRegister.status === 201);

  const custOtp = await readOtp(CUSTOMER.email);
  const custVerify = await customerSession.post("/api/auth/verify-otp", {
    email: CUSTOMER.email,
    code: custOtp,
  });
  check("email verified", custVerify.status === 200);
  check(
    "not flagged as an artisan",
    (custVerify.body as { isArtisan?: boolean }).isArtisan === false,
  );
  check("signs in", await customerSession.signIn(CUSTOMER.email, CUSTOMER.password));

  // =====================================================================
  step(10, "CUSTOMER — the reveal gate");
  // =====================================================================
  const anonymous = await fetch(`${BASE}/api/artisans/${slug}/reveal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  check("signed-out reveal blocked", anonymous.status === 401);

  const reveal = await customerSession.post(`/api/artisans/${slug}/reveal`, {
    source: "profile",
  });
  type Reveal = {
    phone?: string;
    displayPhone?: string;
    whatsappLink?: string | null;
    alreadyRevealed?: boolean;
  };
  check("number revealed", reveal.status === 200);
  check("correct number returned", (reveal.body as Reveal).phone === "+2348054472210");
  check(
    "formatted for humans",
    (reveal.body as Reveal).displayPhone === "0805 447 2210",
    (reveal.body as Reveal).displayPhone,
  );
  check("WhatsApp link built", Boolean((reveal.body as Reveal).whatsappLink));
  check("counted as a new lead", (reveal.body as Reveal).alreadyRevealed === false);

  const again = await customerSession.post(`/api/artisans/${slug}/reveal`, {
    source: "profile",
  });
  check("second reveal returns the same number", (again.body as Reveal).phone === "+2348054472210");
  check("recognised as a repeat", (again.body as Reveal).alreadyRevealed === true);

  const leadCount = await Lead.countDocuments({ artisanProfileId: profileDoc!._id });
  check("TWO reveals produced ONE lead", leadCount === 1, `found ${leadCount}`);

  const lead = await Lead.findOne({ artisanProfileId: profileDoc!._id }).lean().exec();
  check("lead recorded as free", lead?.billingStatus === "free");
  check("lead not chargeable in Stage One", lead?.chargeable === false);

  const selfReveal = await artisanSession.post(`/api/artisans/${slug}/reveal`, {});
  check("artisan cannot reveal their own number", selfReveal.status === 400);

  // =====================================================================
  step(11, "CUSTOMER — the contact appears in their account");
  // =====================================================================
  const contactsPage = await customerSession.fetch("/account/contacts");
  const contactsHtml = await contactsPage.text();
  check("contacts page loads", contactsPage.status === 200);
  check("artisan listed there", contactsHtml.includes(ARTISAN.name));
  check(
    "number shown (already unlocked)",
    contactsHtml.includes("0805 447 2210"),
  );

  // =====================================================================
  step(12, "ARTISAN — sees the lead");
  // =====================================================================
  const { Notification } = await import("../src/models");

  const alertCount = await Notification.countDocuments({
    userId: artisanUserDoc!._id,
    type: "lead-number-viewed",
  });
  check("artisan was emailed about the lead", alertCount >= 1);
  check("exactly one alert, not two", alertCount === 1, `found ${alertCount}`);

  const proPage = await artisanSession.fetch("/pro");
  const proHtml = await proPage.text();
  check("artisan dashboard loads", proPage.status === 200);
  check("dashboard shows they're live", proHtml.includes("You&#x27;re live") || proHtml.includes("You're live"));

  await disconnectDB();

  // =====================================================================
  console.log(`\n${"─".repeat(52)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log("─".repeat(52));

  if (failed > 0) {
    console.error("\n✗ Journey broken.");
    process.exit(1);
  }
  console.log("\n✓ Full journey works end to end.");
}

main().catch((error) => {
  console.error("\n✗ journey errored:", error);
  process.exit(1);
});

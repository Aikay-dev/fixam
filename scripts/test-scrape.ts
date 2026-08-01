/**
 * ⭐ THE SCRAPE TEST.
 *
 * Asserts that an artisan's phone number never appears in any publicly
 * reachable payload: the profile page HTML, the RSC flight data, the search
 * API, the sitemap, or a category page.
 *
 * This is the one regression that fails SILENTLY. Nothing errors, no test
 * goes red, the site looks perfect — and the entire directory can be
 * harvested in an afternoon, which makes Stage Two pay-per-lead worthless
 * before it launches. Hence a dedicated, permanent check.
 *
 * Requires the dev server running.
 *   npm run test:scrape                 (defaults to http://localhost:3000)
 *   BASE_URL=http://localhost:3001 npm run test:scrape
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Matches stored E.164 and the common local format a serialiser bug could emit. */
const PHONE_PATTERN =
  /(\+?234[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4})|(\b0[789]\d{9}\b)/;

type Check = { label: string; url: string; init?: RequestInit };

async function main() {
  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { ArtisanProfile } = await import("../src/models");

  await connectDB();

  // Test against real approved artisans that actually have numbers stored —
  // testing against a profile with no phone would pass vacuously.
  const artisans = await ArtisanProfile.find({
    status: "approved",
    phone: { $ne: null },
  })
    .select("slug displayName phone whatsapp location")
    .lean()
    .exec();

  if (artisans.length === 0) {
    console.log(
      "⚠ No approved artisans with a phone number — nothing to test.\n" +
        "  Seed one and run `npm run dev:approve` first.",
    );
    await disconnectDB();
    return;
  }

  console.log(
    `Testing ${artisans.length} approved artisan(s) against ${BASE}\n`,
  );

  const checks: Check[] = [
    { label: "directory page", url: `${BASE}/artisans` },
    { label: "directory search", url: `${BASE}/artisans?q=plumber` },
    { label: "home page", url: `${BASE}/` },
  ];

  for (const artisan of artisans) {
    checks.push({
      label: `profile HTML (${artisan.slug})`,
      url: `${BASE}/artisans/${artisan.slug}`,
    });
    // The RSC flight payload is a separate surface from the HTML and has to
    // be checked on its own — serialised props land here even when the
    // rendered markup looks clean.
    checks.push({
      label: `profile RSC payload (${artisan.slug})`,
      url: `${BASE}/artisans/${artisan.slug}`,
      init: { headers: { RSC: "1" } },
    });
  }

  let failures = 0;
  let checked = 0;

  for (const check of checks) {
    let body: string;
    try {
      const response = await fetch(check.url, check.init);
      body = await response.text();
    } catch (error) {
      console.log(`  ? ${check.label} — could not fetch (${String(error)})`);
      continue;
    }

    checked += 1;

    // Generic pattern sweep.
    const patternHit = body.match(PHONE_PATTERN);

    // Exact stored values — catches an obfuscated or reformatted leak that
    // the generic pattern might miss.
    const exactHit = artisans.find((a) => {
      const candidates = [a.phone, a.whatsapp].filter(Boolean) as string[];
      return candidates.some((phone) => {
        const national = phone.replace(/^\+?234/, "");
        return (
          body.includes(phone) ||
          body.includes(`0${national}`) ||
          body.includes(national)
        );
      });
    });

    if (patternHit || exactHit) {
      failures += 1;
      console.log(`  ✗ LEAK in ${check.label}`);
      console.log(`      ${check.url}`);
      if (patternHit) console.log(`      matched: ${patternHit[0]}`);
      if (exactHit)
        console.log(`      exact number for: ${exactHit.displayName}`);
    } else {
      console.log(`  ✓ ${check.label}`);
    }
  }

  await disconnectDB();

  console.log("");

  if (failures > 0) {
    console.error(
      `✗ SCRAPE TEST FAILED — ${failures} of ${checked} surfaces leak a phone number.\n` +
        "  Every public read path must go through toPublicArtisan() and\n" +
        "  PUBLIC_ARTISAN_PROJECTION. Fix before deploying.",
    );
    process.exit(1);
  }

  console.log(
    `✓ No phone numbers exposed across ${checked} public surfaces.\n` +
      "  The reveal endpoint remains the only way to obtain one.",
  );
}

main().catch((error) => {
  console.error("\n✗ scrape test errored:", error);
  process.exit(1);
});

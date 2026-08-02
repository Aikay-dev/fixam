/**
 * ⭐ SEO SURFACE TEST.
 *
 * Guards the two things that fail quietly on the /services/* pages:
 *
 *   1. THIN CONTENT — ~82 trades across 774 LGAs is over 60,000 possible
 *      URLs. If the guard regresses, the site starts publishing tens of
 *      thousands of empty "0 results" pages, which Google treats as a
 *      doorway-page pattern. Nothing errors; rankings just quietly die.
 *
 *   2. ADVERTISED DEAD ENDS — every URL in the sitemap must actually render.
 *      Submitting 404s to Search Console is worse than submitting nothing.
 *
 * Requires the dev server running.
 *   BASE_URL=http://localhost:3001 npm run test:seo
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

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

async function status(path: string): Promise<number> {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return response.status;
}

async function main() {
  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { ArtisanProfile, Category, Lga, State } = await import("../src/models");
  const { PUBLIC_ARTISAN_STATUS } = await import("../src/lib/constants");

  await connectDB();

  console.log(`SEO surfaces against ${BASE}\n`);

  // ---------------------------------------------------------------
  console.log("1. Pages that SHOULD exist\n");

  // Derive from the database rather than hardcoding: whatever combinations
  // genuinely have an artisan must render.
  const combos = await ArtisanProfile.aggregate([
    { $match: { status: PUBLIC_ARTISAN_STATUS } },
    { $unwind: "$trades" },
    {
      $group: {
        _id: {
          category: "$trades.categoryId",
          state: "$location.stateId",
          lga: "$location.lgaId",
        },
      },
    },
    { $limit: 25 },
  ]).exec();

  if (combos.length === 0) {
    console.log("  ⚠ no approved artisans — seed one and run `npm run dev:approve`");
  }

  const [categories, states, lgas] = await Promise.all([
    Category.find().select("slug").lean().exec(),
    State.find().select("slug").lean().exec(),
    Lga.find().select("slug").lean().exec(),
  ]);

  const catSlug = new Map(categories.map((c) => [String(c._id), c.slug]));
  const stateSlug = new Map(states.map((s) => [String(s._id), s.slug]));
  const lgaSlug = new Map(lgas.map((l) => [String(l._id), l.slug]));

  const shouldExist = new Set<string>();
  for (const row of combos) {
    const c = catSlug.get(String(row._id.category));
    const s = row._id.state ? stateSlug.get(String(row._id.state)) : null;
    const l = row._id.lga ? lgaSlug.get(String(row._id.lga)) : null;
    if (!c) continue;
    shouldExist.add(`/services/${c}`);
    if (s) shouldExist.add(`/services/${c}/${s}`);
    if (s && l) shouldExist.add(`/services/${c}/${s}/${l}`);
  }

  for (const path of shouldExist) {
    check(`200  ${path}`, (await status(path)) === 200);
  }

  // ---------------------------------------------------------------
  console.log("\n2. Thin-content guard — these must 404\n");

  // A real trade and a real place, but no artisan there.
  const emptyCombos: string[] = [];

  const usedCategoryIds = new Set(combos.map((r) => String(r._id.category)));
  const emptyCategory = categories.find(
    (c) => c.slug && !usedCategoryIds.has(String(c._id)),
  );
  if (emptyCategory) emptyCombos.push(`/services/${emptyCategory.slug}`);

  const usedStateIds = new Set(
    combos.map((r) => (r._id.state ? String(r._id.state) : "")),
  );
  const emptyState = states.find((s) => !usedStateIds.has(String(s._id)));
  const anyCategory = catSlug.get(String(combos[0]?._id.category)) ?? "plumber";
  if (emptyState) emptyCombos.push(`/services/${anyCategory}/${emptyState.slug}`);

  for (const path of emptyCombos) {
    check(`404  ${path}`, (await status(path)) === 404, "empty page is indexable");
  }

  // Nonsense slugs.
  for (const path of [
    "/services/not-a-real-trade",
    "/services/plumber/not-a-state",
    "/services/plumber/lagos/not-an-lga",
  ]) {
    check(`404  ${path}`, (await status(path)) === 404);
  }

  // ---------------------------------------------------------------
  console.log("\n3. Sitemap\n");

  const sitemapResponse = await fetch(`${BASE}/sitemap.xml`);
  const sitemapXml = await sitemapResponse.text();

  check("sitemap.xml serves", sitemapResponse.status === 200);
  check(
    "is XML",
    (sitemapResponse.headers.get("content-type") ?? "").includes("xml"),
  );

  const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  check("contains URLs", urls.length > 0, `${urls.length} found`);

  const paths = urls.map((u) => {
    try {
      return new URL(u).pathname;
    } catch {
      return u;
    }
  });

  check("no duplicate URLs", new Set(paths).size === paths.length);
  check("includes artisan profiles", paths.some((p) => p.startsWith("/artisans/")));
  check("includes service pages", paths.some((p) => p.startsWith("/services/")));
  check(
    "excludes private areas",
    !paths.some((p) => /^\/(admin|pro|account|login|signup|api)/.test(p)),
  );

  // The expensive but important one.
  let dead = 0;
  for (const path of paths) {
    if ((await status(path)) !== 200) {
      dead += 1;
      console.log(`      dead: ${path}`);
    }
  }
  check(
    "every sitemap URL resolves 200",
    dead === 0,
    `${dead} of ${paths.length} are dead`,
  );

  // ---------------------------------------------------------------
  console.log("\n4. robots.txt\n");

  const robotsResponse = await fetch(`${BASE}/robots.txt`);
  const robotsTxt = await robotsResponse.text();
  check("robots.txt serves", robotsResponse.status === 200);

  const isLocal = /localhost|127\.0\.0\.1/.test(BASE);
  if (isLocal) {
    // Non-production hosts must be fully blocked, otherwise a preview deploy
    // competes with the real site in search results.
    check(
      "non-production host is blocked from indexing",
      /Disallow:\s*\/\s*$/m.test(robotsTxt.trim()) || robotsTxt.includes("Disallow: /"),
      robotsTxt.slice(0, 80),
    );
  } else {
    check("production allows crawling", robotsTxt.includes("Allow: /"));
    check("private areas disallowed", robotsTxt.includes("/admin"));
    check("sitemap referenced", robotsTxt.includes("sitemap.xml"));
  }

  await disconnectDB();

  console.log(`\n${"─".repeat(52)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log("─".repeat(52));

  if (failed > 0) {
    console.error("\n✗ SEO surfaces have problems.");
    process.exit(1);
  }
  console.log("\n✓ SEO surfaces are sound.");
}

main().catch((error) => {
  console.error("\n✗ test errored:", error);
  process.exit(1);
});

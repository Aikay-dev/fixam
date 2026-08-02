/**
 * Seeds reference data: categories, states, LGAs, platform config.
 *
 * Idempotent — every write is an upsert keyed on slug, so re-running after
 * editing src/data/*.ts updates in place rather than duplicating. Safe to run
 * against a database that already has artisans in it.
 *
 * Run with:  npm run seed
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  // Imported lazily so dotenv has populated process.env before env.ts parses it.
  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { CATEGORY_GROUPS, TOTAL_CATEGORY_COUNT } = await import(
    "../src/data/categories"
  );
  const { STATES, TOTAL_LGA_COUNT } = await import("../src/data/locations");
  const { Category } = await import("../src/models/category");
  const { State, Lga } = await import("../src/models/location");
  const { getPlatformConfig } = await import("../src/models/platform-config");

  console.log("→ connecting…");
  await connectDB();

  // --- Categories ---------------------------------------------------------
  console.log("→ seeding categories…");
  let groupCount = 0;
  let leafCount = 0;

  for (const [groupIndex, group] of CATEGORY_GROUPS.entries()) {
    const parent = await Category.findOneAndUpdate(
      { slug: group.slug },
      {
        $set: {
          name: group.name,
          icon: group.icon,
          parentId: null,
          order: groupIndex,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    groupCount += 1;

    for (const [childIndex, child] of group.children.entries()) {
      const title = `${child.name}s in Nigeria`;

      await Category.findOneAndUpdate(
        { slug: child.slug },
        {
          $set: {
            name: child.name,
            parentId: parent._id,
            order: childIndex,
            icon: group.icon,
            isActive: true,
            synonyms: child.synonyms ?? [],
            description: child.description ?? "",
            // Per-category copy, not a shared template — 90 pages of the same
            // boilerplate reads as thin content.
            // No "| Fixam" suffix — the app's title template appends it.
            seoTitle: `Find a trusted ${child.name} near you`,
            seoDescription:
              child.description ??
              `Browse vetted ${child.name.toLowerCase()}s near you on Fixam. Real reviews, real photos, and free contact on WhatsApp.`,
            h1: title,
            introCopy:
              child.description ??
              `Compare ${child.name.toLowerCase()}s near you, check their ratings and past work, then reach out directly. Free for customers, always.`,
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
      leafCount += 1;
    }
  }

  console.log(`  ✓ ${groupCount} groups, ${leafCount} trades`);

  // --- States & LGAs ------------------------------------------------------
  console.log("→ seeding states and LGAs…");
  let stateCount = 0;
  let lgaCount = 0;

  for (const seedState of STATES) {
    const stateDoc = await State.findOneAndUpdate(
      { slug: slugify(seedState.name) },
      {
        $set: {
          name: seedState.name,
          code: seedState.code,
          isLaunchCity: seedState.isLaunchCity ?? false,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    stateCount += 1;

    for (const lgaName of seedState.lgas) {
      await Lga.findOneAndUpdate(
        { stateId: stateDoc._id, slug: slugify(lgaName) },
        {
          $set: {
            name: lgaName,
            isActive: true,
            popularAreas: seedState.popularAreas?.[lgaName] ?? [],
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
      lgaCount += 1;
    }
  }

  console.log(`  ✓ ${stateCount} states, ${lgaCount} LGAs`);

  // --- Platform config ----------------------------------------------------
  console.log("→ ensuring platform config…");
  const cfg = await getPlatformConfig();
  console.log(
    `  ✓ monetizationEnabled=${cfg.monetizationEnabled} (Stage One), revealLimitPerDay=${cfg.revealLimitPerDay}`,
  );

  // --- Sanity check -------------------------------------------------------
  const categoriesInDb = await Category.countDocuments();
  const lgasInDb = await Lga.countDocuments();

  console.log("");
  console.log("Summary");
  console.log(`  categories in db: ${categoriesInDb} (expected ${TOTAL_CATEGORY_COUNT})`);
  console.log(`  LGAs in db:       ${lgasInDb} (expected ${TOTAL_LGA_COUNT})`);

  await disconnectDB();
  console.log("\n✓ seed complete");
}

/** Local slugify — avoids importing app code into a standalone script. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main().catch((error) => {
  console.error("\n✗ seed failed:", error);
  process.exit(1);
});

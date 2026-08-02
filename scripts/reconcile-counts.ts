/**
 * Realign the denormalised artisanCount fields with reality.
 *
 * Categories, states and LGAs each cache how many approved artisans they
 * have. That counter is incremented on approval, but nothing decrements it
 * when a profile is deleted directly in the database, removed by a script, or
 * lost to a partial write — so it only ever drifts upward. It reached
 * "Plumber — 7 artisans" against a real total of 2.
 *
 * User-facing counts are computed live now (src/lib/artisan/counts.ts), so
 * drift can no longer mislead a visitor. This keeps the stored values honest
 * for the cheaper queries that still read them.
 *
 * Safe to run any time; it only writes where the value is wrong.
 *
 *   npm run reconcile:counts            (fix)
 *   npm run reconcile:counts -- --check (report only, non-zero exit on drift)
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const checkOnly = process.argv.includes("--check");

  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { reconcileCounts } = await import("../src/lib/artisan/counts");

  await connectDB();

  const report = await reconcileCounts({ dryRun: checkOnly });

  const sections = [
    ["categories", report.categories],
    ["states", report.states],
    ["LGAs", report.lgas],
  ] as const;

  for (const [label, drift] of sections) {
    if (drift.length === 0) {
      console.log(`  ✓ ${label}: all correct`);
      continue;
    }

    console.log(`  ${label}: ${drift.length} out of sync`);
    for (const d of drift.slice(0, 15)) {
      console.log(`      ${d.name.padEnd(24)} ${d.from} -> ${d.to}`);
    }
    if (drift.length > 15) console.log(`      … and ${drift.length - 15} more`);
    if (!checkOnly) console.log("      ✓ corrected");
  }

  await disconnectDB();

  console.log("");
  if (report.total === 0) {
    console.log("✓ Counters match reality.");
    return;
  }

  if (checkOnly) {
    console.error(
      `✗ ${report.total} counter(s) drifted. Run without --check to fix.`,
    );
    process.exit(1);
  }

  console.log(`✓ Corrected ${report.total} counter(s).`);
}

main().catch((error) => {
  console.error("\n✗ reconcile failed:", error);
  process.exit(1);
});

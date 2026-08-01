/**
 * Regression test for the lead dedupe guarantee.
 *
 * The rule: one customer revealing the same artisan's number twice inside the
 * 30-day window must produce ONE lead, not two. If this breaks, Stage One
 * demand metrics inflate and Stage Two double-charges artisans for the same
 * customer — so it is enforced by a unique index, not by application logic
 * that could race under concurrent requests.
 *
 * Run with:  npm run test:dedupe
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { Lead } = await import("../src/models");
  const { Types } = await import("mongoose");

  await connectDB();
  await Lead.createIndexes();

  const customerUserId = new Types.ObjectId();
  const artisanProfileId = new Types.ObjectId();
  const artisanUserId = new Types.ObjectId();

  const base = {
    customerUserId,
    artisanProfileId,
    artisanUserId,
    dedupeWindowStart: new Date("2026-08-01T00:00:00Z"),
  };

  let failures = 0;

  try {
    const first = await Lead.create(base);
    console.log(
      `  ✓ 1st reveal created a lead (billingStatus=${first.billingStatus}, chargeable=${first.chargeable}, creditCost=${first.creditCost})`,
    );

    if (first.billingStatus !== "free" || first.chargeable || first.creditCost !== 0) {
      failures += 1;
      console.log("  ✗ Stage One lead was not written as free/non-chargeable");
    }

    // Same customer, same artisan, same window — must be rejected.
    try {
      await Lead.create(base);
      failures += 1;
      console.log("  ✗ 2nd reveal created a DUPLICATE lead — dedupe is broken");
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code === 11000) {
        console.log("  ✓ 2nd reveal rejected by unique index (E11000)");
      } else {
        failures += 1;
        console.log(`  ✗ 2nd reveal failed for the wrong reason: ${String(error)}`);
      }
    }

    // A later window is a genuinely new lead — the customer came back weeks on.
    await Lead.create({
      ...base,
      dedupeWindowStart: new Date("2026-08-31T00:00:00Z"),
    });
    console.log("  ✓ reveal in the next window created a new lead");

    const total = await Lead.countDocuments({ customerUserId, artisanProfileId });
    if (total === 2) {
      console.log(`  ✓ total leads for the pair: ${total} (expected 2)`);
    } else {
      failures += 1;
      console.log(`  ✗ total leads for the pair: ${total} (expected 2)`);
    }
  } finally {
    await Lead.deleteMany({ customerUserId });
    await disconnectDB();
  }

  if (failures > 0) {
    console.error(`\n✗ lead dedupe: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\n✓ lead dedupe holds");
}

main().catch((error) => {
  console.error("\n✗ test failed:", error);
  process.exit(1);
});

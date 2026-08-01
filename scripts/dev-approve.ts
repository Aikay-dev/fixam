/**
 * Dev helper: approve every pending artisan profile.
 *
 * Stands in for the admin approval queue (Phase 7) so the public directory and
 * the reveal gate can be exercised before that UI exists. Refuses to run in
 * production — approval is a human decision, not a script.
 *
 * Run with:  npm run dev:approve
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to bulk-approve in production.");
    process.exit(1);
  }

  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { ArtisanProfile } = await import("../src/models");

  await connectDB();

  const pending = await ArtisanProfile.find({ status: "pending_review" })
    .select("displayName slug")
    .lean()
    .exec();

  if (pending.length === 0) {
    console.log("Nothing pending.");
    await disconnectDB();
    return;
  }

  const result = await ArtisanProfile.updateMany(
    { status: "pending_review" },
    { $set: { status: "approved", publishedAt: new Date() } },
  );

  for (const p of pending) {
    console.log(`  ✓ approved ${p.displayName} (/artisans/${p.slug})`);
  }
  console.log(`\n${result.modifiedCount} profile(s) approved.`);

  await disconnectDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

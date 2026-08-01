/**
 * Builds every index declared on the models and prints what landed.
 *
 * Mongoose only creates indexes lazily on first use of a model, so a fresh
 * deploy can serve traffic for a while with none of them present. Running
 * this after a deploy makes index creation explicit rather than incidental.
 *
 * Run with:  npm run verify:indexes
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

/** Indexes the application genuinely depends on for correctness, not speed. */
const CRITICAL: Array<{ model: string; key: string; reason: string }> = [
  {
    model: "Lead",
    key: "customerUserId_1_artisanProfileId_1_dedupeWindowStart_1",
    reason: "lead dedupe — without it one customer can create many leads for one artisan",
  },
  {
    model: "Review",
    key: "leadId_1",
    reason: "one review per contact — without it the trust layer is trivially gamed",
  },
  { model: "User", key: "email_1", reason: "duplicate accounts on the same email" },
  { model: "OtpToken", key: "expiresAt_1", reason: "TTL reaping of expired codes" },
  { model: "ArtisanProfile", key: "slug_1", reason: "profile URL collisions" },
  { model: "Report", key: "reporterUserId_1_targetType_1_targetId_1", reason: "report brigading" },
];

async function main() {
  const { connectDB, disconnectDB, mongoose } = await import("../src/lib/db");
  const models = await import("../src/models");

  await connectDB();

  const registry = [
    ["User", models.User],
    ["OtpToken", models.OtpToken],
    ["ArtisanProfile", models.ArtisanProfile],
    ["Category", models.Category],
    ["State", models.State],
    ["Lga", models.Lga],
    ["Lead", models.Lead],
    ["Review", models.Review],
    ["Report", models.Report],
    ["AuditLog", models.AuditLog],
    ["Notification", models.Notification],
    ["RateLimit", models.RateLimit],
    ["PlatformConfig", models.PlatformConfig],
    ["Wallet", models.Wallet],
    ["CreditTransaction", models.CreditTransaction],
  ] as const;

  console.log("→ building indexes…\n");

  const found = new Map<string, Set<string>>();

  for (const [name, model] of registry) {
    // createIndexes is additive; it will not drop anything already present.
    await model.createIndexes();
    const indexes = await model.collection.indexes();
    const names = new Set(indexes.map((i) => i.name as string));
    found.set(name, names);

    const unique = indexes.filter((i) => i.unique).map((i) => i.name);
    const ttl = indexes.filter((i) => i.expireAfterSeconds !== undefined).map((i) => i.name);

    console.log(`  ${name.padEnd(18)} ${String(indexes.length).padStart(2)} indexes`);
    if (unique.length) console.log(`  ${" ".repeat(18)}   unique: ${unique.join(", ")}`);
    if (ttl.length) console.log(`  ${" ".repeat(18)}   ttl:    ${ttl.join(", ")}`);
  }

  console.log("\n→ checking correctness-critical indexes…\n");

  let missing = 0;
  for (const check of CRITICAL) {
    const present = found.get(check.model)?.has(check.key);
    if (present) {
      console.log(`  ✓ ${check.model}.${check.key}`);
    } else {
      missing += 1;
      console.log(`  ✗ MISSING ${check.model}.${check.key}`);
      console.log(`      ${check.reason}`);
    }
  }

  await disconnectDB();

  if (missing > 0) {
    console.error(`\n✗ ${missing} critical index(es) missing`);
    process.exit(1);
  }

  console.log("\n✓ all critical indexes present");
  void mongoose;
}

main().catch((error) => {
  console.error("\n✗ index verification failed:", error);
  process.exit(1);
});

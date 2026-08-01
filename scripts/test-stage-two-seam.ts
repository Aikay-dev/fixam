/**
 * ⭐ STAGE TWO SEAM TEST.
 *
 * The central architectural claim of Fixam is that turning on pay-per-lead
 * credits is a policy change, not a rebuild. This test holds that claim
 * honest in two ways:
 *
 *   1. STRUCTURAL — `monetizationEnabled` must be read in exactly one place
 *      outside the model that defines it: canRevealContact(). If a second
 *      file starts reading it, the decision has leaked and the seam is gone.
 *
 *   2. BEHAVIOURAL — flipping the flag must not break the reveal path. It
 *      fails OPEN, because a billing bug that stops customers reaching
 *      artisans breaks both sides of the marketplace at once.
 *
 * Run with:  npm run test:stage-two
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const SRC = join(process.cwd(), "src");

/** Files permitted to mention the flag. */
const ALLOWED = [
  join("src", "lib", "artisan", "reveal-policy.ts"), // the seam itself
  join("src", "models", "platform-config.ts"), // where it is defined
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Strip comments before scanning.
 *
 * Documentation that *mentions* the flag is fine and desirable — what matters
 * is executable code that *reads* it. Without this the test flags its own
 * explanatory comments, which trains people to ignore it.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

async function structural(): Promise<number> {
  console.log("1. Structural — who reads monetizationEnabled?\n");

  const offenders: string[] = [];

  for (const file of walk(SRC)) {
    const rel = relative(process.cwd(), file);
    if (ALLOWED.some((a) => rel === a)) continue;
    if (stripComments(readFileSync(file, "utf8")).includes("monetizationEnabled")) {
      offenders.push(rel);
    }
  }

  for (const allowed of ALLOWED) console.log(`  ✓ ${allowed}`);

  if (offenders.length > 0) {
    console.log("");
    for (const o of offenders) console.log(`  ✗ LEAKED into ${o}`);
    console.log(
      "\n  The billing decision must stay inside canRevealContact().\n" +
        "  Move the check back before this becomes a Stage Two migration.",
    );
    return offenders.length;
  }

  console.log("\n  ✓ The flag is read in exactly one decision point.\n");
  return 0;
}

async function behavioural(): Promise<number> {
  console.log("2. Behavioural — flip the flag and re-run the decision.\n");

  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { PlatformConfig } = await import("../src/models");
  const { canRevealContact } = await import("../src/lib/artisan/reveal-policy");

  await connectDB();

  const context = {
    customerUserId: "000000000000000000000001",
    artisanUserId: "000000000000000000000002",
    artisanProfileId: "000000000000000000000003",
    isDuplicate: false,
  };

  let failures = 0;

  // --- Stage One (flag off) --------------------------------------------
  await PlatformConfig.updateOne(
    { key: "default" },
    { $set: { monetizationEnabled: false } },
    { upsert: true },
  );

  const stageOne = await canRevealContact(context);
  if (stageOne.allowed && stageOne.cost === 0 && !stageOne.chargeable) {
    console.log("  ✓ flag off  -> allowed, cost 0, not chargeable");
  } else {
    failures += 1;
    console.log(`  ✗ flag off  -> ${JSON.stringify(stageOne)}`);
  }

  // --- Stage Two (flag on) ---------------------------------------------
  try {
    await PlatformConfig.updateOne(
      { key: "default" },
      { $set: { monetizationEnabled: true } },
    );

    const stageTwo = await canRevealContact(context);

    if (stageTwo.allowed) {
      console.log(
        "  ✓ flag on   -> still allowed (fails open, as designed)",
      );
    } else {
      failures += 1;
      console.log(
        `  ✗ flag on   -> DENIED (${JSON.stringify(stageTwo)}).\n` +
          "      A billing gap must never block a customer reaching an artisan.",
      );
    }

    // A duplicate must never be charged twice, in either stage.
    const duplicate = await canRevealContact({ ...context, isDuplicate: true });
    if (duplicate.allowed && duplicate.cost === 0) {
      console.log("  ✓ duplicate -> free (artisan already paid for this lead)");
    } else {
      failures += 1;
      console.log(`  ✗ duplicate -> ${JSON.stringify(duplicate)}`);
    }
  } finally {
    // Always restore Stage One, whatever happened above.
    await PlatformConfig.updateOne(
      { key: "default" },
      { $set: { monetizationEnabled: false } },
    );
    console.log("\n  ↩ restored monetizationEnabled = false");
    await disconnectDB();
  }

  return failures;
}

async function main() {
  const failures = (await structural()) + (await behavioural());

  console.log("");
  if (failures > 0) {
    console.error(`✗ Stage Two seam: ${failures} problem(s).`);
    process.exit(1);
  }
  console.log(
    "✓ Stage Two seam holds — monetisation is one function and one flag.",
  );
}

main().catch((error) => {
  console.error("\n✗ test errored:", error);
  process.exit(1);
});

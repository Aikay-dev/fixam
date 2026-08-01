/**
 * Grant (or revoke) the admin role.
 *
 * The first admin has to be created out-of-band — there is deliberately no
 * self-service route to admin, because a signup form that can mint admins is
 * a signup form that will eventually mint someone else's admin.
 *
 *   npm run make-admin -- you@example.com
 *   npm run make-admin -- you@example.com --revoke
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"))?.toLowerCase();
  const revoke = args.includes("--revoke");

  if (!email) {
    console.error("Usage: npm run make-admin -- you@example.com [--revoke]");
    process.exit(1);
  }

  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { User } = await import("../src/models");

  await connectDB();

  const user = await User.findOne({ email }).exec();

  if (!user) {
    console.error(`No account found for ${email}. Sign up first, then re-run.`);
    await disconnectDB();
    process.exit(1);
  }

  const updated = await User.findOneAndUpdate(
    { _id: user._id },
    revoke ? { $pull: { roles: "admin" } } : { $addToSet: { roles: "admin" } },
    { returnDocument: "after" },
  ).exec();

  console.log(
    `${revoke ? "Revoked admin from" : "Granted admin to"} ${email}`,
  );
  console.log(`  roles: ${updated?.roles.join(", ")}`);
  console.log(
    "\nNote: sign out and back in — roles are read into the session token at sign-in.",
  );

  await disconnectDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

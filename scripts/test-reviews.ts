/**
 * Regression test for the review trust layer.
 *
 * The whole pitch rests on one claim: a review on Fixam came from someone who
 * actually hired the person. Three rules enforce it, and all three are tested
 * here because each one is the kind of thing that breaks silently:
 *
 *   1. No lead, no review. You cannot review someone whose number you never took.
 *   2. Someone else's lead is not your lead.
 *   3. One lead yields exactly one review — enforced by a unique index, not by
 *      an application check that two concurrent requests could both pass.
 *
 * It also checks the denormalised rating, which is the number every card in
 * the directory sorts on. A rating that disagrees with the reviews under it
 * is worse than no rating at all.
 *
 * Run with:  npm run test:reviews
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

let failures = 0;

function check(label: string, passed: boolean, detail?: string) {
  console.log(`  ${passed ? "✓" : "✗"} ${label}${passed || !detail ? "" : ` — ${detail}`}`);
  if (!passed) failures += 1;
}

async function main() {
  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { ArtisanProfile, Lead, Review, User } = await import("../src/models");
  const { recomputeRating } = await import("../src/lib/reviews/aggregate");
  const { Types } = await import("mongoose");

  await connectDB();
  await Review.createIndexes();

  const stamp = Date.now();
  const artisanUserId = new Types.ObjectId();
  const profileId = new Types.ObjectId();

  const customer = await new User({
    name: "Review Test Customer",
    email: `review-test-${stamp}@fixam.local`,
    roles: ["customer"],
    isVerified: true,
    status: "active",
  }).save();

  const stranger = await new User({
    name: "Unrelated Person",
    email: `review-stranger-${stamp}@fixam.local`,
    roles: ["customer"],
    isVerified: true,
    status: "active",
  }).save();

  const created: { profile?: unknown } = {};

  try {
    await ArtisanProfile.create({
      _id: profileId,
      userId: artisanUserId,
      slug: `review-test-${stamp}`,
      displayName: "Review Test Professional",
      status: "approved",
    });
    created.profile = true;

    const lead = await Lead.create({
      artisanProfileId: profileId,
      artisanUserId,
      customerUserId: customer._id,
      dedupeWindowStart: new Date(),
    });

    console.log("\n1. The lead gate\n");

    // Rule 3 — the unique index, tested directly. This is the guarantee that
    // holds under concurrency; the route's pre-check is only a nicer error.
    await Review.create({
      leadId: lead._id,
      artisanProfileId: profileId,
      customerUserId: customer._id,
      rating: 5,
      body: "Turned up when promised and finished the job the same day.",
      status: "published",
    });
    check("first review accepted", true);

    try {
      await Review.create({
        leadId: lead._id,
        artisanProfileId: profileId,
        customerUserId: customer._id,
        rating: 1,
        body: "Trying to review the same contact a second time.",
        status: "published",
      });
      check("second review on the same lead rejected", false, "a duplicate was written");
    } catch (error) {
      const code = (error as { code?: number }).code;
      check(
        "second review on the same lead rejected",
        code === 11000,
        `expected E11000, got ${code}`,
      );
    }

    // Rule 1 and 2 are enforced in the route, which requires a lead owned by
    // the caller. Assert the query that gate depends on.
    const strangersLead = await Lead.findOne({
      _id: lead._id,
      customerUserId: stranger._id,
    }).exec();
    check("someone else's lead is not reachable as your own", strangersLead === null);

    const noLead = await Lead.findOne({
      customerUserId: stranger._id,
      artisanProfileId: profileId,
    }).exec();
    check("a customer with no lead has nothing to review", noLead === null);

    console.log("\n2. Rating aggregation\n");

    let rating = await recomputeRating(profileId);
    check("average from one 5-star review is 5.0", rating.average === 5, `got ${rating.average}`);
    check("count is 1", rating.count === 1, `got ${rating.count}`);

    // A second review through its own lead — the legitimate path.
    const secondLead = await Lead.create({
      artisanProfileId: profileId,
      artisanUserId,
      customerUserId: stranger._id,
      dedupeWindowStart: new Date(),
    });

    const second = await Review.create({
      leadId: secondLead._id,
      artisanProfileId: profileId,
      customerUserId: stranger._id,
      rating: 2,
      body: "Work was rushed and I had to call someone else to finish it.",
      status: "published",
    });

    rating = await recomputeRating(profileId);
    check("average of 5 and 2 is 3.5", rating.average === 3.5, `got ${rating.average}`);
    check("count is 2", rating.count === 2, `got ${rating.count}`);

    // Hiding must take effect immediately, or the visible list and the stored
    // average disagree — which is exactly what a moderator would not expect.
    await Review.updateOne({ _id: second._id }, { $set: { status: "hidden" } }).exec();
    rating = await recomputeRating(profileId);
    check("hiding the 2-star restores 5.0", rating.average === 5, `got ${rating.average}`);
    check("hidden review stops counting", rating.count === 1, `got ${rating.count}`);

    const stored = await ArtisanProfile.findById(profileId)
      .select("rating stats")
      .lean()
      .exec();
    check(
      "stored breakdown matches the published reviews",
      stored?.rating?.breakdown?.["5"] === 1 && stored?.rating?.breakdown?.["2"] === 0,
      JSON.stringify(stored?.rating?.breakdown),
    );
    check(
      "stats.reviewCount agrees with rating.count",
      stored?.stats?.reviewCount === stored?.rating?.count,
      `${stored?.stats?.reviewCount} vs ${stored?.rating?.count}`,
    );

    // Restoring puts it back — hiding is reversible, not a delete.
    await Review.updateOne({ _id: second._id }, { $set: { status: "published" } }).exec();
    rating = await recomputeRating(profileId);
    check("restoring brings it back to 3.5", rating.average === 3.5, `got ${rating.average}`);
  } finally {
    await Promise.all([
      Review.deleteMany({ artisanProfileId: profileId }),
      Lead.deleteMany({ artisanProfileId: profileId }),
      ArtisanProfile.deleteOne({ _id: profileId }),
      User.deleteMany({ _id: { $in: [customer._id, stranger._id] } }),
    ]);
    console.log("\n  ↩ cleaned up test fixtures");
  }

  console.log("\n" + "─".repeat(52));
  console.log(failures === 0 ? "\n✓ Review trust layer holds." : `\n✗ ${failures} failed.`);
  console.log("─".repeat(52));

  await disconnectDB();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

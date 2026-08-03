/**
 * Seed the directory with demo reviews.
 *
 * ⚠️ DEMO DATA. These are invented reviews by invented customers. Fine for a
 * development directory and a pitch demo; NOT fine on a live site, where
 * fabricated reviews presented as genuine are the thing review fraud laws
 * exist for. Purge before launch:
 *
 *   npm run seed:reviews -- --purge
 *
 * Reviewer accounts use the same @demo.fixam.local domain as the demo
 * professionals, so `npm run seed:demo -- --purge` already removes these too.
 *
 * This also repairs a real integrity problem. The demo profiles were seeded
 * with a hardcoded rating (4.9 from 15) and zero Review documents, so every
 * profile emitted AggregateRating markup with nothing behind it — exactly
 * what Google penalises. Ratings are now recomputed from the reviews that
 * actually exist.
 *
 *   npm run seed:reviews
 *   npm run seed:reviews -- --purge
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const DEMO_DOMAIN = "demo.fixam.local";

/** Deterministic PRNG so a re-run produces the same directory. */
function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const FIRST_NAMES = [
  "Chidi", "Amaka", "Tunde", "Ngozi", "Emeka", "Funke", "Ifeanyi", "Bisi",
  "Musa", "Kemi", "Obinna", "Zainab", "Segun", "Chioma", "Yusuf", "Adaeze",
  "Femi", "Halima", "Uche", "Tolu", "Nnamdi", "Aisha", "Bode", "Ijeoma",
  "Kunle", "Blessing", "Ibrahim", "Temitope", "Okey", "Fatima", "Dayo",
  "Nkechi", "Sadiq", "Yemi", "Chinelo", "Gbenga", "Hauwa", "Ekene", "Ronke",
  "Abubakar", "Simi", "Chuka", "Maryam", "Lanre", "Onyeka", "Damilola",
];

const LAST_NAMES = [
  "Okafor", "Adeyemi", "Bello", "Eze", "Balogun", "Nwosu", "Ibrahim", "Ogunleye",
  "Chukwu", "Danladi", "Adebayo", "Okonkwo", "Musa", "Afolabi", "Obi", "Sani",
  "Olawale", "Nwachukwu", "Yakubu", "Adesina", "Uche", "Lawal", "Mba", "Shehu",
  "Ojo", "Anyanwu", "Garba", "Akinyele", "Umeh", "Idowu", "Bala", "Ezenwa",
];

/**
 * What people actually mention, per trade. Generic praise ("great work!")
 * reads as fake precisely because it could be about anything — the detail is
 * what makes a review believable, so each trade gets its own.
 */
const SPECIFICS: Record<string, string[]> = {
  plumber: [
    "traced a leak we'd been chasing for weeks to a joint behind the wall",
    "replaced the pipes under the kitchen sink and cleaned up afterwards",
    "sorted out the pressure problem on our upstairs shower",
    "fixed two running toilets and changed the tap in the guest bathroom",
    "found the burst pipe under the slab without breaking up half the floor",
  ],
  electrician: [
    "rewired the sockets in the sitting room that kept tripping",
    "sorted out why half the house went off whenever we used the pumping machine",
    "installed the new distribution board and labelled everything properly",
    "traced the fault to a bad connection in the ceiling, not the meter like we thought",
    "fixed the earthing issue that was giving us shocks from the fridge",
  ],
  "ac-installation-repair": [
    "serviced three units and the one in the bedroom finally cools properly",
    "installed two split units and did the pipe work neatly",
    "found the gas leak instead of just topping it up like the last person",
    "moved the outdoor unit so it stopped disturbing our neighbour",
  ],
  carpenter: [
    "built fitted wardrobes for two bedrooms exactly to the measurements",
    "repaired the dining table leg and it's held up fine since",
    "made a TV console that matched the picture I sent over",
    "hung six doors and every one of them closes properly",
  ],
  "pop-ceiling": [
    "did the POP for the sitting room and dining in four days",
    "the ceiling lines are straight and the corners are clean",
    "redid a section another person had botched and matched it perfectly",
    "handled the lighting recesses exactly as we discussed",
  ],
  painter: [
    "painted the whole flat in three days with no marks on the floor",
    "the finish is even and the furniture was covered properly",
    "did two coats without me having to ask",
    "sorted out the damp patch first instead of just painting over it",
  ],
  "generator-repair": [
    "got our 5.5KVA running after two other people gave up on it",
    "changed the AVR and serviced it the same afternoon",
    "explained what was wrong instead of just charging for parts",
    "sorted out the starting problem and it's been fine since",
  ],
  tiler: [
    "tiled the bathroom and the grout lines are dead straight",
    "did the kitchen floor and cut the edges neatly around the cabinets",
    "laid the tiles I'd already bought without wasting a single box",
  ],
  "aluminium-fabricator": [
    "made and fitted the sliding windows for the whole flat",
    "the frames are square and nothing rattles",
    "did the shopfront exactly to the drawing",
  ],
  lawyer: [
    "handled our land documentation and explained each stage in plain terms",
    "reviewed the tenancy agreement and caught two clauses I'd have signed",
    "sorted the C of O paperwork that had been stuck for months",
  ],
  architect: [
    "produced the drawings for our three-bedroom and worked with our budget",
    "revised the plan twice without complaining when we changed our minds",
    "the approval went through first time with those drawings",
  ],
  "web-designer-developer": [
    "built our shop's website and it works properly on phones",
    "redesigned the site and it now loads fast on mobile data",
    "set everything up and showed me how to update the prices myself",
  ],
  "it-support-specialist": [
    "set up the network for our office and sorted the printers",
    "recovered files we thought were gone after the laptop crashed",
    "sorted our email properly so it stopped going to spam",
  ],
  "accountant-auditor": [
    "sorted out two years of books that were in a mess",
    "handled our filings and explained what we actually owed",
  ],
  "business-registration-cac": [
    "handled the CAC registration and it came through in under two weeks",
    "did the business name registration without me chasing once",
  ],
};

const DEFAULT_SPECIFICS = [
  "did exactly what we agreed and finished on the day promised",
  "turned up on time and got on with the job",
  "quoted on the phone and charged the same at the end",
  "handled the whole thing without me having to supervise",
];

const OPENERS = [
  "Very happy with the work.",
  "Would use again without thinking twice.",
  "Really solid job.",
  "Exactly what I was hoping for.",
  "No complaints at all.",
  "Glad I made the call.",
  "Proper professional.",
  "Better than I expected, honestly.",
  "Good experience from start to finish.",
  "Clearly knows the work.",
];

/**
 * Note the absence of pronouns throughout.
 *
 * The demo professionals have both male and female Nigerian names, and the
 * trade is assigned separately from the name — so any "he" written into a
 * template lands on a woman roughly half the time. Pronoun-free phrasing is
 * also how people actually write short reviews.
 */
const CLOSERS = [
  "Price was fair and nothing extra appeared at the end.",
  "Communication was good throughout — picked up every time I called.",
  "Cleaned up before leaving, which not everyone does.",
  "Already passed the number on to my brother.",
  "Will definitely call again.",
  "Charged exactly what was quoted on the phone.",
  "Turned up when promised, which is half the battle.",
  "Would happily recommend to anyone.",
  "No stress at all.",
];

const MIXED_OPENERS = [
  "Decent work, but a few things to note.",
  "The job itself was fine.",
  "Mostly good, with one issue.",
  "Got the job done in the end.",
];

const MIXED_CLOSERS = [
  "Only issue was timekeeping — late twice without calling ahead.",
  "Took longer than the two days quoted, but the work itself is fine.",
  "Had to call back once to get it finished off properly.",
  "Would have been five stars with better communication about the delay.",
  "Final price came in above the quote, though I did get an explanation.",
];

const POOR_BODIES = [
  "Started the job then disappeared for four days, phone switched off. Came back and finished eventually, but I had to chase constantly.",
  "The work was rushed and I've had to get someone else to redo part of it. Polite enough, but that doesn't fix the finish.",
  "Quoted one price on the phone then asked for considerably more once the work had started. I paid to get it finished, but I won't call again.",
];

const RESPONSES = [
  "Thank you, it was a pleasure. Call me any time.",
  "Thanks for the kind words. Glad we could sort it out for you.",
  "I appreciate this, thank you. Happy to help again whenever you need.",
  "Thank you. It was a straightforward job and you were easy to work with.",
  "Much appreciated. Give me a call if anything else comes up.",
];

const APOLOGETIC_RESPONSES = [
  "I'm sorry about the delay — I had an emergency on another site and I should have called you. Thank you for your patience.",
  "You're right about the timekeeping and I apologise. I've changed how I schedule jobs since then.",
  "Thank you for the honest feedback. I should have explained the extra cost before starting the extra work, and I've taken that on board.",
];

/**
 * Titles are picked from the set that matches the rating.
 *
 * Drawing from one pool put "Fast and clean" on a one-star review about
 * someone who vanished for four days — the single most obvious tell that a
 * review section was generated rather than written.
 */
const POSITIVE_TITLES = [
  "", "", "", // often blank — most people don't bother
  "Sorted it properly",
  "Fast and clean",
  "Would recommend",
  "Knows the job",
  "Turned up and did the job",
  "Fair price, good work",
];

const MIXED_TITLES = [
  "", "", "",
  "Good work, poor timekeeping",
  "Got there in the end",
  "Fine, with reservations",
];

const POOR_TITLES = [
  "", "",
  "Wouldn't use again",
  "Had to chase constantly",
  "Not what was quoted",
];

function titleFor(rand: () => number, rating: number) {
  if (rating <= 2) return pick(rand, POOR_TITLES);
  if (rating === 3) return pick(rand, MIXED_TITLES);
  return pick(rand, POSITIVE_TITLES);
}

function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length)]!;
}

/**
 * Star distribution.
 *
 * Weighted heavily positive because that is what real directories look like —
 * people who had an ordinary good experience mostly don't review, and those
 * who do are pleased. But NOT uniformly 5: a directory where every review is
 * five stars is the clearest possible signal that the reviews are fake.
 */
function pickRating(rand: () => number): number {
  const r = rand();
  if (r < 0.62) return 5;
  if (r < 0.85) return 4;
  if (r < 0.94) return 3;
  if (r < 0.98) return 2;
  return 1;
}

/** Specifics are stored as bare verb phrases, so they can open a sentence. */
function sentence(fragment: string) {
  return fragment.charAt(0).toUpperCase() + fragment.slice(1);
}

function buildBody(rand: () => number, rating: number, categorySlug: string) {
  const specifics = SPECIFICS[categorySlug] ?? DEFAULT_SPECIFICS;
  const did = () => sentence(pick(rand, specifics));

  if (rating <= 2) return pick(rand, POOR_BODIES);

  if (rating === 3) {
    return `${pick(rand, MIXED_OPENERS)} ${did()}. ${pick(rand, MIXED_CLOSERS)}`;
  }

  if (rating === 4) {
    return rand() < 0.5
      ? `${did()}. ${pick(rand, MIXED_CLOSERS)}`
      : `${pick(rand, OPENERS)} ${did()}.`;
  }

  // 5 stars — two or three sentences, varied shape.
  const shape = rand();
  if (shape < 0.35) {
    return `${pick(rand, OPENERS)} ${did()}. ${pick(rand, CLOSERS)}`;
  }
  if (shape < 0.7) {
    return `${did()}. ${pick(rand, CLOSERS)}`;
  }
  return `${pick(rand, OPENERS)} ${did()}.`;
}

async function main() {
  const args = process.argv.slice(2);
  const purge = args.includes("--purge");

  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed demo data in production.");
    process.exit(1);
  }

  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { ArtisanProfile, Lead, Review, User } = await import("../src/models");
  const { recomputeAllRatings } = await import("../src/lib/reviews/aggregate");

  await connectDB();

  // --- Purge ------------------------------------------------------------
  // Only touches reviews whose reviewer is a demo account, so a real review
  // left during testing survives.
  const reviewerFilter = { email: new RegExp(`^reviewer\\..*@${DEMO_DOMAIN}$`) };
  const existingReviewers = await User.find(reviewerFilter).select("_id").lean().exec();
  const reviewerIds = existingReviewers.map((u) => u._id);

  if (reviewerIds.length > 0) {
    const leads = await Lead.find({ customerUserId: { $in: reviewerIds } })
      .select("_id")
      .lean()
      .exec();

    await Promise.all([
      Review.deleteMany({ customerUserId: { $in: reviewerIds } }),
      Lead.deleteMany({ _id: { $in: leads.map((l) => l._id) } }),
      User.deleteMany({ _id: { $in: reviewerIds } }),
    ]);
    console.log(`  ✓ removed ${reviewerIds.length} demo reviewers and their reviews`);
  }

  if (purge) {
    await recomputeAllRatings();
    console.log("✓ purged — ratings recomputed to reflect what's left");
    await disconnectDB();
    return;
  }

  // --- Seed -------------------------------------------------------------
  const rand = makeRandom(20260803);

  const profiles = await ArtisanProfile.find({ status: "approved" })
    .select("_id userId trades")
    .lean()
    .exec();

  if (profiles.length === 0) {
    console.error("No approved profiles. Run `npm run seed:demo` first.");
    await disconnectDB();
    return;
  }

  const { Category } = await import("../src/models");
  const categories = await Category.find({ parentId: { $ne: null } })
    .select("_id slug")
    .lean()
    .exec();
  const slugById = new Map(categories.map((c) => [String(c._id), c.slug]));

  console.log(`→ creating reviewers…`);

  // One pool of reviewers shared across profiles, so the same customer name
  // can appear on two different professionals — which is what a real
  // marketplace looks like, and what a per-profile pool would never produce.
  const REVIEWER_COUNT = 90;
  const reviewers = [];
  for (let i = 0; i < REVIEWER_COUNT; i++) {
    const name = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`;
    reviewers.push({
      name,
      email: `reviewer.${i}@${DEMO_DOMAIN}`,
      passwordHash: null,
      isVerified: true,
      emailVerifiedAt: new Date(),
      roles: ["customer"],
      status: "active",
      authProviders: ["credentials"],
    });
  }
  const createdReviewers = await User.insertMany(reviewers);
  console.log(`  ✓ ${createdReviewers.length} reviewers`);

  console.log(`→ creating leads and reviews…`);

  const now = Date.now();
  const TEN_MONTHS = 300 * 24 * 60 * 60 * 1000;

  const leadDocs: Record<string, unknown>[] = [];
  const reviewDocs: Record<string, unknown>[] = [];

  for (const profile of profiles) {
    // Long tail: a handful of well-established names, most with a few
    // reviews, and some with none at all. A directory where every profile
    // has the same 15 reviews is the tell that broke the old seed data.
    const roll = rand();
    let target: number;
    if (roll < 0.12) target = 0;
    else if (roll < 0.5) target = 1 + Math.floor(rand() * 4);
    else if (roll < 0.85) target = 5 + Math.floor(rand() * 8);
    else target = 13 + Math.floor(rand() * 12);

    // Each professional gets their own quality bias, so averages spread
    // across the directory instead of everyone landing on 4.9.
    const bias = rand();

    const used = new Set<number>();

    for (let i = 0; i < target; i++) {
      let idx = Math.floor(rand() * createdReviewers.length);
      let guard = 0;
      while (used.has(idx) && guard++ < 20) {
        idx = Math.floor(rand() * createdReviewers.length);
      }
      if (used.has(idx)) continue;
      used.add(idx);

      const reviewer = createdReviewers[idx]!;

      let rating = pickRating(rand);
      // A weaker professional drops the occasional 5 to a 4 or 3.
      if (bias < 0.18 && rating === 5 && rand() < 0.55) rating = rand() < 0.5 ? 4 : 3;
      if (bias > 0.9 && rating <= 3 && rand() < 0.5) rating = 4;

      const trade = profile.trades?.[Math.floor(rand() * (profile.trades?.length || 1))];
      const categoryId = trade?.categoryId ?? null;
      const categorySlug = categoryId ? (slugById.get(String(categoryId)) ?? "") : "";

      // Skew dates towards recent: squaring a uniform puts more of the mass
      // near "now", so the directory reads as growing rather than as a
      // snapshot dumped in on one day.
      const age = Math.pow(rand(), 2) * TEN_MONTHS;
      const revealedAt = new Date(now - age);
      // Reviews land a few days after contact — nobody reviews the same hour.
      const reviewedAt = new Date(
        revealedAt.getTime() + (2 + rand() * 12) * 24 * 60 * 60 * 1000,
      );
      if (reviewedAt.getTime() > now) continue;

      const windowMs = 30 * 24 * 60 * 60 * 1000;
      const leadId = new (Review.base.Types.ObjectId)();

      leadDocs.push({
        _id: leadId,
        artisanProfileId: profile._id,
        artisanUserId: profile.userId,
        customerUserId: reviewer._id,
        categoryId,
        source: "profile",
        channel: rand() < 0.7 ? "whatsapp" : "phone",
        revealedAt,
        dedupeWindowStart: new Date(
          Math.floor(revealedAt.getTime() / windowMs) * windowMs,
        ),
        chargeable: false,
        creditCost: 0,
        billingStatus: "free",
        createdAt: revealedAt,
        updatedAt: revealedAt,
      });

      const body = buildBody(rand, rating, categorySlug);

      // A quarter of reviews get a reply, and poor ones get answered more
      // often than good ones — which is what an engaged professional does.
      const replyChance = rating <= 3 ? 0.55 : 0.22;
      const hasReply = rand() < replyChance;

      reviewDocs.push({
        leadId,
        artisanProfileId: profile._id,
        customerUserId: reviewer._id,
        rating,
        title: titleFor(rand, rating),
        body,
        jobCategoryId: categoryId,
        jobDate: revealedAt,
        status: "published",
        artisanResponse: hasReply
          ? {
              body: rating <= 3 ? pick(rand, APOLOGETIC_RESPONSES) : pick(rand, RESPONSES),
              respondedAt: new Date(
                reviewedAt.getTime() + (1 + rand() * 3) * 24 * 60 * 60 * 1000,
              ),
            }
          : { body: null, respondedAt: null },
        createdAt: reviewedAt,
        updatedAt: reviewedAt,
      });
    }
  }

  await Lead.insertMany(leadDocs);
  const createdReviews = await Review.insertMany(reviewDocs, { ordered: false });
  console.log(`  ✓ ${leadDocs.length} leads, ${createdReviews.length} reviews`);

  // Link leads back so /account/contacts shows them as reviewed.
  await Promise.all(
    createdReviews.map((r) =>
      Lead.updateOne({ _id: r.leadId }, { $set: { reviewId: r._id } }).exec(),
    ),
  );

  console.log(`→ recomputing ratings from actual reviews…`);
  const { checked, corrected } = await recomputeAllRatings();
  console.log(`  ✓ ${checked} profiles checked, ${corrected.length} updated`);

  const withReviews = await ArtisanProfile.countDocuments({ "rating.count": { $gt: 0 } });
  const spread = await ArtisanProfile.aggregate([
    { $match: { "rating.count": { $gt: 0 } } },
    {
      $group: {
        _id: null,
        min: { $min: "$rating.average" },
        max: { $max: "$rating.average" },
        avg: { $avg: "$rating.average" },
      },
    },
  ]).exec();

  console.log(`\nSummary`);
  console.log(`  profiles with reviews: ${withReviews} of ${profiles.length}`);
  if (spread[0]) {
    console.log(
      `  average rating: ${spread[0].avg.toFixed(2)} (spread ${spread[0].min.toFixed(1)}–${spread[0].max.toFixed(1)})`,
    );
  }
  console.log(`\n⚠️  Demo data. Remove before launch: npm run seed:reviews -- --purge`);

  await disconnectDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

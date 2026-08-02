/**
 * Seed the directory with demo artisans.
 *
 * ⚠️ DEMO DATA. These are invented people. The photographs are free-licence
 * Unsplash images of real strangers, which is fine for a development
 * directory and NOT fine on a live site: presenting a real person's face as
 * a named artisan with a phone number is misrepresentation. Run
 * `npm run seed:demo -- --purge` before launch.
 *
 *   npm run seed:demo -- --count 100
 *   npm run seed:demo -- --purge
 *
 * Every generated account uses the demo.fixam.local domain so purging can
 * find them precisely and can never touch a real signup.
 */

import { readFileSync } from "node:fs";

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

type Ids = { faces: string[]; work: Record<string, string[]> };

async function main() {
  const args = process.argv.slice(2);
  const purge = args.includes("--purge");
  const countIndex = args.indexOf("--count");
  const count = countIndex >= 0 ? Number(args[countIndex + 1]) || 100 : 100;

  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed demo data in production.");
    process.exit(1);
  }

  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { ArtisanProfile, Category, Lga, State, User } = await import("../src/models");
  const { reconcileCounts } = await import("../src/lib/artisan/counts");
  const { hashPassword } = await import("../src/lib/auth/password");
  const { toSlug } = await import("../src/lib/slug");
  const { TRADE_PROFILES, FIRST_NAMES_FEMALE, FIRST_NAMES_MALE, SURNAMES } =
    await import("./data/names");

  await connectDB();

  // ---- Purge -----------------------------------------------------------
  const demoUsers = await User.find({ email: new RegExp(`@${DEMO_DOMAIN}$`) })
    .select("_id")
    .lean()
    .exec();

  if (demoUsers.length > 0) {
    const ids = demoUsers.map((u) => u._id);
    const profiles = await ArtisanProfile.find({ userId: { $in: ids } })
      .select("_id")
      .lean()
      .exec();

    const { Lead, Review } = await import("../src/models");
    await Promise.all([
      Review.deleteMany({ artisanProfileId: { $in: profiles.map((p) => p._id) } }),
      Lead.deleteMany({ artisanProfileId: { $in: profiles.map((p) => p._id) } }),
      ArtisanProfile.deleteMany({ userId: { $in: ids } }),
      User.deleteMany({ _id: { $in: ids } }),
    ]);

    console.log(`Removed ${demoUsers.length} existing demo artisan(s).`);
  }

  if (purge) {
    await reconcileCounts();
    await disconnectDB();
    console.log("✓ purged");
    return;
  }

  // ---- Reference data --------------------------------------------------
  const ids = JSON.parse(
    readFileSync("scripts/data/unsplash-ids.json", "utf8"),
  ) as Ids;

  const tradeSlugs = Object.keys(TRADE_PROFILES);
  const categories = await Category.find({ slug: { $in: tradeSlugs } })
    .select("name slug")
    .lean()
    .exec();

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  // Concentrate in the launch cities — a directory spread evenly across all
  // 36 states would look plausible in aggregate and empty everywhere.
  const launchStates = await State.find({ isLaunchCity: true })
    .select("name slug")
    .lean()
    .exec();

  type LgaLite = {
    _id: import("mongoose").Types.ObjectId;
    name: string;
    popularAreas: string[];
  };
  const lgasByState = new Map<string, LgaLite[]>();
  for (const state of launchStates) {
    const lgas = await Lga.find({ stateId: state._id })
      .select("name popularAreas")
      .lean()
      .exec();
    // Prefer LGAs we have real neighbourhood names for.
    lgasByState.set(
      String(state._id),
      lgas.filter((l) => (l.popularAreas ?? []).length > 0) as LgaLite[],
    );
  }

  const random = makeRandom(20260802);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(random() * arr.length)]!;

  const passwordHash = await hashPassword("fixam-demo-9911");
  const usedSlugs = new Set<string>();
  const usedPhones = new Set<string>();

  console.log(`\nCreating ${count} demo artisans…`);

  let created = 0;

  for (let i = 0; i < count; i += 1) {
    // ~28% women — low, but honest for these trades in Nigeria, and the
    // directory shouldn't imply a balance that isn't there.
    const female = random() < 0.28;
    const first = female ? pick(FIRST_NAMES_FEMALE) : pick(FIRST_NAMES_MALE);
    const displayName = `${first} ${pick(SURNAMES)}`;

    // 1–3 trades. Multi-trade is the norm, not the exception.
    const tradeCount = random() < 0.45 ? 1 : random() < 0.8 ? 2 : 3;
    const trades: string[] = [];
    while (trades.length < tradeCount) {
      const slug = pick(tradeSlugs);
      if (!trades.includes(slug)) trades.push(slug);
    }

    const primary = TRADE_PROFILES[trades[0]!]!;
    const state = pick(launchStates);
    const stateLgas = lgasByState.get(String(state._id)) ?? [];
    if (stateLgas.length === 0) continue;

    const lga = pick(stateLgas);
    const area = pick(lga.popularAreas);

    // Unique slug and phone, checked in-process so a re-run can't collide.
    let slug = toSlug(`${displayName}-${primary.noun}-${area}`);
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${toSlug(displayName)}-${area ? toSlug(area) : "ng"}-${suffix++}`;
    usedSlugs.add(slug);

    let phone = "";
    do {
      const prefix = pick(["803", "806", "810", "813", "814", "816", "703", "706", "805", "807", "815", "802", "808", "812", "809", "817", "818", "901", "902", "903", "906", "913", "915", "916"]);
      phone = `+234${prefix}${Math.floor(random() * 9000000 + 1000000)}`;
    } while (usedPhones.has(phone));
    usedPhones.add(phone);

    const years = 2 + Math.floor(random() * 22);
    const jobs = primary.does.slice(0, 2 + Math.floor(random() * 2)).join(", ");

    const user = await User.create({
      name: displayName,
      email: `${toSlug(displayName)}.${i}@${DEMO_DOMAIN}`,
      passwordHash,
      roles: ["customer", "artisan"],
      authProviders: ["credentials"],
      emailVerified: new Date(),
    });

    // Ratings: most artisans are decent, a few are not. A directory where
    // everyone is 4.8 reads as fake.
    const reviewCount = Math.floor(random() * 24);
    const base = random();
    const average =
      reviewCount === 0
        ? 0
        : base < 0.08
          ? 2.5 + random() * 1.2
          : base < 0.35
            ? 3.7 + random() * 0.5
            : 4.2 + random() * 0.8;

    const workPool = ids.work[primary.group] ?? ids.work.building!;
    const photoCount = 2 + Math.floor(random() * 4);
    const photos: { publicId: string; url: string; caption: string; width: number; height: number; order: number }[] = [];

    for (let p = 0; p < photoCount; p += 1) {
      const photoId = workPool[(i * 3 + p) % workPool.length]!;
      photos.push({
        publicId: `unsplash/${photoId}`,
        url: `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=70`,
        caption: "",
        width: 1200,
        height: 900,
        order: p,
      });
    }

    // ~82% have a profile photo. Some real artisans won't upload one, and
    // the initials fallback should be exercised rather than hypothetical.
    const faceId = ids.faces[i % ids.faces.length]!;
    const hasAvatar = random() < 0.82;

    await ArtisanProfile.create({
      userId: user._id,
      slug,
      displayName,
      bio: `${primary.noun.charAt(0).toUpperCase()}${primary.noun.slice(1)} around ${area} and nearby areas for ${years} years. I handle ${jobs}. Neat work, clear pricing before we start.`,
      yearsExperience: years,
      trades: trades.map((t, index) => ({
        categoryId: categoryBySlug.get(t)!._id,
        isPrimary: index === 0,
      })),
      phone,
      whatsapp: phone,
      location: {
        stateId: state._id,
        lgaId: lga._id,
        areaText: area,
        landmark: "",
      },
      avatar: hasAvatar
        ? {
            publicId: `unsplash/${faceId}`,
            url: `https://images.unsplash.com/photo-${faceId}?auto=format&fit=facearea&facepad=2.8&w=512&h=512&q=75`,
            caption: "",
            width: 512,
            height: 512,
            order: 0,
          }
        : null,
      portfolio: photos,
      status: "approved",
      publishedAt: new Date(Date.now() - Math.floor(random() * 90) * 86400000),
      // ~22% verified. The badge should mean something.
      isVerified: random() < 0.22,
      verifiedAt: new Date(),
      rating: {
        average: Number(average.toFixed(1)),
        count: reviewCount,
        breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      stats: {
        profileViews: Math.floor(random() * 400),
        contactReveals: Math.floor(random() * 30),
        reviewCount,
      },
      availability: {
        acceptingJobs: random() < 0.88,
        respondsWithin: pick(["within_hour", "same_day", "same_day", "few_days"]),
      },
      searchKeywords: trades.map((t) => categoryBySlug.get(t)!.name),
    });

    created += 1;
    if (created % 20 === 0) console.log(`  ${created}/${count}`);
  }

  const report = await reconcileCounts();
  console.log(`\n✓ Created ${created} demo artisans.`);
  console.log(`✓ Realigned ${report.total} artisan counter(s).`);
  console.log(`\nAll use @${DEMO_DOMAIN} — remove with: npm run seed:demo -- --purge`);

  await disconnectDB();
}

main().catch((error) => {
  console.error("\n✗ seed failed:", error);
  process.exit(1);
});

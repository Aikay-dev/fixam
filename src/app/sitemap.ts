import type { MetadataRoute } from "next";

import { PUBLIC_ARTISAN_STATUS, ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { clientEnv } from "@/lib/env";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Category } from "@/models/category";
import { Lga, State } from "@/models/location";

/**
 * Dynamic sitemap.
 *
 * ⚠️ It only lists URLs that actually render. The /services/* pages 404 when
 * no approved professional matches, so the sitemap is built from the SAME
 * aggregation that decides whether those pages exist. Listing a URL that
 * 404s is worse than omitting it — it tells Google the site is full of dead
 * ends.
 */

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

// Revalidate hourly: new professionals get approved through the day, and a stale
// sitemap delays them being indexed.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}${ROUTES.directory}`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    await connectDB();

    // --- Professional profiles ------------------------------------------------
    const professionals = await ArtisanProfile.find({ status: PUBLIC_ARTISAN_STATUS })
      .select("slug updatedAt")
      .sort({ publishedAt: -1 })
      .limit(20000)
      .lean()
      .exec();

    const artisanPages: MetadataRoute.Sitemap = professionals.map((a) => ({
      url: `${SITE}${ROUTES.professional(a.slug)}`,
      lastModified: a.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // --- Category × location combinations that genuinely have professionals ----
    //
    // One aggregation produces every non-empty (trade, state, lga) triple.
    // Anything absent from these rows is a page that would 404, so it is
    // never emitted.
    const combos = await ArtisanProfile.aggregate([
      { $match: { status: PUBLIC_ARTISAN_STATUS } },
      { $unwind: "$trades" },
      {
        $group: {
          _id: {
            category: "$trades.categoryId",
            state: "$location.stateId",
            lga: "$location.lgaId",
          },
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const [categories, states, lgas] = await Promise.all([
      Category.find({ isActive: true, parentId: { $ne: null } })
        .select("slug")
        .lean()
        .exec(),
      State.find().select("slug").lean().exec(),
      Lga.find().select("slug").lean().exec(),
    ]);

    const categorySlug = new Map(categories.map((c) => [String(c._id), c.slug]));
    const stateSlug = new Map(states.map((s) => [String(s._id), s.slug]));
    const lgaSlug = new Map(lgas.map((l) => [String(l._id), l.slug]));

    // Deduplicate: many professionals roll up to the same URL.
    const servicePaths = new Set<string>();

    for (const row of combos) {
      const cat = categorySlug.get(String(row._id.category));
      if (!cat) continue;

      servicePaths.add(`/services/${cat}`);

      const st = row._id.state ? stateSlug.get(String(row._id.state)) : null;
      if (!st) continue;

      servicePaths.add(`/services/${cat}/${st}`);

      const lg = row._id.lga ? lgaSlug.get(String(row._id.lga)) : null;
      if (lg) servicePaths.add(`/services/${cat}/${st}/${lg}`);
    }

    const servicePages: MetadataRoute.Sitemap = [...servicePaths].map((path) => ({
      url: `${SITE}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      // Deeper pages are more specific and convert better, but there are far
      // more of them; keep the national pages slightly higher.
      priority: path.split("/").length > 4 ? 0.6 : 0.8,
    }));

    return [...staticPages, ...servicePages, ...artisanPages];
  } catch (error) {
    // A database blip must not produce an empty sitemap that tells Google to
    // drop everything. Fall back to the static pages, which always exist.
    console.error("[sitemap] failed to load dynamic entries", error);
    return staticPages;
  }
}

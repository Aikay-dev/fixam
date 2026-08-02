/**
 * Dev helper: attach demo photos to artisan profiles.
 *
 * Takes remote image URLs, pushes them through Cloudinary (so they are served
 * from the same optimised pipeline as real artisan uploads — `f_auto,q_auto`,
 * face-cropped avatars) and writes them onto the profiles.
 *
 * Deliberately goes via Cloudinary rather than storing the source URLs
 * directly: those are temporary signed links that expire, and next.config
 * only whitelists res.cloudinary.com. Storing them raw would give broken
 * images within a day.
 *
 * Usage:
 *   npm run dev:seed-images -- path/to/config.json
 *
 * Config shape:
 *   [
 *     { "slug": "emeka-...", "avatar": "https://...", "portfolio": ["https://...", ...] }
 *   ]
 */

import { readFileSync } from "node:fs";

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

type Entry = {
  slug: string;
  avatar?: string;
  portfolio?: string[];
  captions?: string[];
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed demo images in production.");
    process.exit(1);
  }

  const configPath = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (!configPath) {
    console.error("Usage: npm run dev:seed-images -- config.json");
    process.exit(1);
  }

  const entries = JSON.parse(readFileSync(configPath, "utf8")) as Entry[];

  const { connectDB, disconnectDB } = await import("../src/lib/db");
  const { cloudinary } = await import("../src/lib/cloudinary");
  const { ArtisanProfile } = await import("../src/models");
  const { features, env } = await import("../src/lib/env");

  if (!features.cloudinary) {
    console.error("Cloudinary is not configured — check .env.local");
    process.exit(1);
  }

  await connectDB();

  for (const entry of entries) {
    const profile = await ArtisanProfile.findOne({ slug: entry.slug }).exec();

    if (!profile) {
      console.log(`  ⚠ no profile for ${entry.slug} — skipping`);
      continue;
    }

    console.log(`\n${profile.displayName} (${entry.slug})`);

    // --- Avatar ---------------------------------------------------------
    if (entry.avatar) {
      const uploaded = await cloudinary.uploader.upload(entry.avatar, {
        folder: `${env.CLOUDINARY_UPLOAD_FOLDER}/avatars/${profile.userId}`,
        // Face-aware square crop, same transform the real upload path uses.
        transformation: [
          { width: 512, height: 512, crop: "fill", gravity: "face" },
          { quality: "auto:good", fetch_format: "auto" },
        ],
      });

      profile.avatar = {
        publicId: uploaded.public_id,
        url: uploaded.secure_url,
        caption: "",
        width: uploaded.width,
        height: uploaded.height,
        order: 0,
      };

      // Save immediately rather than once at the end: if a later portfolio
      // upload fails, a successful avatar shouldn't be thrown away with it.
      await profile.save();
      console.log(`  ✓ avatar     ${uploaded.public_id}`);
    }

    // --- Portfolio ------------------------------------------------------
    if (entry.portfolio?.length) {
      const photos: NonNullable<typeof profile.portfolio> = [] as never;

      for (const [index, url] of entry.portfolio.entries()) {
        try {
          const uploaded = await cloudinary.uploader.upload(url, {
            folder: `${env.CLOUDINARY_UPLOAD_FOLDER}/portfolio/${profile.userId}`,
            transformation: [
              { width: 1600, height: 1600, crop: "limit" },
              { quality: "auto:good", fetch_format: "auto" },
            ],
          });

          photos.push({
            publicId: uploaded.public_id,
            url: uploaded.secure_url,
            caption: entry.captions?.[index] ?? "",
            width: uploaded.width,
            height: uploaded.height,
            order: photos.length,
          } as never);

          console.log(`  ✓ portfolio  ${uploaded.public_id}`);
        } catch (error) {
          // Source URLs are often temporary signed links. One expiring
          // shouldn't discard the photos that did upload.
          const message =
            (error as { message?: string }).message ?? String(error);
          console.log(`  ⚠ portfolio  skipped — ${message.slice(0, 90)}`);
        }
      }

      if (photos.length > 0) {
        profile.portfolio = photos;
        await profile.save();
      }
    }
  }

  await disconnectDB();
  console.log("\n✓ done");
}

main().catch((error) => {
  console.error("\n✗ failed:", error);
  process.exit(1);
});

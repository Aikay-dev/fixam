import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 deprecated `images.domains` in favour of remotePatterns.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      // Demo seed data only — free-licence Unsplash photos standing in for
      // artisan portraits. Real artisan uploads always go through Cloudinary.
      // Safe to remove once the demo directory is purged before launch.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // Next 16 defaults qualities to [75] and REJECTS any other value rather
    // than silently coercing it, so every quality used anywhere must be
    // listed here. 50 for thumbnails, 70 for marketing tiles, 75 default,
    // 90 for the portfolio lightbox — finished work is the main reason
    // anyone trusts a profile, so that one gets the bytes.
    qualities: [50, 70, 75, 90],
    formats: ["image/avif", "image/webp"],
  },

  // Mongoose pulls in optional native deps it never uses in our config.
  serverExternalPackages: ["mongoose", "@napi-rs/snappy"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      {
        // The reveal endpoint returns a phone number. Make sure nothing —
        // CDN, browser, or intermediary — ever caches that response.
        source: "/api/artisans/:slug/reveal",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

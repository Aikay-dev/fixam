import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 deprecated `images.domains` in favour of remotePatterns.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
    ],
    // Next 16 defaults qualities to [75]. Artisan portfolio shots are the
    // main reason anyone trusts a profile, so allow a higher tier for those
    // and a lower one for directory thumbnails on slow connections.
    qualities: [50, 75, 90],
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

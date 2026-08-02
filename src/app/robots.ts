import type { MetadataRoute } from "next";

import { clientEnv } from "@/lib/env";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/**
 * robots.txt
 *
 * Public pages are open — the directory being crawlable is the entire
 * organic acquisition strategy. Everything behind a login is disallowed:
 * those pages carry personal data and phone numbers, and no crawler should
 * be requesting them even though they'd be redirected anyway.
 */
/** The only hosts allowed to be indexed. */
const PRODUCTION_HOSTS = ["fix-am.ng", "www.fix-am.ng"];

/**
 * Parse the host rather than substring-matching the URL — `SITE.includes()`
 * would also accept something like `fix-am.ng.example.com`.
 */
function isProductionHost(siteUrl: string): boolean {
  try {
    return PRODUCTION_HOSTS.includes(new URL(siteUrl).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export default function robots(): MetadataRoute.Robots {
  // Keep localhost and Vercel preview deploys out of the index entirely. A
  // staging copy ranking alongside the real site splits authority, and
  // preview URLs change constantly.
  if (!isProductionHost(SITE)) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/pro",
          "/pro/",
          "/account",
          "/account/",
          "/login",
          "/signup",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          // Filtered directory views are near-duplicates of pages that are
          // already indexed properly under /services/*.
          "/artisans?",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}

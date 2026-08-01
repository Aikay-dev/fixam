import Link from "next/link";

import { ROUTES, SITE } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/category";

/**
 * Footer doubles as an internal-linking surface for SEO: the most-populated
 * trades get a crawlable link from every page, which is how category landing
 * pages get discovered and ranked.
 */
async function getPopularCategories() {
  try {
    await connectDB();
    return await Category.find({ isActive: true, parentId: { $ne: null } })
      .select("name slug artisanCount")
      .sort({ artisanCount: -1, name: 1 })
      .limit(12)
      .lean()
      .exec();
  } catch {
    // The footer must never take the page down.
    return [];
  }
}

export async function SiteFooter() {
  const categories = await getPopularCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-primary text-lg font-bold">{SITE.name}</span>
            <p className="text-muted-foreground mt-1 text-sm italic">
              {SITE.tagline}
            </p>
            <p className="text-muted-foreground mt-3 text-sm">
              Nigeria&apos;s trusted artisan marketplace. Free for customers,
              free for artisans.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">For customers</h3>
            <ul className="text-muted-foreground mt-3 grid gap-2 text-sm">
              <li>
                <Link href={ROUTES.directory} className="hover:text-foreground">
                  Find an artisan
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-foreground">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">For artisans</h3>
            <ul className="text-muted-foreground mt-3 grid gap-2 text-sm">
              <li>
                <Link href={ROUTES.joinAsArtisan} className="hover:text-foreground">
                  List your services free
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-foreground">
                  Why join Fixam
                </Link>
              </li>
              <li>
                <Link href={ROUTES.login} className="hover:text-foreground">
                  Artisan sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Popular services</h3>
            <ul className="text-muted-foreground mt-3 grid gap-2 text-sm">
              {categories.length ? (
                categories.slice(0, 8).map((c) => (
                  <li key={String(c._id)}>
                    <Link
                      href={ROUTES.category(c.slug)}
                      className="hover:text-foreground"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Coming soon</li>
              )}
            </ul>
          </div>
        </div>

        <div className="text-muted-foreground mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs">
          <p>
            &copy; {year} {SITE.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/legal/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

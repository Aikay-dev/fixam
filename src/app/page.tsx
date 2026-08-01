import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

/**
 * Placeholder home page — replaced with the real directory landing page
 * in Phase 4. Kept minimal so Phase 0 has something verifiable to render.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-gold mb-3 text-sm font-semibold tracking-[0.2em] uppercase">
        Nigeria&apos;s Trusted Artisan Marketplace
      </p>

      <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
        {SITE.name}
      </h1>

      <p className="text-muted-foreground mt-4 text-lg italic">{SITE.tagline}</p>

      <p className="text-muted-foreground mt-8 max-w-md text-balance">
        {SITE.description}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/artisans">Find an artisan</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/signup?role=artisan">Join as an artisan</Link>
        </Button>
      </div>

      <p className="text-muted-foreground mt-16 text-xs">
        Stage One build in progress — free for customers and artisans.
      </p>
    </main>
  );
}

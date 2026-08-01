import Link from "next/link";

import { SITE } from "@/lib/constants";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-center px-6 py-8">
        <Link href="/" className="text-center">
          <span className="text-primary block text-2xl font-bold tracking-tight">
            {SITE.name}
          </span>
          <span className="text-muted-foreground block text-xs italic">
            {SITE.tagline}
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="text-muted-foreground px-6 pb-8 text-center text-xs">
        <Link href="/legal/terms" className="hover:text-foreground underline">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link href="/legal/privacy" className="hover:text-foreground underline">
          Privacy
        </Link>
      </footer>
    </div>
  );
}

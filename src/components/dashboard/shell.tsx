"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Small count badge, e.g. pending approvals. */
  badge?: number;
};

/**
 * Shared dashboard chrome for /pro, /account and /admin.
 *
 * Mobile-first: the sidebar is a slide-over below `lg`, because most artisans
 * will only ever open this on a phone.
 */
export function DashboardShell({
  nav,
  title,
  homeHref,
  children,
}: {
  nav: NavItem[];
  title: string;
  homeHref: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== homeHref && pathname.startsWith(`${href}/`));

  const navList = (
    <nav className="grid gap-1">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          )}
        >
          <span className="shrink-0">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.badge ? (
            <span className="bg-sidebar-primary text-sidebar-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar border-sidebar-border hidden w-64 shrink-0 flex-col border-r lg:flex">
        <div className="border-sidebar-border border-b px-5 py-5">
          <Link href="/" className="block" aria-label={`${SITE.name} home`}>
            <Logo onDark />
          </Link>
          <span className="text-sidebar-foreground/60 mt-1 block text-xs">
            {title}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{navList}</div>
      </aside>

      {/* Mobile slide-over */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside className="bg-sidebar absolute inset-y-0 left-0 flex w-72 flex-col">
            <div className="border-sidebar-border flex items-center justify-between border-b px-5 py-4">
              <div>
                <Logo onDark />
                <span className="text-sidebar-foreground/60 mt-1 block text-xs">
                  {title}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="text-sidebar-foreground"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">{navList}</div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
          <span className="font-semibold">{title}</span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

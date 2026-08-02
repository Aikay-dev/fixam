import { LayoutDashboard, LogIn, Search, UserRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/brand/logo";
import { getSessionUser } from "@/lib/auth/session";
import { ROUTES, SITE } from "@/lib/constants";

export async function SiteHeader() {
  const user = await getSessionUser();
  const isArtisan = user?.roles?.includes("artisan");
  const isAdmin = user?.roles?.includes("admin");

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label={`${SITE.name} home`}>
          <Logo />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.directory}>Find an artisan</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/how-it-works">How it works</Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="md:hidden">
            <Link href={ROUTES.directory} aria-label="Find an artisan">
              <Search className="size-4" />
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserRound className="size-4" />
                  <span className="hidden sm:inline">
                    {user.name?.split(" ")[0] ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {isArtisan ? (
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.pro}>
                      <LayoutDashboard className="size-4" />
                      Artisan dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.accountContacts}>My contacts</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.account}>Account</Link>
                </DropdownMenuItem>
                {isAdmin ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.admin}>Admin</Link>
                    </DropdownMenuItem>
                  </>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout">Sign out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={ROUTES.login}>
                  <LogIn className="size-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={ROUTES.joinAsArtisan}>
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">List your services</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

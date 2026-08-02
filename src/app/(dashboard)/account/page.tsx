import type { Metadata } from "next";
import { Phone, Search, Wrench } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/lead";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser(ROUTES.account);

  await connectDB();
  const contactCount = await Lead.countDocuments({ customerUserId: user.id });

  const isArtisan = user.roles?.includes("artisan");

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hi {user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-muted-foreground text-sm">{user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Phone className="size-4" />
              Professionals contacted
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {contactCount}
            </p>
            {contactCount > 0 ? (
              <Button asChild variant="link" className="mt-1 h-auto p-0">
                <Link href={ROUTES.accountContacts}>See them</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 pt-6">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Search className="size-4" />
              Need something done?
            </div>
            <Button asChild size="sm" className="justify-self-start">
              <Link href={ROUTES.directory}>Find a professional</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {!isArtisan ? (
        <Card className="border-primary/30">
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <Wrench className="text-primary size-5 shrink-0" />
            <p className="min-w-0 flex-1 text-sm">
              Do you work a trade yourself? List your services free — you can
              add as many trades as you do.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.listYourServices}>List free</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

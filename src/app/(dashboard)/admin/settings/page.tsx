import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allowedAdminEmails } from "@/lib/auth/admin-allowlist";
import { requireAdmin } from "@/lib/auth/session";
import { getPlatformConfig } from "@/models/platform-config";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
        ) : null}
      </div>
      <div className="shrink-0">{value}</div>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const user = await requireAdmin("/admin/settings");
  const config = await getPlatformConfig();

  const admins = allowedAdminEmails();
  const currentAdminEmail = user.email?.toLowerCase();

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Platform configuration.
        </p>
      </div>

      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4" />
            Monetisation
            <Badge variant="secondary">Stage Two</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Row
            label="Pay-per-lead credits"
            hint="Charging artisans to unlock a lead. Switched on only once the free platform has proven demand."
            value={
              <Badge variant={config.monetizationEnabled ? "default" : "outline"}>
                {config.monetizationEnabled ? "ON" : "OFF"}
              </Badge>
            }
          />
          <Row
            label="Default credit cost per lead"
            value={
              <span className="tabular-nums">{config.defaultLeadCreditCost}</span>
            }
          />

          <p className="text-muted-foreground bg-muted/50 rounded-md p-3 text-xs">
            Deliberately read-only in the UI. Turning this on affects what every
            artisan pays, so it is a deployment decision made in the database,
            not a toggle anyone can hit by accident. The switch itself lives in
            one function — <code>canRevealContact()</code> — and{" "}
            <code>npm run test:stage-two</code> proves nothing else reads it.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" />
            Admin access
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-muted-foreground text-sm">
            Only these addresses may hold admin access. A user needs{" "}
            <strong>both</strong> an entry here and the admin role on their
            account — losing either one removes access immediately.
          </p>

          <ul className="grid gap-1.5">
            {admins.map((email) => (
              <li
                key={email}
                className="bg-muted/50 flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm"
              >
                <span className="truncate font-mono text-xs">{email}</span>
                {email === currentAdminEmail ? (
                  <Badge variant="secondary">you</Badge>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground bg-muted/50 rounded-md p-3 text-xs">
            Edit the list in{" "}
            <code>src/lib/auth/admin-allowlist.ts</code>, then commit and
            deploy. It lives in code on purpose: adding an admin should be a
            reviewable change, not a silent database write. If the database
            were the only authority, anyone who obtained write access to it
            could grant themselves admin.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stage One controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Row
            label="Reveal limit per customer per day"
            hint="Anti-scrape ceiling on how many numbers one account can unlock."
            value={<span className="tabular-nums">{config.revealLimitPerDay}</span>}
          />
          <Row
            label="Email verification required to reveal"
            hint="What makes a lead worth anything to the artisan."
            value={
              <Badge
                variant={
                  config.requireEmailVerificationToReveal ? "default" : "outline"
                }
              >
                {config.requireEmailVerificationToReveal ? "ON" : "OFF"}
              </Badge>
            }
          />
          <Row
            label="Auto-publish artisans"
            hint="When off, every profile needs a human approval before going live."
            value={
              <Badge variant={config.autoPublishArtisans ? "destructive" : "default"}>
                {config.autoPublishArtisans ? "ON — no human gate" : "OFF"}
              </Badge>
            }
          />
          <Row
            label="Launch states"
            value={
              <span className="text-sm capitalize">
                {config.launchStates.join(", ") || "—"}
              </span>
            }
          />
          <Row label="Support email" value={<span className="text-sm">{config.supportEmail}</span>} />
        </CardContent>
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  await requireAdmin("/admin/settings");
  const config = await getPlatformConfig();

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

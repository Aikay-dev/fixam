import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  FileEdit,
  Ban,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE, type ArtisanStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The single most important thing on the professional dashboard: whether they are
 * actually visible to customers. A professional who thinks they're live but is
 * sitting in draft will quietly conclude Fixam doesn't work.
 */
export function ArtisanStatusBanner({
  status,
  rejectionReason,
  canSubmit,
  missingRequired,
}: {
  status: ArtisanStatus;
  rejectionReason?: string | null;
  canSubmit?: boolean;
  missingRequired?: string[];
}) {
  const config: Record<
    ArtisanStatus,
    {
      icon: React.ReactNode;
      title: string;
      body: string;
      className: string;
      action?: { label: string; href: string };
    }
  > = {
    draft: {
      icon: <FileEdit className="size-5" />,
      title: "Your profile isn't live yet",
      body: canSubmit
        ? "Everything required is filled in. Submit it for review and we'll check it within a day or two."
        : `Customers can't find you until this is submitted.${
            missingRequired?.length
              ? ` Still needed: ${missingRequired.join(", ")}.`
              : ""
          }`,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
      action: { label: "Finish my profile", href: "/pro/profile" },
    },
    pending_review: {
      icon: <Clock className="size-5" />,
      title: "Under review",
      body: "Our team is checking your profile. We'll email you as soon as it's approved — usually within a day or two.",
      className: "border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-100",
    },
    approved: {
      icon: <BadgeCheck className="size-5" />,
      title: "You're live",
      body: "Customers can find you in the directory and on Google. Keep your photos fresh — it's what they judge you on.",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    },
    rejected: {
      icon: <AlertTriangle className="size-5" />,
      title: "Changes needed",
      body: rejectionReason
        ? rejectionReason
        : "We couldn't approve your profile yet. Update it and submit again.",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      action: { label: "Update my profile", href: "/pro/profile" },
    },
    suspended: {
      icon: <Ban className="size-5" />,
      title: "Profile suspended",
      body: rejectionReason
        ? rejectionReason
        : `This profile has been suspended. Email ${SITE.supportEmail} if you think that's a mistake.`,
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  };

  const c = config[status];

  return (
    <div className={cn("flex flex-wrap items-start gap-3 rounded-lg border p-4", c.className)}>
      <span className="mt-0.5 shrink-0">{c.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{c.title}</p>
        <p className="mt-0.5 text-sm opacity-90">{c.body}</p>
      </div>
      {c.action ? (
        <Button asChild size="sm" variant="secondary" className="shrink-0">
          <Link href={c.action.href}>{c.action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

import type { Metadata } from "next";
import { ExternalLink, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ArtisanActions } from "@/components/admin/artisan-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { ARTISAN_STATUSES, ROUTES, type ArtisanStatus } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { formatPhoneForDisplay } from "@/lib/phone";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Category } from "@/models/category";
import { Lga, State } from "@/models/location";
import { User } from "@/models/user";

export const metadata: Metadata = {
  title: "Professionals",
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  suspended: "bg-destructive/15 text-destructive",
};

export default async function AdminArtisansPage(
  props: PageProps<"/admin/professionals">,
) {
  await requireAdmin("/admin/professionals");

  const sp = await props.searchParams;
  const statusParam = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  // Default to the queue that needs a human — that's why this page exists.
  // Typed explicitly: `includes` doesn't narrow a plain string for TS.
  const status: ArtisanStatus = ARTISAN_STATUSES.includes(
    statusParam as ArtisanStatus,
  )
    ? (statusParam as ArtisanStatus)
    : "pending_review";

  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);

  /**
   * Work photos are only rendered while a decision is outstanding.
   *
   * They're essential for judging a submission and pure weight afterwards:
   * at 50 profiles with six photos each this page was requesting 228 images
   * at once, which loads as a wall of grey boxes. Reviewing tabs get the
   * photos; browsing tabs get the avatar only.
   */
  const needsReview = status === "pending_review" || status === "rejected";
  const perPage = needsReview ? 12 : 24;

  await connectDB();

  const [profiles, total, counts] = await Promise.all([
    ArtisanProfile.find({ status })
      .sort({ submittedAt: 1, createdAt: 1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean()
      .exec(),
    ArtisanProfile.countDocuments({ status }),
    ArtisanProfile.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c: { _id: string; count: number }) => [c._id, c.count]),
  ) as Record<string, number>;

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Resolve the referenced names in one round trip each.
  const [owners, categories, states, lgas] = await Promise.all([
    User.find({ _id: { $in: profiles.map((p) => p.userId) } })
      .select("email name createdAt")
      .lean()
      .exec(),
    Category.find({
      _id: { $in: profiles.flatMap((p) => (p.trades ?? []).map((t) => t.categoryId)) },
    })
      .select("name")
      .lean()
      .exec(),
    State.find({
      _id: { $in: profiles.map((p) => p.location?.stateId).filter(Boolean) },
    })
      .select("name")
      .lean()
      .exec(),
    Lga.find({
      _id: { $in: profiles.map((p) => p.location?.lgaId).filter(Boolean) },
    })
      .select("name")
      .lean()
      .exec(),
  ]);

  const ownerById = new Map(owners.map((o) => [String(o._id), o]));
  const categoryById = new Map(categories.map((c) => [String(c._id), c.name]));
  const stateById = new Map(states.map((s) => [String(s._id), s.name]));
  const lgaById = new Map(lgas.map((l) => [String(l._id), l.name]));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Professionals</h1>
        <p className="text-muted-foreground text-sm">
          Nothing reaches the public directory or Google until it&apos;s
          approved here.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {ARTISAN_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/professionals?status=${s}`}
            className={`rounded-full border px-3 py-1.5 text-sm capitalize transition ${
              s === status
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {s.replace("_", " ")}
            <span className="ml-1.5 opacity-70">{countByStatus[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">
              {status === "pending_review"
                ? "Nothing waiting for review"
                : `No ${status.replace("_", " ")} profiles`}
            </p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm text-balance">
              {status === "pending_review"
                ? "The queue is clear. New submissions land here the moment a professional sends one in."
                : "Try another tab above."}
            </p>
            {/* An empty default tab shouldn't look like a broken page when
                there are plenty of professionals one tab across. */}
            {status === "pending_review" && (countByStatus.approved ?? 0) > 0 ? (
              <Button asChild variant="outline" className="mt-5">
                <Link href="/admin/professionals?status=approved">
                  See {countByStatus.approved} live professional
                  {countByStatus.approved === 1 ? "" : "s"}
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => {
            const owner = ownerById.get(String(profile.userId));
            const trades = (profile.trades ?? [])
              .map((t) => categoryById.get(String(t.categoryId)))
              .filter(Boolean);
            const location = [
              profile.location?.areaText,
              profile.location?.lgaId ? lgaById.get(String(profile.location.lgaId)) : null,
              profile.location?.stateId ? stateById.get(String(profile.location.stateId)) : null,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <Card key={String(profile._id)}>
                <CardContent className="grid gap-4 pt-6">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-full">
                      {profile.avatar?.url ? (
                        <Image
                          src={profile.avatar.url}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground flex size-full items-center justify-center text-xs">
                          no photo
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{profile.displayName}</h2>
                        <Badge
                          variant="secondary"
                          className={STATUS_STYLES[profile.status]}
                        >
                          {profile.status.replace("_", " ")}
                        </Badge>
                        {profile.isVerified ? (
                          <Badge className="bg-emerald-600">Verified</Badge>
                        ) : null}
                      </div>

                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {owner?.email}
                      </p>

                      <div className="text-muted-foreground mt-2 grid gap-0.5 text-sm">
                        {trades.length ? <span>{trades.join(" · ")}</span> : null}
                        {location ? <span>{location}</span> : null}
                        {/* Admins see the number: they need it to sanity-check
                            that the professional is reachable before approving. */}
                        {profile.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="size-3.5" />
                            {formatPhoneForDisplay(profile.phone)}
                          </span>
                        ) : (
                          <span className="text-destructive">
                            No phone number — cannot be approved
                          </span>
                        )}
                        <span>
                          {profile.portfolio?.length ?? 0} work photo
                          {(profile.portfolio?.length ?? 0) === 1 ? "" : "s"}
                          {profile.yearsExperience
                            ? ` · ${profile.yearsExperience} yrs experience`
                            : ""}
                        </span>
                      </div>
                    </div>

                    {profile.status === "approved" ? (
                      <Link
                        href={ROUTES.professional(profile.slug)}
                        target="_blank"
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                      >
                        View live
                        <ExternalLink className="size-3" />
                      </Link>
                    ) : null}
                  </div>

                  {profile.bio ? (
                    <p className="text-muted-foreground bg-muted/50 rounded-md p-3 text-sm">
                      {profile.bio}
                    </p>
                  ) : null}

                  {needsReview && profile.portfolio?.length ? (
                    <div className="flex gap-2 overflow-x-auto">
                      {profile.portfolio.slice(0, 6).map((photo, i) => (
                        <div
                          key={i}
                          className="bg-muted relative size-20 shrink-0 overflow-hidden rounded"
                        >
                          <Image
                            src={photo.url}
                            alt=""
                            fill
                            sizes="80px"
                            quality={50}
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : profile.portfolio?.length ? (
                    <p className="text-muted-foreground text-xs">
                      {profile.portfolio.length} work photo
                      {profile.portfolio.length === 1 ? "" : "s"} —{" "}
                      <Link
                        href={ROUTES.professional(profile.slug)}
                        target="_blank"
                        className="underline"
                      >
                        view on their profile
                      </Link>
                    </p>
                  ) : null}

                  {profile.rejectionReason ? (
                    <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
                      Last note: {profile.rejectionReason}
                    </p>
                  ) : null}

                  <ArtisanActions
                    id={String(profile._id)}
                    status={profile.status}
                    isVerified={Boolean(profile.isVerified)}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-center gap-3"
          aria-label="Pagination"
        >
          <Button
            asChild={page > 1}
            variant="outline"
            size="sm"
            disabled={page <= 1}
          >
            {page > 1 ? (
              <Link href={`/admin/professionals?status=${status}&page=${page - 1}`}>
                Previous
              </Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>

          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages} · {total} total
          </span>

          <Button
            asChild={page < totalPages}
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
          >
            {page < totalPages ? (
              <Link href={`/admin/professionals?status=${status}&page=${page + 1}`}>
                Next
              </Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

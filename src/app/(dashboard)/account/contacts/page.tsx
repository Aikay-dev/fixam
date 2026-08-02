import type { Metadata } from "next";
import { MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { RatingStars } from "@/components/artisans/rating-stars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { formatPhoneForDisplay, toTelLink, toWhatsAppLink } from "@/lib/phone";
import { Lead } from "@/models/lead";

export const metadata: Metadata = {
  title: "My contacts",
  robots: { index: false, follow: false },
};

/**
 * Professionals this customer has already unlocked.
 *
 * Showing the number here is correct: they already revealed it, a lead is
 * already recorded, and making them re-unlock it would burn their daily quota
 * for information they legitimately hold.
 */
async function getContacts(customerUserId: string) {
  await connectDB();

  return Lead.aggregate([
    { $match: { customerUserId: { $eq: (await import("mongoose")).Types.ObjectId.createFromHexString(customerUserId) } } },
    { $sort: { revealedAt: -1 } },
    { $limit: 50 },
    {
      $lookup: {
        from: "artisanprofiles",
        localField: "artisanProfileId",
        foreignField: "_id",
        as: "artisan",
      },
    },
    { $unwind: "$artisan" },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $project: {
        revealedAt: 1,
        reviewId: 1,
        categoryName: { $arrayElemAt: ["$category.name", 0] },
        slug: "$artisan.slug",
        displayName: "$artisan.displayName",
        phone: "$artisan.phone",
        whatsapp: "$artisan.whatsapp",
        areaText: "$artisan.location.areaText",
        rating: "$artisan.rating",
      },
    },
  ]).exec();
}

export default async function AccountContactsPage() {
  const user = await requireUser(ROUTES.accountContacts);
  const contacts = await getContacts(user.id);

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My contacts</h1>
        <p className="text-muted-foreground text-sm">
          Professionals whose numbers you&apos;ve unlocked.
        </p>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">Nothing here yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Professionals you contact will be saved here so you can find their
              number again.
            </p>
            <Button asChild className="mt-5">
              <Link href={ROUTES.directory}>Find a professional</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact) => {
            const phone = contact.phone as string | null;
            const whatsapp = (contact.whatsapp || contact.phone) as string | null;

            return (
              <Card key={String(contact._id)}>
                <CardContent className="grid gap-3 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={ROUTES.professional(contact.slug)}
                        className="hover:text-primary font-semibold"
                      >
                        {contact.displayName}
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        {[contact.categoryName, contact.areaText]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <div className="mt-1">
                        <RatingStars
                          value={contact.rating?.average ?? 0}
                          count={contact.rating?.count ?? 0}
                        />
                      </div>
                    </div>

                    <span className="text-muted-foreground shrink-0 text-xs">
                      {new Date(contact.revealedAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {phone ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold tabular-nums">
                        {formatPhoneForDisplay(phone)}
                      </span>
                      {whatsapp ? (
                        <Button
                          asChild
                          size="sm"
                          className="bg-[#25D366] hover:bg-[#20BD5A]"
                        >
                          <a
                            href={toWhatsAppLink(whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="size-3.5" />
                            WhatsApp
                          </a>
                        </Button>
                      ) : null}
                      <Button asChild size="sm" variant="outline">
                        <a href={toTelLink(phone)}>
                          <Phone className="size-3.5" />
                          Call
                        </a>
                      </Button>
                    </div>
                  ) : null}

                  {!contact.reviewId ? (
                    <p className="text-muted-foreground border-t pt-3 text-xs">
                      Job finished? You&apos;ll be able to leave a review
                      shortly — reviews here only come from customers who
                      actually made contact.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

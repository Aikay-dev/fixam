import { Link, Section, Text } from "@react-email/components";

import {
  brand,
  button,
  EmailLayout,
  infoPanel,
  text,
} from "@/emails/components/layout";

export type ArtisanNewReviewProps = {
  artisanName: string;
  reviewerFirstName: string;
  rating: number;
  body: string;
  reviewsUrl: string;
};

/**
 * A review landed.
 *
 * The star count and the review text are both included rather than teased.
 * A "you have a new review" email that makes someone log in to find out
 * whether it was good or bad is a small cruelty, and it trains people to
 * ignore the notification.
 */
export default function ArtisanNewReview({
  artisanName,
  reviewerFirstName,
  rating,
  body,
  reviewsUrl,
}: ArtisanNewReviewProps) {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const positive = rating >= 4;

  return (
    <EmailLayout
      preview={`${reviewerFirstName} left you a ${rating}-star review`}
    >
      <Text style={text.heading}>
        {positive ? "You got a good review" : "You have a new review"}
      </Text>

      <Text style={text.paragraph}>
        Hi {artisanName.split(" ")[0]}, {reviewerFirstName} reviewed you on
        Fixam.
      </Text>

      <Section style={infoPanel}>
        <Text
          style={{
            color: brand.gold,
            fontSize: "20px",
            letterSpacing: "2px",
            margin: "0 0 8px",
          }}
        >
          {stars}
        </Text>
        <Text style={{ ...text.paragraph, margin: 0 }}>
          &ldquo;{body}&rdquo;
        </Text>
      </Section>

      {positive ? (
        <Text style={text.small}>
          Reviews are the main reason someone picks one professional over
          another, so this one is working for you already.
        </Text>
      ) : (
        <Text style={text.small}>
          You can reply publicly. A calm, specific response to a poor review
          often reads better to the next customer than no criticism at all —
          it shows you answer when something goes wrong.
        </Text>
      )}

      <Section style={{ margin: "24px 0 8px" }}>
        <Link href={reviewsUrl} style={button.primary}>
          {positive ? "See the review" : "Reply to this review"}
        </Link>
      </Section>
    </EmailLayout>
  );
}

ArtisanNewReview.PreviewProps = {
  artisanName: "Emeka Okafor",
  reviewerFirstName: "Chidi",
  rating: 5,
  body: "Came the same day I called, fixed the leak under my kitchen sink and cleaned up after. Charged exactly what he quoted on the phone.",
  reviewsUrl: "https://fix-am.ng/pro/reviews",
} satisfies ArtisanNewReviewProps;

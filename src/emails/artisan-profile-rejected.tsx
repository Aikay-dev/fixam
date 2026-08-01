import { Button, Section, Text } from "@react-email/components";

import {
  EmailLayout,
  button,
  infoPanel,
  text,
} from "@/emails/components/layout";

export type ArtisanProfileRejectedProps = {
  name?: string;
  reason: string;
  editUrl: string;
};

/**
 * A rejection has to leave the artisan able to act.
 *
 * The specific reason and a direct link back to the editor are the whole
 * point — "rejected" with no explanation just loses the artisan.
 */
export default function ArtisanProfileRejected({
  name,
  reason,
  editUrl,
}: ArtisanProfileRejectedProps) {
  return (
    <EmailLayout preview="Your Fixam profile needs a small change before it goes live.">
      <Text style={text.heading}>Almost there — one change needed</Text>

      <Text style={text.paragraph}>
        {name ? `Hi ${name}, thanks` : "Thanks"} for submitting your profile.
        We can&apos;t approve it just yet.
      </Text>

      <Section style={infoPanel}>
        <Text style={{ ...text.small, margin: "0 0 6px", fontWeight: 600 }}>
          What needs changing
        </Text>
        <Text style={{ ...text.paragraph, margin: 0 }}>{reason}</Text>
      </Section>

      <Text style={text.paragraph}>
        Fix that and submit again — we usually re-check within a day.
      </Text>

      <Section style={{ margin: "24px 0" }}>
        <Button href={editUrl} style={button.primary}>
          Update my profile
        </Button>
      </Section>

      <Text style={text.small}>
        This isn&apos;t a rejection of you or your work. We check every profile
        so customers can trust the artisans they find here — and that same
        check is what makes your listing worth having.
      </Text>
    </EmailLayout>
  );
}

ArtisanProfileRejected.PreviewProps = {
  name: "Emeka",
  reason:
    "Your photos show finished work but we couldn't see a clear photo of you. Customers contact people, not logos — please add one.",
  editUrl: "https://fix-am.ng/pro/profile",
} satisfies ArtisanProfileRejectedProps;

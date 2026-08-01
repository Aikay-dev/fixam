import { Section, Text } from "@react-email/components";

import { EmailLayout, infoPanel, text } from "@/emails/components/layout";

export type ArtisanProfileSubmittedProps = {
  name?: string;
};

export default function ArtisanProfileSubmitted({
  name,
}: ArtisanProfileSubmittedProps) {
  return (
    <EmailLayout preview="We've got your profile — it's with our team for review.">
      <Text style={text.heading}>Profile submitted ✅</Text>

      <Text style={text.paragraph}>
        Thanks{name ? `, ${name}` : ""} — your profile is with our team now.
        We check every artisan before they go live.
      </Text>

      <Section style={infoPanel}>
        <Text style={{ ...text.small, margin: 0 }}>
          <strong>Why we review:</strong> it&apos;s what stops fake listings
          getting onto Fixam. Customers trust the artisans here because
          somebody actually looked — and that trust is what brings you work.
        </Text>
      </Section>

      <Text style={text.paragraph}>
        We&apos;ll email you as soon as it&apos;s approved, usually within a
        day or two. If anything needs changing, we&apos;ll tell you exactly
        what and give you a link straight back to it.
      </Text>

      <Text style={text.small}>
        Nothing to do in the meantime. Your profile isn&apos;t visible to
        customers yet.
      </Text>
    </EmailLayout>
  );
}

ArtisanProfileSubmitted.PreviewProps = {
  name: "Emeka",
} satisfies ArtisanProfileSubmittedProps;

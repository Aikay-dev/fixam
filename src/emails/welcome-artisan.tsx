import { Button, Section, Text } from "@react-email/components";

import {
  EmailLayout,
  button,
  infoPanel,
  text,
} from "@/emails/components/layout";

export type WelcomeArtisanProps = {
  name?: string;
  profileUrl: string;
};

export default function WelcomeArtisan({
  name,
  profileUrl,
}: WelcomeArtisanProps) {
  return (
    <EmailLayout preview="Set up your Fixam profile and start getting customers.">
      <Text style={text.heading}>
        Welcome to Fixam{name ? `, ${name}` : ""} 🛠️
      </Text>

      <Text style={text.paragraph}>
        Your account is verified. The next step is your profile — it&apos;s what
        customers see when they&apos;re deciding who to call.
      </Text>

      <Section style={infoPanel}>
        <Text style={{ ...text.small, margin: "0 0 8px", fontWeight: 600 }}>
          Profiles that get the most customers have:
        </Text>
        <Text style={{ ...text.small, margin: 0 }}>
          • A clear photo of you
          <br />• 4–6 photos of jobs you&apos;ve completed
          <br />• The areas you actually cover
          <br />• Every trade you do, not just the main one
        </Text>
      </Section>

      <Section style={{ margin: "24px 0" }}>
        <Button href={profileUrl} style={button.primary}>
          Complete my profile
        </Button>
      </Section>

      <Text style={text.paragraph}>
        Once you submit it, our team reviews it before it goes live. That review
        is what keeps fake listings off Fixam — and it&apos;s why customers
        trust the artisans they find here.
      </Text>

      <Text style={text.small}>
        <strong>Listing on Fixam is completely free.</strong> No joining fee, no
        commission, no charge when a customer contacts you.
      </Text>
    </EmailLayout>
  );
}

WelcomeArtisan.PreviewProps = {
  name: "Emeka",
  profileUrl: "https://fixam.ng/pro/profile",
} satisfies WelcomeArtisanProps;

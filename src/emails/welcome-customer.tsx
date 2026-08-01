import { Button, Section, Text } from "@react-email/components";

import { EmailLayout, button, text } from "@/emails/components/layout";

export type WelcomeCustomerProps = {
  name?: string;
  browseUrl: string;
};

export default function WelcomeCustomer({
  name,
  browseUrl,
}: WelcomeCustomerProps) {
  return (
    <EmailLayout preview="You're in. Start finding trusted artisans near you.">
      <Text style={text.heading}>You&apos;re in{name ? `, ${name}` : ""} 🎉</Text>

      <Text style={text.paragraph}>
        Your Fixam account is verified. You can now browse vetted artisans near
        you, read real reviews from other customers, and connect with anyone you
        pick — directly on WhatsApp.
      </Text>

      <Text style={text.paragraph}>
        <strong>It stays free for you. Always.</strong> We never charge
        customers to find or contact an artisan.
      </Text>

      <Section style={{ margin: "24px 0" }}>
        <Button href={browseUrl} style={button.primary}>
          Find an artisan
        </Button>
      </Section>

      <Text style={text.small}>
        A tip: check the ratings and the photos of past work before you decide.
        Artisans with a verification badge have had their details confirmed by
        our team.
      </Text>
    </EmailLayout>
  );
}

WelcomeCustomer.PreviewProps = {
  name: "Chidi",
  browseUrl: "https://fix-am.ng/artisans",
} satisfies WelcomeCustomerProps;

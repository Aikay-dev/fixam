import { Button, Section, Text } from "@react-email/components";

import {
  EmailLayout,
  button,
  infoPanel,
  text,
} from "@/emails/components/layout";

export type ArtisanProfileApprovedProps = {
  name?: string;
  profileUrl: string;
  dashboardUrl: string;
};

export default function ArtisanProfileApproved({
  name,
  profileUrl,
  dashboardUrl,
}: ArtisanProfileApprovedProps) {
  return (
    <EmailLayout preview="You're live on Fixam — customers can find you now.">
      <Text style={text.heading}>You&apos;re live 🎉</Text>

      <Text style={text.paragraph}>
        {name ? `${name}, your` : "Your"} profile has been approved. Customers
        searching for your trade in your area can find you from right now.
      </Text>

      <Section style={{ margin: "24px 0" }}>
        <Button href={profileUrl} style={button.primary}>
          See your public profile
        </Button>
      </Section>

      <Section style={infoPanel}>
        <Text style={{ ...text.small, margin: "0 0 8px", fontWeight: 600 }}>
          What happens next
        </Text>
        <Text style={{ ...text.small, margin: 0 }}>
          When a customer picks you, they&apos;ll unlock your number and
          we&apos;ll email you straight away. Reply fast — professionals who answer
          within the hour win far more jobs than those who reply the next day.
        </Text>
      </Section>

      <Text style={text.paragraph}>
        After a job, ask your customer to leave you a review on Fixam. Reviews
        are the single biggest thing that moves you up the list, and only real
        customers who took your number can leave one.
      </Text>

      <Text style={text.small}>
        Track everything from your{" "}
        <a href={dashboardUrl} style={{ color: "#14304F" }}>
          dashboard
        </a>
        . Listing stays free — no fee, no commission.
      </Text>
    </EmailLayout>
  );
}

ArtisanProfileApproved.PreviewProps = {
  name: "Emeka",
  profileUrl: "https://fix-am.ng/professionals/emeka-okafor-plumber-lekki-a4f2",
  dashboardUrl: "https://fix-am.ng/pro",
} satisfies ArtisanProfileApprovedProps;

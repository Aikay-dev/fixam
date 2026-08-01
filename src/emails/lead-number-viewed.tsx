import { Button, Section, Text } from "@react-email/components";

import {
  EmailLayout,
  button,
  infoPanel,
  text,
} from "@/emails/components/layout";

export type LeadNumberViewedProps = {
  artisanName: string;
  customerFirstName: string;
  categoryName: string;
  areaName?: string;
  leadsUrl: string;
};

/**
 * The most important email Fixam sends.
 *
 * It tells an artisan a real person chose them, and it quietly builds the
 * case for Stage Two: every one of these is a lead they received for free.
 */
export default function LeadNumberViewed({
  artisanName,
  customerFirstName,
  categoryName,
  areaName,
  leadsUrl,
}: LeadNumberViewedProps) {
  const where = areaName ? ` in ${areaName}` : "";

  return (
    <EmailLayout
      preview={`${customerFirstName} just took your number for ${categoryName}`}
    >
      <Text style={text.heading}>Someone wants to hire you 📞</Text>

      <Text style={text.paragraph}>
        Hi {artisanName.split(" ")[0]}, <strong>{customerFirstName}</strong>
        {where} just looked up your number on Fixam for{" "}
        <strong>{categoryName}</strong>.
      </Text>

      <Section style={infoPanel}>
        <Text style={{ ...text.paragraph, margin: 0, fontWeight: 600 }}>
          They may call or WhatsApp you shortly.
        </Text>
        <Text style={{ ...text.small, margin: "8px 0 0" }}>
          Artisans who reply within the hour win far more jobs than those who
          reply the next day. If you can&apos;t take it on, saying so quickly
          still helps your rating.
        </Text>
      </Section>

      <Section style={{ margin: "24px 0" }}>
        <Button href={leadsUrl} style={button.primary}>
          See all your leads
        </Button>
      </Section>

      <Text style={text.small}>
        This lead cost you nothing. Fixam is free for artisans — no joining
        fee, no commission, no charge per customer.
      </Text>
    </EmailLayout>
  );
}

LeadNumberViewed.PreviewProps = {
  artisanName: "Emeka Okafor",
  customerFirstName: "Chidi",
  categoryName: "Plumbing",
  areaName: "Lekki",
  leadsUrl: "https://fix-am.ng/pro/leads",
} satisfies LeadNumberViewedProps;

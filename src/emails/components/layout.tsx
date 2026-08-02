import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

import { clientEnv } from "@/lib/env";

/**
 * Shared shell for every Fixam email.
 *
 * Table-free, inline-styled, single column, ~600px — the combination that
 * survives Gmail on Android, which is where most of these get read.
 */

export const brand = {
  navy: "#14304F",
  navyDeep: "#0C1F35",
  gold: "#D08B2C",
  goldSoft: "#FBF3E4",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  bg: "#F4F6F8",
  white: "#FFFFFF",
  whatsapp: "#25D366",
} as const;

const styles = {
  body: {
    backgroundColor: brand.bg,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: brand.white,
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "600px",
    overflow: "hidden",
    width: "100%",
  },
  header: {
    backgroundColor: brand.navy,
    padding: "28px 32px",
  },
  /** Sized to the wordmark's cap height so the pair sits on one optical line. */
  markCell: { width: "54px", verticalAlign: "middle" as const },
  mark: { borderRadius: "9px", display: "block" },
  wordmark: {
    color: brand.white,
    fontSize: "26px",
    // Title case and tight tracking to match the web lockup. Email clients
    // fall back to system sans, so this won't be Archivo — but the shape of
    // the word should still read as the same brand.
    fontWeight: 800,
    letterSpacing: "-0.5px",
    margin: 0,
  },
  tagline: {
    color: brand.gold,
    fontSize: "12px",
    fontStyle: "italic",
    margin: "4px 0 0",
  },
  content: { padding: "32px" },
  footer: { padding: "0 32px 32px" },
  footerText: {
    color: brand.muted,
    fontSize: "12px",
    lineHeight: "18px",
    margin: "0 0 8px",
  },
  link: { color: brand.navy, textDecoration: "underline" },
} as const;

export type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
  /** Rendered above the legal footer — e.g. an unsubscribe hint. */
  footerNote?: string;
};

export function EmailLayout({
  preview,
  children,
  footerNote,
}: EmailLayoutProps) {
  const year = new Date().getFullYear();
  // Read from config rather than hardcoded, so the footer links follow the
  // site's actual domain in every environment.
  const site = clientEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Row>
              <Column style={styles.markCell}>
                <Img
                  src={`${site}/logo-mark.png`}
                  width="40"
                  height="40"
                  alt=""
                  style={styles.mark}
                />
              </Column>
              <Column>
                <Text style={styles.wordmark}>Fixam</Text>
                <Text style={styles.tagline}>Get am done. Fix am fast.</Text>
              </Column>
            </Row>
          </Section>

          <Section style={styles.content}>{children}</Section>

          <Hr style={{ borderColor: brand.border, margin: "0 32px" }} />

          <Section style={styles.footer}>
            {footerNote ? (
              <Text style={{ ...styles.footerText, paddingTop: "16px" }}>
                {footerNote}
              </Text>
            ) : null}
            <Text
              style={{
                ...styles.footerText,
                paddingTop: footerNote ? 0 : "16px",
              }}
            >
              Fixam — Nigeria&apos;s marketplace for trusted artisans and
              professionals. Free for customers, free to list.
            </Text>
            <Text style={styles.footerText}>
              &copy; {year} Fixam ·{" "}
              <Link href={`${site}/legal/privacy`} style={styles.link}>
                Privacy
              </Link>{" "}
              ·{" "}
              <Link href={`${site}/legal/terms`} style={styles.link}>
                Terms
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// --- Reusable pieces ------------------------------------------------------

export const text = {
  heading: {
    color: brand.navy,
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: "30px",
    margin: "0 0 16px",
  },
  paragraph: {
    color: brand.text,
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  },
  small: {
    color: brand.muted,
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 12px",
  },
} as const;

export const button = {
  primary: {
    backgroundColor: brand.gold,
    borderRadius: "8px",
    color: brand.navyDeep,
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "13px 26px",
    textDecoration: "none",
  },
  secondary: {
    backgroundColor: brand.navy,
    borderRadius: "8px",
    color: brand.white,
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "13px 26px",
    textDecoration: "none",
  },
} as const;

/** Large, spaced digits — the OTP is meant to be read off a lock screen. */
export const otpBox = {
  backgroundColor: brand.goldSoft,
  border: `1px solid ${brand.gold}33`,
  borderRadius: "10px",
  color: brand.navy,
  fontSize: "34px",
  fontWeight: 700,
  letterSpacing: "10px",
  margin: "0 0 20px",
  padding: "20px",
  textAlign: "center" as const,
};

export const infoPanel = {
  backgroundColor: brand.goldSoft,
  borderLeft: `3px solid ${brand.gold}`,
  borderRadius: "6px",
  margin: "0 0 20px",
  padding: "14px 18px",
};

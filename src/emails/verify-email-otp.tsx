import { Section, Text } from "@react-email/components";

import {
  EmailLayout,
  infoPanel,
  otpBox,
  text,
} from "@/emails/components/layout";

export type VerifyEmailOtpProps = {
  name?: string;
  code: string;
  expiresInMinutes: number;
};

export default function VerifyEmailOtp({
  name,
  code,
  expiresInMinutes,
}: VerifyEmailOtpProps) {
  return (
    <EmailLayout preview={`${code} is your Fixam verification code`}>
      <Text style={text.heading}>Confirm your email</Text>

      <Text style={text.paragraph}>
        {name ? `Hi ${name},` : "Hi there,"} welcome to Fixam. Enter this code
        to finish setting up your account:
      </Text>

      <Text style={otpBox}>{code}</Text>

      <Text style={text.small}>
        This code expires in {expiresInMinutes} minutes and can only be used
        once.
      </Text>

      <Section style={infoPanel}>
        <Text style={{ ...text.small, margin: 0 }}>
          If you didn&apos;t create a Fixam account, you can ignore this email —
          nothing will happen without the code.
        </Text>
      </Section>
    </EmailLayout>
  );
}

VerifyEmailOtp.PreviewProps = {
  name: "Chidi",
  code: "482915",
  expiresInMinutes: 15,
} satisfies VerifyEmailOtpProps;

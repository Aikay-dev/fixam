import { Section, Text } from "@react-email/components";

import {
  EmailLayout,
  infoPanel,
  otpBox,
  text,
} from "@/emails/components/layout";

export type PasswordResetProps = {
  name?: string;
  code: string;
  expiresInMinutes: number;
};

export default function PasswordReset({
  name,
  code,
  expiresInMinutes,
}: PasswordResetProps) {
  return (
    <EmailLayout preview={`${code} is your Fixam password reset code`}>
      <Text style={text.heading}>Reset your password</Text>

      <Text style={text.paragraph}>
        {name ? `Hi ${name},` : "Hi there,"} we got a request to reset your
        Fixam password. Use this code to set a new one:
      </Text>

      <Text style={otpBox}>{code}</Text>

      <Text style={text.small}>
        This code expires in {expiresInMinutes} minutes.
      </Text>

      <Section style={infoPanel}>
        <Text style={{ ...text.small, margin: 0 }}>
          <strong>Didn&apos;t ask for this?</strong> Ignore this email and your
          password stays exactly as it is. Nobody can change it without the code
          above.
        </Text>
      </Section>
    </EmailLayout>
  );
}

PasswordReset.PreviewProps = {
  name: "Chidi",
  code: "739204",
  expiresInMinutes: 15,
} satisfies PasswordResetProps;

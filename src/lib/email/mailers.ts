import ArtisanProfileSubmitted from "@/emails/artisan-profile-submitted";
import PasswordReset from "@/emails/password-reset";
import VerifyEmailOtp from "@/emails/verify-email-otp";
import WelcomeArtisan from "@/emails/welcome-artisan";
import WelcomeCustomer from "@/emails/welcome-customer";
import { OTP_TTL_MINUTES, ROUTES } from "@/lib/constants";
import { clientEnv } from "@/lib/env";
import { sendEmail, queueEmail } from "@/lib/email/send";

const site = clientEnv.NEXT_PUBLIC_SITE_URL;

const url = (path: string) => `${site}${path}`;

type Recipient = { userId: string; email: string; name?: string };

/**
 * Verification code. Awaited rather than queued — the signup screen tells the
 * user to check their inbox, so a send failure needs to surface immediately
 * rather than stranding them on a "check your email" page forever.
 */
export function sendVerificationEmail(user: Recipient, code: string) {
  return sendEmail({
    userId: user.userId,
    to: user.email,
    subject: `${code} is your Fixam verification code`,
    type: "verify-email-otp",
    react: VerifyEmailOtp({
      name: user.name,
      code,
      expiresInMinutes: OTP_TTL_MINUTES,
    }),
    payload: { expiresInMinutes: OTP_TTL_MINUTES },
  });
}

export function sendPasswordResetEmail(user: Recipient, code: string) {
  return sendEmail({
    userId: user.userId,
    to: user.email,
    subject: `${code} is your Fixam password reset code`,
    type: "password-reset",
    react: PasswordReset({
      name: user.name,
      code,
      expiresInMinutes: OTP_TTL_MINUTES,
    }),
    payload: { expiresInMinutes: OTP_TTL_MINUTES },
  });
}

/** Welcome mails are queued — they must never delay the verify redirect. */
export function sendWelcomeCustomerEmail(user: Recipient) {
  queueEmail({
    userId: user.userId,
    to: user.email,
    subject: "Welcome to Fixam — find a trusted artisan near you",
    type: "welcome-customer",
    react: WelcomeCustomer({
      name: user.name,
      browseUrl: url(ROUTES.directory),
    }),
  });
}

export function sendProfileSubmittedEmail(user: Recipient) {
  queueEmail({
    userId: user.userId,
    to: user.email,
    subject: "We've got your Fixam profile",
    type: "artisan-profile-submitted",
    react: ArtisanProfileSubmitted({ name: user.name }),
  });
}

export function sendWelcomeArtisanEmail(user: Recipient) {
  queueEmail({
    userId: user.userId,
    to: user.email,
    subject: "Welcome to Fixam — let's set up your profile",
    type: "welcome-artisan",
    react: WelcomeArtisan({
      name: user.name,
      profileUrl: url(ROUTES.proProfile),
    }),
  });
}

import type { NextRequest } from "next/server";

import { issueOtp } from "@/lib/auth/otp";
import { ok, parseBody, serverError, tooManyRequests } from "@/lib/api";
import { connectDB } from "@/lib/db";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email/mailers";
import { checkRateLimit } from "@/lib/rate-limit";
import { resendOtpSchema } from "@/lib/validation/auth";
import { User } from "@/models/user";

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, resendOtpSchema);
  if (!parsed.ok) return parsed.response;

  const { email, purpose } = parsed.data;

  const limit = await checkRateLimit("otp", email);
  if (!limit.allowed) {
    return tooManyRequests(
      "You've requested a few codes already. Wait a moment before trying again.",
      limit.resetAt,
    );
  }

  try {
    await connectDB();
    const user = await User.findOne({ email }).exec();

    // Always answer the same way. Telling an anonymous caller whether an email
    // is registered turns this endpoint into an account-enumeration oracle.
    if (!user || user.status === "suspended") {
      return ok({ ok: true });
    }

    // Nothing to verify if they're already verified.
    if (purpose === "verify_email" && user.emailVerified) {
      return ok({ ok: true });
    }

    const { code } = await issueOtp(String(user._id), user.email, purpose);

    const recipient = {
      userId: String(user._id),
      email: user.email,
      name: user.name || undefined,
    };

    if (purpose === "reset_password") {
      await sendPasswordResetEmail(recipient, code);
    } else {
      await sendVerificationEmail(recipient, code);
    }

    return ok({ ok: true });
  } catch (error) {
    console.error("[resend-otp] unexpected failure", error);
    return serverError();
  }
}

import type { NextRequest } from "next/server";

import { issueOtp } from "@/lib/auth/otp";
import { ok, parseBody, serverError, tooManyRequests } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/mailers";
import { checkRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { User } from "@/models/user";

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, forgotPasswordSchema);
  if (!parsed.ok) return parsed.response;

  const { email } = parsed.data;

  const limit = await checkRateLimit("otp", email);
  if (!limit.allowed) {
    return tooManyRequests(
      "Too many reset requests. Try again shortly.",
      limit.resetAt,
    );
  }

  try {
    await connectDB();
    const user = await User.findOne({ email }).select("+passwordHash").exec();

    // Uniform response regardless of whether the account exists — this
    // endpoint is unauthenticated and must not confirm who has an account.
    if (!user || user.status === "suspended") {
      return ok({ ok: true });
    }

    // A Google-only account has no password to reset. Issuing a code would
    // let them set one, which is fine — but only after they've proven control
    // of the mailbox, which the OTP does.
    const { code } = await issueOtp(
      String(user._id),
      user.email,
      "reset_password",
    );

    await sendPasswordResetEmail(
      {
        userId: String(user._id),
        email: user.email,
        name: user.name || undefined,
      },
      code,
    );

    return ok({ ok: true });
  } catch (error) {
    console.error("[forgot-password] unexpected failure", error);
    return serverError();
  }
}

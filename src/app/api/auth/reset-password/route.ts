import type { NextRequest } from "next/server";

import { verifyOtp } from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/password";
import { badRequest, ok, parseBody, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { OtpToken } from "@/models/otp-token";
import { User } from "@/models/user";

const FAILURE_MESSAGES: Record<string, string> = {
  not_found: "We couldn't find a reset code for that email. Request a new one.",
  expired: "That code has expired. Request a new one.",
  too_many_attempts: "Too many wrong attempts. Request a fresh code.",
  invalid: "That code isn't right. Check and try again.",
};

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, resetPasswordSchema);
  if (!parsed.ok) return parsed.response;

  const { email, code, password } = parsed.data;

  try {
    const result = await verifyOtp(email, code, "reset_password");

    if (!result.ok) {
      return badRequest(FAILURE_MESSAGES[result.reason] ?? "Reset failed.");
    }

    await connectDB();

    await User.updateOne(
      { _id: result.userId },
      {
        $set: {
          passwordHash: await hashPassword(password),
          // Proving control of the mailbox verifies it, so an unverified
          // account that resets its password comes out verified.
          emailVerified: new Date(),
        },
        $addToSet: { authProviders: "credentials" },
      },
    );

    // Burn every other outstanding code for this user. If an attacker had
    // also requested one, resetting the password must invalidate it.
    await OtpToken.updateMany(
      { userId: result.userId, consumedAt: null },
      { $set: { consumedAt: new Date() } },
    );

    return ok({ ok: true });
  } catch (error) {
    console.error("[reset-password] unexpected failure", error);
    return serverError();
  }
}

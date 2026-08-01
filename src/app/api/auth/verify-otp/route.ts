import type { NextRequest } from "next/server";

import { verifyOtp } from "@/lib/auth/otp";
import { badRequest, ok, parseBody, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import {
  sendWelcomeArtisanEmail,
  sendWelcomeCustomerEmail,
} from "@/lib/email/mailers";
import { verifyOtpSchema } from "@/lib/validation/auth";
import { User } from "@/models/user";

const FAILURE_MESSAGES: Record<string, string> = {
  not_found: "We couldn't find a code for that email. Request a new one.",
  expired: "That code has expired. Request a new one.",
  too_many_attempts: "Too many wrong attempts. Request a fresh code.",
  invalid: "That code isn't right. Check and try again.",
};

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, verifyOtpSchema);
  if (!parsed.ok) return parsed.response;

  const { email, code } = parsed.data;

  try {
    const result = await verifyOtp(email, code, "verify_email");

    if (!result.ok) {
      return badRequest(FAILURE_MESSAGES[result.reason] ?? "Verification failed.");
    }

    await connectDB();

    const user = await User.findById(result.userId).exec();
    if (!user) return badRequest("Account not found.");

    // Already verified — treat as success so a double-submit isn't an error,
    // but don't send the welcome email twice.
    const alreadyVerified = Boolean(user.emailVerified);

    if (!alreadyVerified) {
      await User.updateOne(
        { _id: user._id },
        { $set: { emailVerified: new Date() } },
      );

      const recipient = {
        userId: String(user._id),
        email: user.email,
        name: user.name || undefined,
      };

      if (user.roles.includes("artisan")) {
        sendWelcomeArtisanEmail(recipient);
      } else {
        sendWelcomeCustomerEmail(recipient);
      }
    }

    return ok({
      ok: true,
      isArtisan: user.roles.includes("artisan"),
    });
  } catch (error) {
    console.error("[verify-otp] unexpected failure", error);
    return serverError();
  }
}

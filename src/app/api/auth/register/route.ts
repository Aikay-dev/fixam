import type { NextRequest } from "next/server";

import { issueOtp } from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/password";
import {
  badRequest,
  created,
  getClientIp,
  parseBody,
  serverError,
  tooManyRequests,
} from "@/lib/api";
import type { Role } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email/mailers";
import { checkRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation/auth";
import { User } from "@/models/user";

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, registerSchema);
  if (!parsed.ok) return parsed.response;

  const { name, email, password, role, website } = parsed.data;

  // Honeypot: only a bot fills a field that is visually hidden.
  if (website) return created({ ok: true });

  const limit = await checkRateLimit("signup", getClientIp(request));
  if (!limit.allowed) {
    return tooManyRequests(
      "Too many sign-up attempts. Try again in a little while.",
      limit.resetAt,
    );
  }

  try {
    await connectDB();

    const existing = await User.findOne({ email }).select("+passwordHash").exec();

    if (existing) {
      // An account already exists. Two cases worth handling gracefully:
      if (!existing.passwordHash && existing.authProviders.includes("google")) {
        return badRequest(
          "You already signed up with Google. Use “Continue with Google” to sign in.",
        );
      }

      if (!existing.emailVerified) {
        // Unverified signup being retried — reissue the code rather than
        // stranding them with an account they can't get into.
        const { code } = await issueOtp(
          String(existing._id),
          existing.email,
          "verify_email",
        );
        await sendVerificationEmail(
          {
            userId: String(existing._id),
            email: existing.email,
            name: existing.name || undefined,
          },
          code,
        );
        return created({ ok: true, requiresVerification: true });
      }

      return badRequest(
        "An account with that email already exists. Try signing in instead.",
      );
    }

    // Artisans keep the customer role too — an electrician still needs a
    // plumber at home, and one account should cover both.
    const roles: Role[] =
      role === "artisan" ? ["customer", "artisan"] : ["customer"];

    const user = await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      roles,
      authProviders: ["credentials"],
      emailVerified: null,
    });

    const { code } = await issueOtp(String(user._id), user.email, "verify_email");

    const sent = await sendVerificationEmail(
      { userId: String(user._id), email: user.email, name: user.name },
      code,
    );

    if (!sent.ok) {
      // The account exists and the code is stored — they can hit "resend"
      // rather than being told to sign up again and hitting the duplicate path.
      console.error("[register] verification email failed", sent.error);
    }

    return created({ ok: true, requiresVerification: true });
  } catch (error) {
    // Unique index race: two concurrent signups with the same email.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return badRequest(
        "An account with that email already exists. Try signing in instead.",
      );
    }

    console.error("[register] unexpected failure", error);
    return serverError();
  }
}

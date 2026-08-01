import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { connectDB } from "@/lib/db";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MINUTES,
  type OtpPurpose,
} from "@/lib/constants";
import { OtpToken } from "@/models/otp-token";

/**
 * Numeric OTP, generated with a CSPRNG.
 *
 * Numeric-only is deliberate: these get typed on cheap Android keyboards,
 * often read aloud, and sometimes transcribed from a notification preview.
 */
function generateCode(): string {
  let code = "";
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

/**
 * SHA-256 rather than bcrypt: the codes are short-lived, single-use, rate
 * limited and attempt-capped, so the slow-hash tradeoff buys nothing while
 * costing latency on every verification.
 */
function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export type IssuedOtp = { code: string; expiresAt: Date };

/**
 * Issue a fresh code, invalidating any outstanding one for the same purpose
 * so a user who requests twice cannot leave a second valid code in the wild.
 */
export async function issueOtp(
  userId: string,
  email: string,
  purpose: OtpPurpose,
): Promise<IssuedOtp> {
  await connectDB();

  await OtpToken.updateMany(
    { userId, purpose, consumedAt: null },
    { $set: { consumedAt: new Date() } },
  );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OtpToken.create({
    userId,
    email: email.toLowerCase(),
    codeHash: hashCode(code),
    purpose,
    expiresAt,
  });

  return { code, expiresAt };
}

export type OtpResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "invalid" };

/**
 * Verify and consume a code. A successful verification burns the token, so a
 * replayed code fails even within its TTL.
 */
export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose,
): Promise<OtpResult> {
  await connectDB();

  const token = await OtpToken.findOne({
    email: email.toLowerCase(),
    purpose,
    consumedAt: null,
  })
    .sort({ createdAt: -1 })
    .exec();

  if (!token) return { ok: false, reason: "not_found" };

  if (token.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (token.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  if (!safeEqual(hashCode(code), token.codeHash)) {
    await OtpToken.updateOne({ _id: token._id }, { $inc: { attempts: 1 } });
    return { ok: false, reason: "invalid" };
  }

  await OtpToken.updateOne(
    { _id: token._id },
    { $set: { consumedAt: new Date() } },
  );

  return { ok: true, userId: String(token.userId) };
}

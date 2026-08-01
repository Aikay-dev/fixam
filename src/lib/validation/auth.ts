import { z } from "zod";

import { OTP_LENGTH } from "@/lib/constants";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .email("That email doesn't look right.");

/**
 * Length over composition rules. Forcing symbols on people typing into a
 * phone keyboard produces "Password1!" and a sticky note, not security.
 */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "That password is too long.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your name.")
  .max(80, "That name is too long.");

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code.`);

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["customer", "artisan"]).default("customer"),
  /**
   * Hidden field. Real users leave it empty; naive bots fill everything.
   * Cheap, invisible, and costs no third-party request.
   */
  website: z.string().max(0, "Rejected.").optional(),
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
});

export const resendOtpSchema = z.object({
  email: emailSchema,
  purpose: z.enum(["verify_email", "reset_password"]).default("verify_email"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

// `role` has a default, so the pre-parse shape has it optional and the
// post-parse shape has it required. react-hook-form needs both.
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterOutput = z.output<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

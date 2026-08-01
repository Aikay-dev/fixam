import { z } from "zod";

/**
 * Server-side environment. Validated once, at first import.
 *
 * Anything read here is server-only — never import this module from a
 * Client Component or the secrets end up in the browser bundle.
 */
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: z.string().default("fixam"),

  // Auth.js
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Fixam <noreply@fixam.ng>"),
  EMAIL_REPLY_TO: z.string().optional(),
  ADMIN_NOTIFY_EMAIL: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default("fixam"),

  // Cron endpoints (review prompts, weekly digest)
  CRON_SECRET: z.string().optional(),

  // Hashing salt for IP/user-agent fingerprints stored on leads.
  // Distinct from AUTH_SECRET so rotating one does not invalidate the other.
  FINGERPRINT_SALT: z.string().default("fixam-dev-fingerprint-salt"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
});

function formatIssues(error: z.ZodError) {
  return error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

function loadServerEnv() {
  // During `next build` the bundler traverses server modules even for routes
  // that are never prerendered. Failing hard there would make CI unbuildable
  // without production secrets, so we only throw at real request time.
  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = `Invalid server environment:\n${formatIssues(parsed.error)}`;
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(`[env] ${message}`);
      return process.env as unknown as z.infer<typeof serverSchema>;
    }
    throw new Error(message);
  }

  return parsed.data;
}

export const env = loadServerEnv();

const parsedClient = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
});

export const clientEnv = parsedClient.success
  ? parsedClient.data
  : { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" };

/** Feature availability derived from which credentials are actually present. */
export const features = {
  google: Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  email: Boolean(env.RESEND_API_KEY),
  cloudinary: Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  ),
} as const;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";

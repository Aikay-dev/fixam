import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";

/** Shared response shapes so every client handles errors the same way. */

export type ApiError = {
  error: string;
  /** Machine-readable discriminator the UI switches on. */
  reason?: string;
  details?: unknown;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function fail(
  status: number,
  error: string,
  reason?: string,
  details?: unknown,
) {
  const body: ApiError = { error };
  if (reason) body.reason = reason;
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export const badRequest = (error: string, details?: unknown) =>
  fail(400, error, "bad_request", details);

export const unauthorized = (error = "You need to sign in.") =>
  fail(401, error, "unauthenticated");

export const forbidden = (error = "You can't do that.", reason = "forbidden") =>
  fail(403, error, reason);

export const notFound = (error = "Not found.") => fail(404, error, "not_found");

export const tooManyRequests = (error: string, resetAt?: Date) =>
  NextResponse.json(
    { error, reason: "rate_limited", resetAt: resetAt?.toISOString() } as ApiError & {
      resetAt?: string;
    },
    {
      status: 429,
      headers: resetAt
        ? {
            "Retry-After": String(
              Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
            ),
          }
        : undefined,
    },
  );

export const serverError = (error = "Something went wrong on our end.") =>
  fail(500, error, "server_error");

// --- Body parsing ---------------------------------------------------------

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Parse and validate a JSON body. Returns a ready-to-return 400 with
 * field-level messages instead of throwing.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<ParseResult<z.infer<T>>> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: badRequest("Expected a JSON body.") };
  }

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "_";
      fieldErrors[path] ??= issue.message;
    }
    return {
      ok: false,
      response: badRequest("Please check the highlighted fields.", fieldErrors),
    };
  }

  return { ok: true, data: parsed.data };
}

// --- Request fingerprinting ----------------------------------------------

/**
 * Best-effort client IP. Vercel sets x-forwarded-for; the first entry is the
 * original client. Never trusted for authorization — only for rate limiting
 * and fraud signals on lead records.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/**
 * Salted hash of an identifying value.
 *
 * Lead records keep a fingerprint for abuse detection, but storing raw IPs
 * against a named customer is personal data we have no reason to hold.
 */
export function fingerprint(value: string): string {
  return createHash("sha256")
    .update(`${env.FINGERPRINT_SALT}:${value}`)
    .digest("hex")
    .slice(0, 32);
}

// --- Cron auth ------------------------------------------------------------

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. */
export function isAuthorizedCron(request: Request): boolean {
  if (!env.CRON_SECRET) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${env.CRON_SECRET}`;
}

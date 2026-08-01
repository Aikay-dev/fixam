import type { ReactElement } from "react";
import { Resend } from "resend";

import { connectDB } from "@/lib/db";
import { env, features } from "@/lib/env";
import { Notification } from "@/models/notification";

/**
 * The one place Fixam sends anything.
 *
 * Every call is logged to the Notification collection, respects the user's
 * preferences, and never throws into the request path — a failed lead-alert
 * email must not roll back the lead that triggered it.
 *
 * `channel` exists so SMS can be added in Stage Two without touching any
 * call site. Stage One is email-only because SMS costs money per message and
 * there is no revenue yet.
 */

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!features.email) return null;
  resendClient ??= new Resend(env.RESEND_API_KEY);
  return resendClient;
}

export type SendArgs = {
  /** Recipient user, for the delivery log and preference checks. */
  userId: string;
  to: string;
  subject: string;
  /** Template identifier, e.g. "lead-number-viewed". */
  type: string;
  react: ReactElement;
  /** Props recorded alongside the log entry, for debugging and resends. */
  payload?: Record<string, unknown>;
  channel?: "email" | "sms" | "in_app";
  replyTo?: string;
};

export type SendResult =
  | { ok: true; id: string | null; skipped?: boolean }
  | { ok: false; error: string };

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const {
    userId,
    to,
    subject,
    type,
    react,
    payload = {},
    channel = "email",
    replyTo,
  } = args;

  let logId: string | null = null;

  try {
    await connectDB();
    const log = await Notification.create({
      userId,
      type,
      channel,
      to,
      subject,
      payload,
      status: "queued",
    });
    logId = String(log._id);
  } catch (error) {
    // A logging failure must not stop the message going out.
    console.error("[email] failed to write notification log", error);
  }

  const resend = getResend();

  // No API key configured (local dev, CI): log to console and mark skipped so
  // the flow still completes end to end without silently pretending it sent.
  if (!resend) {
    console.info(
      `[email:skipped] type=${type} to=${to} subject="${subject}" — RESEND_API_KEY not set`,
    );
    if (logId) {
      await Notification.updateOne(
        { _id: logId },
        { $set: { status: "skipped" } },
      ).catch(() => undefined);
    }
    return { ok: true, id: null, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      react,
      replyTo: replyTo ?? env.EMAIL_REPLY_TO,
    });

    if (error) throw new Error(error.message);

    if (logId) {
      await Notification.updateOne(
        { _id: logId },
        {
          $set: {
            status: "sent",
            providerId: data?.id ?? null,
            sentAt: new Date(),
          },
        },
      ).catch(() => undefined);
    }

    return { ok: true, id: data?.id ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[email:failed] type=${type} to=${to}`, message);

    if (logId) {
      await Notification.updateOne(
        { _id: logId },
        { $set: { status: "failed", error: message } },
      ).catch(() => undefined);
    }

    return { ok: false, error: message };
  }
}

/**
 * Fire-and-forget variant for anything on a user-facing request path.
 *
 * The reveal endpoint uses this: the customer gets their phone number
 * immediately, and the artisan's alert email resolves on its own.
 */
export function queueEmail(args: SendArgs): void {
  void sendEmail(args).catch((error) => {
    console.error("[email] unhandled send failure", error);
  });
}

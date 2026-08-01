import "server-only";

import { fingerprint, getClientIp } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/moderation";

/**
 * Every admin mutation is recorded.
 *
 * Approvals, rejections, suspensions and config changes all affect real
 * people's income, so each one records who did it, what changed, and when.
 * Without this, "why is my profile suspended?" has no answer.
 */

export type AuditAction =
  | "artisan.approve"
  | "artisan.reject"
  | "artisan.verify"
  | "artisan.unverify"
  | "artisan.suspend"
  | "artisan.unsuspend"
  | "artisan.feature"
  | "user.suspend"
  | "user.unsuspend"
  | "user.role_change"
  | "review.hide"
  | "review.publish"
  | "report.resolve"
  | "category.update"
  | "location.update"
  | "config.update";

export async function recordAudit(args: {
  adminUserId: string;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  note?: string;
  request?: Request;
}): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      adminUserId: args.adminUserId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId ?? null,
      before: args.before ?? null,
      after: args.after ?? null,
      note: args.note ?? "",
      ipHash: args.request ? fingerprint(getClientIp(args.request)) : null,
    });
  } catch (error) {
    // Never let an audit-write failure roll back the action it describes —
    // a missing log line is bad, a half-applied moderation decision is worse.
    console.error("[audit] failed to record", args.action, error);
  }
}

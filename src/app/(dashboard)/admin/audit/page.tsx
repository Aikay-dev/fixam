import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { PAGE_SIZE } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/moderation";
import { User } from "@/models/user";

export const metadata: Metadata = {
  title: "Audit log",
  robots: { index: false, follow: false },
};

export default async function AdminAuditPage() {
  await requireAdmin("/admin/audit");

  await connectDB();

  const entries = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE.adminTable)
    .lean()
    .exec();

  const admins = await User.find({
    _id: { $in: entries.map((e) => e.adminUserId) },
  })
    .select("name email")
    .lean()
    .exec();

  const adminById = new Map(admins.map((a) => [String(a._id), a]));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground text-sm">
          Every moderation decision, and who made it.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">No entries yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Approvals, rejections and suspensions are recorded here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {entries.map((entry) => {
            const admin = adminById.get(String(entry.adminUserId));
            return (
              <Card key={String(entry._id)}>
                <CardContent className="flex flex-wrap items-start gap-3 py-4">
                  <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                    {entry.action}
                  </Badge>

                  <div className="min-w-0 flex-1 text-sm">
                    <p>
                      <span className="font-medium">
                        {admin?.name || admin?.email || "Unknown admin"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        on {entry.targetType}
                      </span>
                    </p>
                    {entry.note ? (
                      <p className="text-muted-foreground mt-1 italic">
                        “{entry.note}”
                      </p>
                    ) : null}
                  </div>

                  <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

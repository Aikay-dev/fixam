import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { PAGE_SIZE } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/moderation";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  await requireAdmin("/admin/reports");

  await connectDB();

  const reports = await Report.find({ status: { $in: ["open", "reviewing"] } })
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE.adminTable)
    .lean()
    .exec();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm">
          Abuse reports on profiles and reviews.
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">Nothing reported</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Open reports appear here. One report per person per target, so
              brigading can&apos;t flood the queue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {reports.map((report) => (
            <Card key={String(report._id)}>
              <CardContent className="flex flex-wrap items-start gap-3 py-4">
                <Badge variant="destructive" className="shrink-0">
                  {report.reason.replace(/_/g, " ")}
                </Badge>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="text-muted-foreground">
                    on {report.targetType}
                  </p>
                  {report.notes ? <p className="mt-1">{report.notes}</p> : null}
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {new Date(report.createdAt).toLocaleDateString("en-NG")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

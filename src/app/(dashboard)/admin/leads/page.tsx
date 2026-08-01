import type { Metadata } from "next";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { PAGE_SIZE } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/lead";

export const metadata: Metadata = {
  title: "Leads",
  robots: { index: false, follow: false },
};

async function getLeads() {
  await connectDB();

  return Lead.aggregate([
    { $sort: { revealedAt: -1 } },
    { $limit: PAGE_SIZE.adminTable },
    {
      $lookup: {
        from: "artisanprofiles",
        localField: "artisanProfileId",
        foreignField: "_id",
        as: "artisan",
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "customerUserId",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $project: {
        revealedAt: 1,
        source: 1,
        channel: 1,
        billingStatus: 1,
        artisanName: { $arrayElemAt: ["$artisan.displayName", 0] },
        categoryName: { $arrayElemAt: ["$category.name", 0] },
        customerName: { $arrayElemAt: ["$customer.name", 0] },
      },
    },
  ]).exec();
}

export default async function AdminLeadsPage() {
  await requireAdmin("/admin/leads");
  const leads = await getLeads();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm">
            Every time a customer took an artisan&apos;s number.
          </p>
        </div>

        <Button asChild variant="outline">
          <a href="/api/admin/leads/export" download>
            <Download className="size-4" />
            Export CSV
          </a>
        </Button>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">No leads yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Leads appear here the moment a customer unlocks an artisan&apos;s
              number.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Artisan</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Via</TableHead>
                  <TableHead>Billing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={String(lead._id)}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(lead.revealedAt).toLocaleString("en-NG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {lead.artisanName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {lead.categoryName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {lead.customerName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">
                      {lead.channel}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          lead.billingStatus === "free"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : ""
                        }
                      >
                        {lead.billingStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-xs">
        Every lead is currently free to the artisan. This log is the demand
        evidence for Stage One and becomes the billing ledger in Stage Two —
        no migration needed.
      </p>
    </div>
  );
}

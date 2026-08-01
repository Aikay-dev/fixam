import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
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
import { connectDB } from "@/lib/db";
import { Lga, State } from "@/models/location";

export const metadata: Metadata = {
  title: "Locations",
  robots: { index: false, follow: false },
};

export default async function AdminLocationsPage() {
  await requireAdmin("/admin/locations");

  await connectDB();

  const [states, lgaCount] = await Promise.all([
    State.find()
      .select("name code isLaunchCity isActive artisanCount")
      .sort({ isLaunchCity: -1, name: 1 })
      .lean()
      .exec(),
    Lga.countDocuments(),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
        <p className="text-muted-foreground text-sm">
          {states.length} states and {lgaCount} LGAs. Artisans can register
          anywhere; launch cities are what gets promoted.
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Live artisans</TableHead>
                <TableHead>Launch city</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {states.map((state) => (
                <TableRow key={String(state._id)}>
                  <TableCell className="font-medium">{state.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {state.code}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {state.artisanCount ?? 0}
                  </TableCell>
                  <TableCell>
                    {state.isLaunchCity ? (
                      <Badge>launch</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

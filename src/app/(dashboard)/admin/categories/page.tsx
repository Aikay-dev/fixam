import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/category";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  await requireAdmin("/admin/categories");

  await connectDB();

  const categories = await Category.find()
    .select("name slug parentId isActive artisanCount synonyms order")
    .sort({ order: 1, name: 1 })
    .lean()
    .exec();

  const groups = categories.filter((c) => !c.parentId);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground text-sm">
          {groups.length} groups, {categories.length - groups.length} trades.
          Each trade is its own landing page.
        </p>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => {
          const children = categories.filter(
            (c) => String(c.parentId) === String(group._id),
          );

          return (
            <Card key={String(group._id)}>
              <CardHeader>
                <CardTitle className="text-base">
                  {group.name}
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    {children.length} trades
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {children.map((child) => (
                  <div
                    key={String(child._id)}
                    className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{child.name}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        /services/{child.slug}
                      </p>
                      {child.synonyms?.length ? (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          also: {child.synonyms.slice(0, 4).join(", ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary">
                        {child.artisanCount ?? 0} live
                      </Badge>
                      {!child.isActive ? (
                        <Badge variant="outline">hidden</Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-muted-foreground text-xs">
        Editing the taxonomy is done in <code>src/data/categories.ts</code> and
        applied with <code>npm run seed</code>, which is idempotent. Keeping it
        in version control means a category change is reviewable, not a
        late-night click in production.
      </p>
    </div>
  );
}

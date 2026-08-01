import { ok, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/category";

export const revalidate = 3600;

/** Grouped trade taxonomy for pickers and navigation. */
export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .select("name slug parentId icon order artisanCount")
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();

    const groups = categories.filter((c) => !c.parentId);
    const byParent = new Map<string, typeof categories>();

    for (const category of categories) {
      if (!category.parentId) continue;
      const key = String(category.parentId);
      const list = byParent.get(key) ?? [];
      list.push(category);
      byParent.set(key, list);
    }

    return ok({
      groups: groups.map((g) => ({
        id: String(g._id),
        name: g.name,
        slug: g.slug,
        icon: g.icon,
        children: (byParent.get(String(g._id)) ?? []).map((c) => ({
          id: String(c._id),
          name: c.name,
          slug: c.slug,
          artisanCount: c.artisanCount ?? 0,
        })),
      })),
    });
  } catch (error) {
    console.error("[categories] failed", error);
    return serverError();
  }
}

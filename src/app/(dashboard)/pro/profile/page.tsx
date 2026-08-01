import type { Metadata } from "next";

import { ProfileEditor } from "@/components/pro/profile-editor";
import { getOrCreateProfile } from "@/lib/artisan/service";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { toOwnerArtisan } from "@/lib/serializers/artisan";
import { Category } from "@/models/category";
import { State } from "@/models/location";

export const metadata: Metadata = {
  title: "My profile",
  robots: { index: false, follow: false },
};

export default async function ProProfilePage() {
  const user = await requireUser(ROUTES.proProfile);
  const profile = await getOrCreateProfile(user.id, user.name ?? "");

  await connectDB();

  const [categories, states] = await Promise.all([
    Category.find({ isActive: true })
      .select("name parentId order")
      .sort({ order: 1, name: 1 })
      .lean()
      .exec(),
    State.find({ isActive: true })
      .select("name isLaunchCity")
      .sort({ name: 1 })
      .lean()
      .exec(),
  ]);

  const groups = categories
    .filter((c) => !c.parentId)
    .map((group) => ({
      id: String(group._id),
      name: group.name,
      children: categories
        .filter((c) => String(c.parentId) === String(group._id))
        .map((c) => ({ id: String(c._id), name: c.name })),
    }));

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
        <p className="text-muted-foreground text-sm">
          Each section saves on its own — you won&apos;t lose work if your
          connection drops.
        </p>
      </div>

      <ProfileEditor
        initialProfile={toOwnerArtisan(profile)}
        categoryGroups={groups}
        states={states.map((s) => ({
          id: String(s._id),
          name: s.name,
          isLaunchCity: Boolean(s.isLaunchCity),
        }))}
      />
    </div>
  );
}

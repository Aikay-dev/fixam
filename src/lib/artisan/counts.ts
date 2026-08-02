import "server-only";

import { PUBLIC_ARTISAN_STATUS } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { ArtisanProfile } from "@/models/artisan-profile";

/**
 * Live artisan counts, computed from the profiles themselves.
 *
 * ⚠️ Anything shown to a user must come from here, NOT from the stored
 * `artisanCount` field.
 *
 * That field is a denormalised counter incremented on approval, and counters
 * maintained by hand always drift: a profile deleted directly in the
 * database, a bulk script, a failed mid-write — none of them decrement it.
 * It drifted to "Plumber — 7 artisans" against a real total of 2, which makes
 * the directory look dishonest the moment somebody clicks through.
 *
 * One aggregation covers a whole page, so there is no real cost to being
 * correct. The stored field is kept only as a cheap sort hint and is
 * realigned by `npm run reconcile:counts`.
 */

export type CountMap = Map<string, number>;

/** Approved artisans per category id. Counts every trade on a profile. */
export async function liveCategoryCounts(): Promise<CountMap> {
  await connectDB();

  const rows = await ArtisanProfile.aggregate([
    { $match: { status: PUBLIC_ARTISAN_STATUS } },
    { $unwind: "$trades" },
    { $group: { _id: "$trades.categoryId", count: { $sum: 1 } } },
  ]).exec();

  return new Map(
    (rows as { _id: unknown; count: number }[]).map((r) => [
      String(r._id),
      r.count,
    ]),
  );
}

/** Approved artisans per state id. */
export async function liveStateCounts(): Promise<CountMap> {
  await connectDB();

  const rows = await ArtisanProfile.aggregate([
    { $match: { status: PUBLIC_ARTISAN_STATUS } },
    { $group: { _id: "$location.stateId", count: { $sum: 1 } } },
  ]).exec();

  return new Map(
    (rows as { _id: unknown; count: number }[]).map((r) => [
      String(r._id),
      r.count,
    ]),
  );
}

/** Approved artisans per LGA id. */
export async function liveLgaCounts(): Promise<CountMap> {
  await connectDB();

  const rows = await ArtisanProfile.aggregate([
    { $match: { status: PUBLIC_ARTISAN_STATUS } },
    { $group: { _id: "$location.lgaId", count: { $sum: 1 } } },
  ]).exec();

  return new Map(
    (rows as { _id: unknown; count: number }[]).map((r) => [
      String(r._id),
      r.count,
    ]),
  );
}

// --- Reconciliation -------------------------------------------------------

export type Drift = { id: string; name: string; from: number; to: number };
export type ReconcileReport = {
  categories: Drift[];
  states: Drift[];
  lgas: Drift[];
  total: number;
};

/**
 * Bring the stored `artisanCount` fields back in line with reality.
 *
 * Lives here rather than in a script so the scripts that cause drift (bulk
 * approve, the journey test's cleanup) can call the same code that fixes it,
 * instead of each carrying its own slightly different copy.
 */
export async function reconcileCounts(
  options: { dryRun?: boolean } = {},
): Promise<ReconcileReport> {
  await connectDB();

  const { Category } = await import("@/models/category");
  const { Lga, State } = await import("@/models/location");

  const [categoryCounts, stateCounts, lgaCounts] = await Promise.all([
    liveCategoryCounts(),
    liveStateCounts(),
    liveLgaCounts(),
  ]);

  // Written out per model rather than looped: the three Mongoose Model types
  // have no compatible shared signature, and casting them to one would throw
  // away the type safety that makes these queries checkable at all.
  const categories = await Category.find().select("name artisanCount").lean().exec();
  const states = await State.find().select("name artisanCount").lean().exec();
  const lgas = await Lga.find().select("name artisanCount").lean().exec();

  const diff = (
    docs: { _id: unknown; name: string; artisanCount?: number }[],
    actual: CountMap,
  ): Drift[] =>
    docs
      .map((doc) => ({
        id: String(doc._id),
        name: doc.name,
        from: doc.artisanCount ?? 0,
        to: actual.get(String(doc._id)) ?? 0,
      }))
      .filter((d) => d.from !== d.to);

  const categoryDrift = diff(categories, categoryCounts);
  const stateDrift = diff(states, stateCounts);
  const lgaDrift = diff(lgas, lgaCounts);

  if (!options.dryRun) {
    // Keyed on _id, never name: LGA names repeat across states (several have
    // an "Ifelodun"), so matching by name would write the wrong documents.
    await Promise.all([
      ...categoryDrift.map((d) =>
        Category.updateOne({ _id: d.id }, { $set: { artisanCount: d.to } }).exec(),
      ),
      ...stateDrift.map((d) =>
        State.updateOne({ _id: d.id }, { $set: { artisanCount: d.to } }).exec(),
      ),
      ...lgaDrift.map((d) =>
        Lga.updateOne({ _id: d.id }, { $set: { artisanCount: d.to } }).exec(),
      ),
    ]);
  }

  return {
    categories: categoryDrift,
    states: stateDrift,
    lgas: lgaDrift,
    total: categoryDrift.length + stateDrift.length + lgaDrift.length,
  };
}

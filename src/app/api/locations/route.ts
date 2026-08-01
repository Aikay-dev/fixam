import type { NextRequest } from "next/server";

import { ok, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Lga, State } from "@/models/location";

export const revalidate = 3600;

/**
 * States, or the LGAs of one state when `?stateId=` is supplied.
 *
 * Split rather than returning all 774 LGAs at once — that payload would be
 * a needless download on a metered mobile connection.
 */
export async function GET(request: NextRequest) {
  const stateId = request.nextUrl.searchParams.get("stateId");

  try {
    await connectDB();

    if (stateId) {
      if (!/^[a-f\d]{24}$/i.test(stateId)) return ok({ lgas: [] });

      const lgas = await Lga.find({ stateId, isActive: true })
        .select("name slug popularAreas artisanCount")
        .sort({ name: 1 })
        .lean()
        .exec();

      return ok({
        lgas: lgas.map((l) => ({
          id: String(l._id),
          name: l.name,
          slug: l.slug,
          popularAreas: l.popularAreas ?? [],
          artisanCount: l.artisanCount ?? 0,
        })),
      });
    }

    const states = await State.find({ isActive: true })
      .select("name slug code isLaunchCity artisanCount")
      .sort({ name: 1 })
      .lean()
      .exec();

    return ok({
      states: states.map((s) => ({
        id: String(s._id),
        name: s.name,
        slug: s.slug,
        code: s.code,
        isLaunchCity: Boolean(s.isLaunchCity),
        artisanCount: s.artisanCount ?? 0,
      })),
    });
  } catch (error) {
    console.error("[locations] failed", error);
    return serverError();
  }
}

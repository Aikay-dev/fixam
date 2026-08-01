import type { NextRequest } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/session";
import { fail, ok, parseBody, serverError } from "@/lib/api";
import { signUpload } from "@/lib/cloudinary";
import { features } from "@/lib/env";

const schema = z.object({
  kind: z.enum(["avatar", "portfolio", "credential", "review"]),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest({ requireVerified: true });
  if (!auth.ok) {
    return fail(auth.status, "You need a verified account to upload.", auth.reason);
  }

  if (!features.cloudinary) {
    return fail(503, "Uploads aren't configured yet.", "uploads_unavailable");
  }

  const parsed = await parseBody(request, schema);
  if (!parsed.ok) return parsed.response;

  try {
    // The folder is derived from the session user id inside signUpload, so a
    // client cannot aim the upload at another artisan's folder.
    return ok(signUpload(auth.user.id, parsed.data.kind));
  } catch (error) {
    console.error("[upload/signature] failed", error);
    return serverError("Couldn't prepare the upload.");
  }
}

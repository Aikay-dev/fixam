import { v2 as cloudinary } from "cloudinary";

import { MEDIA } from "@/lib/constants";
import { env, features } from "@/lib/env";

/**
 * Cloudinary, configured server-side only.
 *
 * Uploads are SIGNED, never unsigned. An unsigned preset is a public write
 * endpoint into the account — anyone who views source can fill the free tier
 * with whatever they like. The browser gets a short-lived signature scoped to
 * a folder and nothing else; the API secret never leaves the server.
 */

if (features.cloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };

export type UploadKind = "avatar" | "portfolio" | "credential" | "review";

/** Per-kind folder + transformation, so an avatar can't be a 4MB original. */
const UPLOAD_PRESETS: Record<
  UploadKind,
  { folder: string; transformation: string; maxBytes: number }
> = {
  avatar: {
    folder: "avatars",
    // Face-aware square crop — artisans upload full-body photos constantly.
    transformation: "c_fill,g_face,w_512,h_512,q_auto:good,f_auto",
    maxBytes: 3 * 1024 * 1024,
  },
  portfolio: {
    folder: "portfolio",
    transformation: "c_limit,w_1600,h_1600,q_auto:good,f_auto",
    maxBytes: MEDIA.maxImageBytes,
  },
  credential: {
    folder: "credentials",
    transformation: "c_limit,w_2000,h_2000,q_auto:good,f_auto",
    maxBytes: MEDIA.maxImageBytes,
  },
  review: {
    folder: "reviews",
    transformation: "c_limit,w_1400,h_1400,q_auto:good,f_auto",
    maxBytes: MEDIA.maxImageBytes,
  },
};

export type SignedUpload = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  transformation: string;
  maxBytes: number;
  uploadUrl: string;
};

/**
 * Produce a signature the browser can use for exactly one upload.
 *
 * The folder is derived from the authenticated user id, not from anything the
 * client sends, so one artisan cannot write into another's folder.
 */
export function signUpload(userId: string, kind: UploadKind): SignedUpload {
  const preset = UPLOAD_PRESETS[kind];
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/${preset.folder}/${userId}`;

  // Every signed param must be sent by the client verbatim, or Cloudinary
  // rejects the upload — that is what stops the client altering the folder.
  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
    transformation: preset.transformation,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY!,
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    folder,
    transformation: preset.transformation,
    maxBytes: preset.maxBytes,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}

/** Remove an asset. Used when an artisan deletes a portfolio photo. */
export async function destroyAsset(publicId: string): Promise<boolean> {
  if (!features.cloudinary) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error("[cloudinary] destroy failed", publicId, error);
    return false;
  }
}

/**
 * Build a delivery URL with the right size baked in.
 *
 * `f_auto,q_auto` is the single highest-leverage thing for Nigerian mobile
 * data: it serves AVIF/WebP where supported and drops payloads by more than
 * half versus the original JPEG.
 */
export function cldUrl(
  publicId: string,
  opts: { width?: number; height?: number; crop?: string; quality?: string } = {},
): string {
  if (!env.CLOUDINARY_CLOUD_NAME) return "";

  const parts = [
    "f_auto",
    `q_${opts.quality ?? "auto:good"}`,
    opts.crop ? `c_${opts.crop}` : "c_limit",
    opts.width ? `w_${opts.width}` : null,
    opts.height ? `h_${opts.height}` : null,
  ].filter(Boolean);

  return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${parts.join(",")}/${publicId}`;
}

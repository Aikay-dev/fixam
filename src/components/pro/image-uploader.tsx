"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MEDIA } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type UploadedImage = {
  publicId: string;
  url: string;
  caption: string;
  width: number | null;
  height: number | null;
  order: number;
};

type Kind = "avatar" | "portfolio" | "credential" | "review";

/**
 * Direct-to-Cloudinary upload using a server-issued signature.
 *
 * The file never touches our server, which matters on a serverless platform
 * with request body limits and on a Nigerian connection where an extra hop
 * is an extra chance to fail. The signature is scoped server-side to a folder
 * derived from the session, so the client cannot redirect the upload.
 */
async function uploadToCloudinary(
  file: File,
  kind: Kind,
): Promise<UploadedImage> {
  const signatureResponse = await fetch("/api/upload/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });

  if (!signatureResponse.ok) {
    const body = await signatureResponse.json().catch(() => ({}));
    throw new Error(body.error ?? "Couldn't start the upload.");
  }

  const sig = await signatureResponse.json();

  if (file.size > sig.maxBytes) {
    throw new Error(
      `That image is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is ${(sig.maxBytes / 1024 / 1024).toFixed(0)}MB.`,
    );
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  // Must match the signed params exactly or Cloudinary rejects it.
  form.append("folder", sig.folder);
  form.append("transformation", sig.transformation);

  const upload = await fetch(sig.uploadUrl, { method: "POST", body: form });

  if (!upload.ok) {
    const body = await upload.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Upload failed.");
  }

  const result = await upload.json();

  return {
    publicId: result.public_id,
    url: result.secure_url,
    caption: "",
    width: result.width ?? null,
    height: result.height ?? null,
    order: 0,
  };
}

function validate(file: File): string | null {
  if (!MEDIA.allowedMimeTypes.includes(file.type as never)) {
    return "Use a JPG, PNG or WebP image.";
  }
  return null;
}

// --- Single image (avatar) -------------------------------------------------

export function AvatarUploader({
  value,
  onChange,
  disabled,
}: {
  value: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    const error = validate(file);
    if (error) return toast.error(error);

    setBusy(true);
    try {
      onChange(await uploadToCloudinary(file, "avatar"));
      toast.success("Photo uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-full">
        {value ? (
          <Image
            src={value.url}
            alt="Your profile photo"
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <ImagePlus className="size-7" />
          </div>
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="size-5 animate-spin text-white" />
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {value ? "Change photo" : "Upload photo"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || busy}
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          A clear photo of your face. Customers contact people, not logos.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={MEDIA.allowedMimeTypes.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// --- Gallery (portfolio) ---------------------------------------------------

export function PortfolioUploader({
  value,
  onChange,
  disabled,
}: {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busyCount, setBusyCount] = useState(0);

  const remaining = MEDIA.maxPortfolioImages - value.length;

  async function handleFiles(files: FileList) {
    const selected = Array.from(files).slice(0, Math.max(0, remaining));

    if (selected.length === 0) {
      return toast.error(`You've reached the ${MEDIA.maxPortfolioImages} photo limit.`);
    }

    setBusyCount(selected.length);

    // Sequential, not parallel: several 5MB uploads at once on Nigerian mobile
    // data tends to time out all of them rather than finishing any.
    const uploaded: UploadedImage[] = [];
    for (const file of selected) {
      const error = validate(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        setBusyCount((c) => c - 1);
        continue;
      }
      try {
        uploaded.push(await uploadToCloudinary(file, "portfolio"));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `${file.name} failed.`);
      } finally {
        setBusyCount((c) => c - 1);
      }
    }

    if (uploaded.length) {
      onChange(
        [...value, ...uploaded].map((img, i) => ({ ...img, order: i })),
      );
      toast.success(
        `${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} added.`,
      );
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((image, index) => (
          <div
            key={image.publicId}
            className="bg-muted group relative aspect-square overflow-hidden rounded-md"
          >
            <Image
              src={image.url}
              alt={image.caption || `Work sample ${index + 1}`}
              fill
              sizes="(max-width: 640px) 33vw, 25vw"
              className="object-cover"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange(
                  value
                    .filter((i) => i.publicId !== image.publicId)
                    .map((img, i) => ({ ...img, order: i })),
                )
              }
              className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Remove photo"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {Array.from({ length: busyCount }).map((_, i) => (
          <div
            key={`pending-${i}`}
            className="bg-muted flex aspect-square items-center justify-center rounded-md"
          >
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ))}

        {remaining > 0 && busyCount === 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed transition",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <ImagePlus className="size-5" />
            <span className="text-xs">Add</span>
          </button>
        ) : null}
      </div>

      <p className="text-muted-foreground text-xs">
        {value.length} of {MEDIA.maxPortfolioImages}. Photos of finished work
        are the single biggest thing customers judge you on — aim for 4 to 6.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MEDIA.allowedMimeTypes.join(",")}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { PublicMedia } from "@/lib/serializers/artisan";

/**
 * Portfolio grid with a lightbox.
 *
 * Thumbnails are served small and only the opened image is loaded at full
 * size — on a metered Nigerian mobile connection, eagerly loading twelve
 * full-resolution job photos would be most of the page weight.
 */
export function ArtisanPortfolio({
  images,
  artisanName,
}: {
  images: PublicMedia[];
  artisanName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex === null ? null : images[openIndex];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image.url}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="bg-muted focus-visible:ring-ring relative aspect-square overflow-hidden rounded-md focus-visible:ring-2 focus-visible:outline-none"
            aria-label={`View work sample ${index + 1} by ${artisanName}`}
          >
            <Image
              src={image.url}
              alt={image.caption || `Work by ${artisanName}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              quality={50}
              loading={index < 3 ? "eager" : "lazy"}
              className="object-cover transition duration-200 hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Work sample"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          <div
            className="relative max-h-[85vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={open.url}
              alt={open.caption || `Work by ${artisanName}`}
              width={open.width ?? 1200}
              height={open.height ?? 900}
              quality={90}
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
            {open.caption ? (
              <p className="mt-2 text-center text-sm text-white/80">
                {open.caption}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

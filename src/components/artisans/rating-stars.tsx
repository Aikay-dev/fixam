import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Star rating. Renders a precise half-star via a clipped overlay rather than
 * rounding, because 4.4 and 4.6 displaying identically undermines the exact
 * thing the trust layer is selling.
 */
export function RatingStars({
  value,
  count,
  size = "sm",
  showCount = true,
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}) {
  const dimensions = { sm: "size-3.5", md: "size-4", lg: "size-5" }[size];
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  const percent = Math.max(0, Math.min(100, (value / 5) * 100));

  // Only a rating SUMMARY can be "no reviews yet". With showCount={false} the
  // caller is rendering the stars of one individual review, where there is no
  // count to speak of — falling through to the empty state there printed
  // "No reviews yet" next to every review on the page.
  if (!count && showCount) {
    return (
      <span className={cn("text-muted-foreground", textSize, className)}>
        No reviews yet
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative inline-flex" aria-hidden>
        <span className="inline-flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(dimensions, "text-muted-foreground/30")} />
          ))}
        </span>
        <span
          className="absolute inset-0 inline-flex gap-0.5 overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(dimensions, "shrink-0 fill-amber-400 text-amber-400")}
            />
          ))}
        </span>
      </span>

      <span className={cn("font-medium tabular-nums", textSize)}>
        {value.toFixed(1)}
      </span>

      {showCount ? (
        <span className={cn("text-muted-foreground", textSize)}>
          ({count})
        </span>
      ) : null}

      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5
        {count === undefined ? "" : ` from ${count} review${count === 1 ? "" : "s"}`}
      </span>
    </span>
  );
}

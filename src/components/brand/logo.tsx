import { cn } from "@/lib/utils";

/**
 * Fixam identity.
 *
 * The mark is a painted-signboard square carrying a decisive tick. It encodes
 * the tagline — "Get am done" — rather than the category. A wrench or crossed
 * tools is the first thing anyone reaches for on a handyman marketplace,
 * which is exactly why it isn't used here: a mark you could guess from the
 * category alone isn't doing any work.
 *
 * The tick's short arm is deliberately heavier than its long arm. A uniform
 * stroke reads as a generic UI checkmark; the weight difference gives it the
 * hand-painted feel of the workshop signboards the brand comes from, and it
 * survives being shrunk to 16px where finer detail would disappear.
 */

const NAVY = "#14304F";
const GOLD = "#D08B2C";

export function LogoMark({
  className,
  reversed = false,
}: {
  className?: string;
  /** For dark surfaces: the square becomes gold, the tick navy. */
  reversed?: boolean;
}) {
  const square = reversed ? GOLD : NAVY;
  const tick = reversed ? NAVY : GOLD;

  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      role="img"
      aria-label="Fixam"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="7.5" fill={square} />
      {/* Short arm — heavier. Drawn first so the long arm's cap sits on top. */}
      <path
        d="M8.5 16.8 L13.6 21.9"
        stroke={tick}
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      {/* Long arm — slightly lighter, carrying the eye up and out. */}
      <path
        d="M13.6 21.9 L24.2 9.8"
        stroke={tick}
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Horizontal lockup: mark plus wordmark.
 *
 * The wordmark is live text in the brand family rather than outlined paths,
 * so it stays selectable, searchable and legible at any size, and it can't
 * drift out of sync with the rest of the site's typography.
 */
export function Logo({
  className,
  onDark = false,
  showTagline = false,
}: {
  className?: string;
  onDark?: boolean;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-8 shrink-0" reversed={onDark} />

      <span className="inline-flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.375rem] font-black tracking-[-0.03em]",
            onDark ? "text-white" : "text-[#14304F]",
          )}
        >
          Fixam
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-0.5 text-[0.6875rem] font-medium italic",
              onDark ? "text-white/70" : "text-[#D08B2C]",
            )}
          >
            Get am done. Fix am fast.
          </span>
        ) : null}
      </span>
    </span>
  );
}

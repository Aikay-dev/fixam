import { ImageResponse } from "next/og";

/**
 * The Fixam mark as a PNG, for email.
 *
 * Gmail, Outlook and most Android clients strip inline SVG, so the emails
 * can't import the React component. They reference this URL instead.
 *
 * This is the `reversed` variant — gold square, navy tick — because the email
 * header sits on navy, where the standard navy square would disappear.
 *
 * Remote images are blocked by default in plenty of clients, which is fine:
 * the wordmark beside it is live text, so a blocked image degrades to the
 * brand name rather than to nothing.
 */

const NAVY = "#14304F";
const GOLD = "#D08B2C";

// 2x the 64px display size, so it stays crisp on retina phones.
const SIZE = 128;

// Nothing here varies per request, so prerender it. Emails are opened far
// more often than they're sent; this shouldn't wake a function every time.
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: GOLD,
          borderRadius: 30,
        }}
      >
        <svg width={SIZE} height={SIZE} viewBox="0 0 32 32" fill="none">
          <path
            d="M8.5 16.8 L13.6 21.9"
            stroke={NAVY}
            strokeWidth="5.2"
            strokeLinecap="round"
          />
          <path
            d="M13.6 21.9 L24.2 9.8"
            stroke={NAVY}
            strokeWidth="4.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
}

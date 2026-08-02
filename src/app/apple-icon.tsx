import { ImageResponse } from "next/og";

/**
 * Apple touch icon.
 *
 * iOS applies its own rounded-rectangle mask and no transparency, so this
 * fills the full square with navy and lets the system round it — a
 * pre-rounded icon would show corner artefacts once masked again. The tick
 * is also scaled up relative to the web favicon, because home-screen icons
 * are viewed small and surrounded by other apps competing for attention.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14304F",
        }}
      >
        <svg width="130" height="130" viewBox="0 0 32 32" fill="none">
          <path
            d="M7.6 16.9 L13.4 22.7"
            stroke="#D08B2C"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M13.4 22.7 L25.2 9.2"
            stroke="#D08B2C"
            strokeWidth="5.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}

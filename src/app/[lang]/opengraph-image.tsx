import { ImageResponse } from "next/og";
import { ReelSvg } from "@/components/brand/ReelSvg";
import { localeParams } from "@/i18n/config";
import { PALETTE } from "@/lib/display/palette";

// Link preview image: Filmdle's film reel, as on the home page's sleeves. Text-free apart from the Latin wordmark, so one design works
// for both languages (the bundled og font has no Hebrew glyphs).

export const alt = "Filmdle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return localeParams();
}

const REEL = 440;

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 72,
        background: `radial-gradient(900px 500px at 50% -120px, ${PALETTE.glow} 0%, ${PALETTE.page} 70%)`,
        color: PALETTE.ink,
      }}
    >
      <div
        style={{
          display: "flex",
          borderRadius: 9999,
          boxShadow: `0 30px 80px ${PALETTE.shadow}`,
        }}
      >
        <ReelSvg size={REEL} />
      </div>
      <div style={{ display: "flex", fontSize: 120, fontWeight: 900, letterSpacing: -4 }}>
        Filmdle
      </div>
    </div>,
    size,
  );
}

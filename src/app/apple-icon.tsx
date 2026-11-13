import { ImageResponse } from "next/og";
import { ReelSvg } from "@/components/brand/ReelSvg";
import { PALETTE } from "@/lib/display/palette";

// The home-screen icon on iPhones (and in the web app manifest): the reel on the page colour.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PALETTE.page,
      }}
    >
      <ReelSvg size={140} />
    </div>,
    size,
  );
}

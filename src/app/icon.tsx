import { ImageResponse } from "next/og";
import { ReelSvg } from "@/components/brand/ReelSvg";

// Favicon: the same film reel as the link preview image.

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<ReelSvg size={size.width} />, size);
}

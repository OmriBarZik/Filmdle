import type { MetadataRoute } from "next";
import { PALETTE } from "@/lib/display/palette";

/** Lets players add Filmdle to their phone's home screen, where it opens like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Filmdle",
    short_name: "Filmdle",
    description: "The daily movie poster timeline game.",
    // The proxy sends "/" on to the player's language.
    start_url: "/",
    display: "standalone",
    background_color: PALETTE.page,
    theme_color: PALETTE.page,
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

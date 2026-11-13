"use client";

import { useEffect } from "react";
import type { Film } from "@/lib/catalog/films";

/** Starts loading a poster ahead of time, so the next film shows at once. */
export function usePreloadPoster(film: Film | null | undefined) {
  const src = film?.poster;
  useEffect(() => {
    if (!src) {
      return;
    }
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.src = src;
  }, [src]);
}

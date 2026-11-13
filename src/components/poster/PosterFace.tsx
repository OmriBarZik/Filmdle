"use client";

import { clsx } from "clsx";
import type { Film } from "@/lib/catalog/films";

/** Inside the poster's button: the image, a shimmer while it loads, or 🎬 if it can't. */
export function PosterFace({
  film,
  status,
  zoomable,
  onLoad,
  onError,
}: {
  film: Film | null;
  status: "loading" | "loaded" | "failed";
  /** Shows the full-screen hint in the corner. */
  zoomable: boolean;
  onLoad: () => void;
  onError: () => void;
}) {
  return (
    <>
      {status === "loading" ? <span aria-hidden className="poster-shimmer" /> : null}
      {status === "failed" ? (
        <span aria-hidden className="poster-missing">
          🎬
        </span>
      ) : null}
      {film ? (
        // Hot-linked from Wikimedia, which serves its own sizes: next/image can't help.
        // A new element per film, so `onLoad` always fires for it, even from the cache.
        // oxlint-disable-next-line nextjs/no-img-element
        <img
          key={film.id}
          src={film.poster}
          alt=""
          referrerPolicy="no-referrer"
          decoding="async"
          draggable={false}
          className={clsx("poster-img", status === "loaded" && "poster-img-on")}
          onLoad={onLoad}
          onError={onError}
        />
      ) : null}
      {status === "loaded" && zoomable ? (
        <span aria-hidden className="poster-zoom-hint">
          ⤢
        </span>
      ) : null}
    </>
  );
}

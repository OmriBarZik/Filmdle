"use client";

import { clsx } from "clsx";
import { useLayoutEffect, useRef } from "react";
import type { PosterSwap } from "@/hooks/game/useGameScreen";
import { useI18n } from "@/i18n/I18nProvider";
import type { Film } from "@/lib/catalog/films";
import { smoothScrollToCenter } from "@/lib/display/smoothScroll";
import { PosterFace } from "./PosterFace";

/**
 * The poster of the film to place, as a button that opens it full screen. Its alt text
 * never names the film: the poster is the whole clue.
 */
export function PosterFrame({
  film,
  status,
  swap,
  onSwapEnd,
  onLoad,
  onError,
  onZoom,
}: {
  film: Film | null;
  status: "loading" | "loaded" | "failed";
  swap?: PosterSwap | null;
  onSwapEnd?: () => void;
  onLoad: () => void;
  onError: () => void;
  onZoom: () => void;
}) {
  const { t } = useI18n();

  // After a guess the player may be down at the "Place it" button: bring the poster
  // into view so they see it glow. A layout effect, so the glide starts at once.
  const boxRef = useRef<HTMLDivElement>(null);
  const swapping = Boolean(swap);
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!swapping || !box) {
      return;
    }
    const r = box.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= window.innerHeight) {
      return;
    }
    return smoothScrollToCenter(box);
  }, [swapping]);

  return (
    <div ref={boxRef} className="poster-box">
      {/* One per film, so each new poster eases in once the last one has flown off. */}
      <div
        key={film?.id}
        className={clsx(
          "absolute inset-0",
          swap
            ? `poster-swap poster-swap-${swap.kind === "flash" ? "flash" : "last"}`
            : "poster-enter",
        )}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && swap) {
            onSwapEnd?.();
          }
        }}
      >
        <button
          type="button"
          className="poster-button"
          disabled={!film || Boolean(swap) || status !== "loaded"}
          onClick={onZoom}
          aria-label={t.common.posterLabel}
          aria-keyshortcuts="Space"
        >
          <PosterFace
            film={film}
            status={status}
            zoomable={!swap}
            onLoad={onLoad}
            onError={onError}
          />
        </button>
        {/* Green or red glow over the poster after a guess. */}
        <div
          aria-hidden
          className={clsx(
            "poster-glow pointer-events-none absolute inset-0 rounded-control",
            swap?.correct === true && "poster-glow-good",
            swap?.correct === false && "poster-glow-bad",
          )}
        />
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { PosterZoom } from "@/components/film/PosterZoom";
import { PosterFrame } from "@/components/poster/PosterFrame";
import { PosterStatus } from "@/components/poster/PosterStatus";
import type { PosterSeen, PosterSwap } from "@/hooks/game/useGameScreen";
import { useKeyShortcut } from "@/hooks/game/useKeyShortcut";
import { usePreloadPoster } from "@/hooks/game/usePreloadPoster";
import { useI18n } from "@/i18n/I18nProvider";
import type { Film } from "@/lib/catalog/films";

type Props = {
  /** The film to place. */
  film: Film | undefined;
  /** The film after it, whose poster loads in the background. */
  next?: Film;
  seen: PosterSeen;
  onSeen: (seen: PosterSeen) => void;
  label?: string;
  onSkip?: () => void;
  /** While set, the poster just placed glows and flies off, and nothing can be placed. */
  swap?: PosterSwap | null;
  onSwapEnd?: () => void;
  /** Called when the player opens the poster full screen. */
  onZoom?: () => void;
  /** Puts the poster inside something else (the swipe line). */
  around?: (poster: ReactNode) => ReactNode;
};

/** The film to place: its poster (tap for full screen) and a status line under it. */
export function Poster({
  film,
  next,
  seen,
  onSeen,
  label,
  onSkip,
  swap,
  onSwapEnd,
  onZoom,
  around,
}: Props) {
  const { t } = useI18n();
  const [zoom, setZoom] = useState(false);
  // While it glows, the poster is still the one just placed.
  const shown = swap?.film ?? film ?? null;
  const status = posterStatus(shown, seen);
  // The film after this one, and the one after the swap, load while the player thinks.
  usePreloadPoster(swap ? film : next);

  const canZoom = Boolean(shown) && status === "loaded" && !swap;
  const openZoom = () => {
    setZoom(true);
    onZoom?.();
  };
  useKeyShortcut(" ", canZoom && !zoom, openZoom);

  const frame = (
    <PosterFrame
      film={shown}
      status={status}
      swap={swap}
      onSwapEnd={onSwapEnd}
      onLoad={() => shown && !swap && onSeen({ id: shown.id, failed: false })}
      onError={() => shown && !swap && onSeen({ id: shown.id, failed: true })}
      onZoom={openZoom}
    />
  );

  return (
    <div className="flex flex-col items-center gap-100">
      {around ? around(frame) : frame}
      <PosterStatus status={status} label={label} onSkip={onSkip} />
      {shown ? (
        <PosterZoom
          src={shown.poster}
          alt={t.info.posterAlt}
          open={zoom && canZoom}
          onClose={() => setZoom(false)}
        />
      ) : null}
    </div>
  );
}

/** What the poster shows: still loading, there, or missing. */
function posterStatus(film: Film | null, seen: PosterSeen): "loading" | "loaded" | "failed" {
  if (!film || seen?.id !== film.id) {
    return "loading";
  }
  return seen.failed ? "failed" : "loaded";
}

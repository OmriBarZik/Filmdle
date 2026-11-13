"use client";

import { useSyncExternalStore } from "react";
import { useKeyShortcut } from "@/hooks/game/useKeyShortcut";
import { useI18n } from "@/i18n/I18nProvider";
import type { LiveSlot } from "@/lib/line/liveSlot";
import { slotLabel } from "@/lib/line/timeline";

/**
 * Answers with the gap under the poster. It says where the film goes ("Between
 * 1992 and 1997"); its accessible name adds the action ("Place it: …"). Until the
 * poster has loaded it says so instead, so no one places a film unseen.
 */
export function PlaceButton({
  cards,
  slot,
  live,
  disabled = false,
  seen,
  onPlace,
}: {
  cards: readonly { year: number }[];
  slot: number;
  /** Follows the strip mid-swipe, ahead of the game's own state. */
  live: LiveSlot;
  disabled?: boolean;
  /** Whether the poster has loaded (or failed): a film can't be placed unseen. */
  seen: boolean;
  onPlace: (slot: number) => void;
}) {
  const { t } = useI18n();
  const at = useSyncExternalStore(live.subscribe, live.get, live.get) ?? slot;
  const where = slotLabel(cards, at, t.placeAt);
  const ready = seen && !disabled;
  // Enter places the film from anywhere on the page, and is never another button's
  // while the game asks for a placement (a clicked button keeps the focus).
  useKeyShortcut("Enter", ready, () => onPlace(at), { claim: true });
  return (
    <button
      type="button"
      className="btn-primary mx-auto max-w-page"
      disabled={!ready}
      aria-label={seen ? t.common.placeIt(where) : undefined}
      aria-keyshortcuts="Enter"
      onClick={() => onPlace(at)}
    >
      {seen ? where : t.common.waitForPoster}
    </button>
  );
}

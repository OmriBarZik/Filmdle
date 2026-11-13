"use client";

import { useEffect, useState } from "react";
import { dayKey } from "@/lib/catalog/dates";
import type { Film } from "@/lib/catalog/films";
import { createLiveSlot } from "@/lib/line/liveSlot";
import type { SaveData } from "@/lib/save/saveData";
import { type GameOpenEvent, track } from "@/lib/services/analytics";
import { useSave } from "./useSave";

/**
 * A result animation on the poster just placed (`film`): it glows, then "next" and
 * "last" fly it off the screen, and "flash" only glows.
 */
export type PosterSwap = { correct: boolean; kind: "next" | "last" | "flash"; film: Film };

/** Whether a film's poster has loaded, or failed to: either way it has been "seen". */
export type PosterSeen = { id: string; failed: boolean } | null;

/**
 * What both game screens start from: today's save, the state of the poster and the
 * line. `prepare` sets up today in the save; `opened` says how the game looked when
 * the screen opened, which is reported once.
 */
export function useGameScreen(
  prepare: (data: SaveData, day: string) => SaveData,
  opened: (data: SaveData, day: string) => GameOpenEvent,
) {
  const [day] = useState(dayKey);
  const [data, update] = useSave((d) => prepare(d, day));
  const [slot, setSlot] = useState<number | null>(null);
  // The gap under the poster mid-swipe, shared by the line and the place button.
  const [live] = useState(createLiveSlot);
  // The poster's result animation; nothing can be placed until it ends.
  const [swap, setSwap] = useState<PosterSwap | null>(null);
  const [seen, setSeen] = useState<PosterSeen>(null);

  const [openEvent] = useState(() => opened(data, day));
  useEffect(() => track("game_open", openEvent), [openEvent]);

  return { day, data, update, slot, setSlot, live, swap, setSwap, seen, setSeen };
}

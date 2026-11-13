"use client";

import dynamic from "next/dynamic";
import { GameLoading } from "@/components/game/GameLoading";
import { WeekStripLoading } from "@/components/home/WeekStripLoading";

const loadDaily = () => import("@/components/daily/DailyGame").then((m) => m.DailyGame);
const loadMarathon = () => import("@/components/marathon/MarathonGame").then((m) => m.MarathonGame);

/**
 * Fetch the game screens' code ahead of time (from the home page), so that
 * opening a game doesn't wait on the network. Safe to call many times.
 */
export function preloadGames() {
  void loadDaily().catch(ignore);
  void loadMarathon().catch(ignore);
}

function ignore(): void {
  // A failed preload is retried when the game is opened.
}

export const DailyGameClient = dynamic(loadDaily, {
  ssr: false,
  loading: GameLoading,
});

export const MarathonGameClient = dynamic(loadMarathon, {
  ssr: false,
  loading: GameLoading,
});

export const SettingsClient = dynamic(
  () => import("@/components/settings/Settings").then((m) => m.Settings),
  {
    ssr: false,
    loading: GameLoading,
  },
);

export const WeekStripClient = dynamic(
  () => import("@/components/home/WeekStrip").then((m) => m.WeekStrip),
  {
    ssr: false,
    loading: WeekStripLoading,
  },
);

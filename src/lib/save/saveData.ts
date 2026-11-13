import type { Locale } from "@/i18n/config";
import type { Film } from "@/lib/catalog/films";

export type DailyPlacement = { slot: number; correct: boolean };

export type DailyDay = {
  /** The year card the day's line starts with. */
  anchorYear: number;
  /** The five films, in the order they're played. */
  filmIds: string[];
  /** One entry per film placed so far (same order as filmIds). */
  placements: DailyPlacement[];
  /** Film languages the day was picked from. Missing (older saves) means all. */
  languages?: Locale[];
};

/** One card on the Daily Five line. */
export type DailyLineCard =
  | { kind: "anchor"; year: number }
  | { kind: "film"; film: Film; year: number; correct: boolean };

export type DailyStats = {
  played: number;
  perfect: number;
  /** Consecutive days with a perfect order. */
  streak: number;
  maxStreak: number;
  lastPerfect: string | null;
  /** distribution[n] = days with n films placed correctly. */
  distribution: number[];
};

type MarathonPlacement = { filmId: string; slot: number; correct: boolean };

export type MarathonDay = {
  /** The year card the day's line starts with. */
  anchorYear: number;
  /** Film languages the day was picked from. */
  languages: Locale[];
  /** Every film placed so far, in order. */
  placements: MarathonPlacement[];
  /** Films skipped because the poster couldn't load. */
  skipped: string[];
};

/**
 * A free-play Marathon, started with "Play again" once the day's run is over. It has its
 * own random shuffle (`seed`) and never touches the daily run or the stats.
 */
export type MarathonFreeRun = MarathonDay & {
  /** The day it was started: it only shows on that day. */
  day: string;
  /** Picks the run's films (`marathonFreeFilmsFor`); shared links carry it. */
  seed: string;
  /** Opened from a friend's link (so it can be played before the day's run). */
  shared?: boolean;
};

export type MarathonStats = {
  played: number;
  /** Most films placed right in one day. */
  best: number;
  /** Films placed right over every finished day, for the average. */
  totalHits: number;
};

type SaveSettings = {
  /** Which films can appear in new puzzles. Never empty. */
  filmLanguages: Locale[];
};

export type SaveData = {
  version: 1;
  daily: { days: Record<string, DailyDay>; stats: DailyStats };
  marathon: { days: Record<string, MarathonDay>; stats: MarathonStats; free?: MarathonFreeRun };
  settings: SaveSettings;
};

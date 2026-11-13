import type { Locale } from "@/i18n/config";

/**
 * Custom analytics events that follow a player through the game, sent to Google Analytics 4
 * when a `gtag` snippet is on the page. Filmdle ships without one (no tracking by default);
 * add GA's snippet to the root layout to start receiving them.
 *
 * Never send film details (title, year, poster): the events are about how people play,
 * and they must never be able to reveal an answer.
 */

export type GameMode = "daily_five" | "marathon";

type Events = {
  /** A game screen opened. `status` is the state of today's game at that moment. */
  game_open: { mode: GameMode; status: "new" | "in_progress" | "done" };
  /** The player opened the poster full screen. `turn` is 1-based. */
  poster_zoom: { mode: GameMode; turn: number };
  /** The player opened a placed film's details. */
  film_details: { mode: GameMode };
  /** A film was placed on the line. `turn` is 1-based. */
  film_place: { mode: GameMode; turn: number; correct: boolean };
  /**
   * The day's game is over: Daily Five has placed all five films; a Marathon has lost its
   * last heart (`free_play` when it was an extra run after the daily one). `score` is how many
   * films were placed right.
   */
  game_complete:
    | { mode: "daily_five"; score: number; total: number; perfect: boolean }
    | { mode: "marathon"; score: number; free_play: boolean };
  /** After the day's Marathon, the player started a free-play run ("Play again"). */
  play_again: { mode: "marathon" };
  /** The Marathon opened from a friend's challenge link (a free-play run with their score). */
  challenge_open: { mode: "marathon" };
  /** The current poster wouldn't load, so the player asked for another film. */
  film_skip: { mode: "marathon" };
  /** The share button. `method` is what happened (GA's recommended `share` event). */
  share: { content_type: GameMode; method: "shared" | "copied" | "failed" };
  language_switch: { from: Locale; to: Locale };
  film_languages_change: { film_language: Locale; enabled: boolean };
};

/** How a game screen reports opening. */
export type GameOpenEvent = Events["game_open"];

declare global {
  // Adding a field to the global Window needs declaration merging, which only interfaces do.
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface Window {
    /** Defined by the GA snippet. Missing until it runs, in tests, and with blockers. */
    gtag?: (command: "event", name: string, params: Record<string, unknown>) => void;
  }
}

/** Sends a GA event. Does nothing when GA isn't loaded (tests, ad blockers). */
export function track<K extends keyof Events>(name: K, params: Events[K]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.gtag?.("event", name, params);
}

import { type Locale, LOCALES } from "@/i18n/config";
import { anchorYearFor, dailyFilmsFor } from "@/lib/catalog/daily";
import { addDays } from "@/lib/catalog/dates";
import { getFilm } from "@/lib/catalog/films";
import { correctSlot, isSlotCorrect, type LineItem } from "@/lib/line/timeline";
import type {
  SaveData,
  DailyDay,
  DailyLineCard,
  DailyPlacement,
  DailyStats,
} from "@/lib/save/saveData";
import type { GameOpenEvent } from "@/lib/services/analytics";

function sameLanguages(a: readonly Locale[], b: readonly Locale[]): boolean {
  return a.length === b.length && a.every((l) => b.includes(l));
}

function isValidDailyDay(d: Partial<DailyDay> | undefined): d is DailyDay {
  return d !== undefined && typeof d.anchorYear === "number" && Array.isArray(d.placements);
}

/**
 * Prepare today's Daily Five. A day that hasn't been started yet is re-picked if the
 * player changed their film languages since it was first opened.
 */
export function ensureDailyDay(data: SaveData, day: string): SaveData {
  const langs = data.settings.filmLanguages;
  const existing = data.daily.days[day];
  if (
    isValidDailyDay(existing) &&
    (existing.placements.length > 0 || sameLanguages(existing.languages ?? LOCALES, langs))
  ) {
    return data;
  }
  return {
    ...data,
    daily: {
      ...data.daily,
      days: {
        ...data.daily.days,
        [day]: {
          anchorYear: anchorYearFor(day, langs),
          filmIds: dailyFilmsFor(day, langs).map((s) => s.id),
          placements: [],
          languages: [...langs],
        },
      },
    },
  };
}

export function dailyDayDone(d: DailyDay): boolean {
  return d.placements.length >= d.filmIds.length;
}

/**
 * The line as it stands: the anchor year plus every placed film. A film placed
 * in the wrong spot is still added — at its real position — so the line stays
 * accurate for the next film.
 */
export function dailyLine(d: DailyDay): DailyLineCard[] {
  const line: DailyLineCard[] = [{ kind: "anchor", year: d.anchorYear }];
  for (const [i, p] of d.placements.entries()) {
    const film = getFilm(d.filmIds[i]);
    if (film) {
      const at = p.correct ? p.slot : correctSlot(line, film.year);
      line.splice(at, 0, { kind: "film", film, year: film.year, correct: p.correct });
    }
  }
  return line;
}

/** Stats after finishing `day` with these placements. */
function addDailyResult(prev: DailyStats, day: string, placements: DailyPlacement[]): DailyStats {
  const hits = dailyHits(placements);
  const stats = { ...prev, distribution: prev.distribution.slice() };
  stats.played += 1;
  stats.distribution[hits] = (stats.distribution[hits] ?? 0) + 1;
  if (hits === placements.length) {
    stats.perfect += 1;
    stats.streak = stats.lastPerfect === addDays(day, -1) ? stats.streak + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    stats.lastPerfect = day;
  } else {
    stats.streak = 0;
  }
  return stats;
}

/** Place the current film into `slot` (0 = before the first card). */
export function placeDailyFilm(data: SaveData, day: string, slot: number): SaveData {
  const current = data.daily.days[day];
  if (!isValidDailyDay(current) || dailyDayDone(current)) {
    return data;
  }
  const film = getFilm(current.filmIds[current.placements.length]);
  if (!film) {
    return data;
  }
  const line = dailyLine(current);
  if (slot < 0 || slot > line.length) {
    return data;
  }

  const placements = [
    ...current.placements,
    { slot, correct: isSlotCorrect(line, slot, film.year) },
  ];
  const next: DailyDay = { ...current, placements };
  let daily = { ...data.daily, days: { ...data.daily.days, [day]: next } };

  if (dailyDayDone(next)) {
    daily = { ...daily, stats: addDailyResult(daily.stats, day, placements) };
  }
  return { ...data, daily };
}

export function dailyHits(placements: readonly DailyPlacement[]): number {
  return placements.filter((p) => p.correct).length;
}

/** Everything a Daily Five screen shows about the day so far. */
export function dailyView(d: DailyDay) {
  const done = dailyDayDone(d);
  const line = dailyLine(d);
  const turn = d.placements.length;
  const last = getFilm(d.filmIds[turn - 1]);
  return {
    done,
    line,
    turn,
    total: d.filmIds.length,
    current: done ? undefined : getFilm(d.filmIds[turn]),
    next: getFilm(d.filmIds[turn + 1]),
    last,
    lastCorrect: d.placements[turn - 1]?.correct ?? false,
    hits: dailyHits(d.placements),
    // Where the film just placed really went.
    lastAt: last ? line.findIndex((c) => c.kind === "film" && c.film.id === last.id) : -1,
  };
}

/** The line as swipe-line cards. A film placed wrong is red, at its real spot. */
export function dailyLineItems(line: readonly DailyLineCard[]): LineItem[] {
  return line.map((card) =>
    card.kind === "anchor"
      ? { key: "anchor", year: card.year, film: null }
      : {
          key: card.film.id,
          year: card.year,
          film: card.film,
          variant: card.correct ? "good" : "bad",
        },
  );
}

/** How today's game looked when the screen opened. */
export function dailyOpenEvent(data: SaveData, day: string): GameOpenEvent {
  const d = data.daily.days[day];
  if (d && dailyDayDone(d)) {
    return { mode: "daily_five", status: "done" };
  }
  return { mode: "daily_five", status: d && d.placements.length > 0 ? "in_progress" : "new" };
}

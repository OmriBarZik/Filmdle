import type { Messages } from "@/i18n/messages";
import { marathonAnchorYearFor, marathonFreeFilmsFor, marathonFilmsFor } from "@/lib/catalog/daily";
import { getFilm, type Film } from "@/lib/catalog/films";
import { correctSlot, isSlotCorrect } from "@/lib/line/timeline";
import type {
  MarathonDay,
  MarathonFreeRun,
  MarathonStats,
  SaveData,
  DailyLineCard,
} from "@/lib/save/saveData";
import type { GameOpenEvent } from "@/lib/services/analytics";

/** Wrong guesses a Marathon can take. The day ends when they're all gone. */
export const MARATHON_HEARTS = 3;

function sameLanguages(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((l) => b.includes(l));
}

/** A run that can be played: well formed, and every film placed in it still in the catalog. */
export function isValidMarathonDay(d: Partial<MarathonDay> | undefined): d is MarathonDay {
  return (
    d !== undefined &&
    typeof d.anchorYear === "number" &&
    Array.isArray(d.placements) &&
    Array.isArray(d.skipped) &&
    Array.isArray(d.languages) &&
    d.placements.every((p) => getFilm(p.filmId) !== undefined)
  );
}

/**
 * Prepare today's Marathon. A day nobody has placed a film in yet is re-picked if the
 * player changed their film languages since it was first opened.
 */
export function ensureMarathonDay(data: SaveData, day: string): SaveData {
  const langs = data.settings.filmLanguages;
  const existing = data.marathon.days[day];
  if (
    isValidMarathonDay(existing) &&
    (existing.placements.length > 0 || sameLanguages(existing.languages, langs))
  ) {
    return data;
  }
  const fresh: MarathonDay = {
    anchorYear: marathonAnchorYearFor(day, langs),
    languages: [...langs],
    placements: [],
    skipped: isValidMarathonDay(existing) ? existing.skipped : [],
  };
  return {
    ...data,
    marathon: { ...data.marathon, days: { ...data.marathon.days, [day]: fresh } },
  };
}

function marathonMisses(d: MarathonDay): number {
  return d.placements.filter((p) => !p.correct).length;
}

export function marathonHits(d: MarathonDay): number {
  return d.placements.filter((p) => p.correct).length;
}

/** The films a run plays, in order: the day's for the daily run, its own for free play. */
function runFilms(day: string, d: MarathonDay | MarathonFreeRun): Film[] {
  return "seed" in d
    ? marathonFreeFilmsFor(d.seed, d.languages)
    : marathonFilmsFor(day, d.languages);
}

/** The films still to come, in order (none once the run is over). */
function upcoming(day: string, d: MarathonDay | MarathonFreeRun): Film[] {
  if (marathonMisses(d) >= MARATHON_HEARTS) {
    return [];
  }
  const used = new Set([...d.placements.map((p) => p.filmId), ...d.skipped]);
  const films = runFilms(day, d);
  const at = films.findIndex((f) => !used.has(f.id));
  return at === -1 ? [] : films.slice(at, at + 2).filter((f) => !used.has(f.id));
}

/** The film to place next, or undefined when the run is over. */
export function marathonCurrent(day: string, d: MarathonDay | MarathonFreeRun): Film | undefined {
  return upcoming(day, d)[0];
}

/** The line as it stands. A film placed wrong is still added, at its real position. */
export function marathonLine(d: MarathonDay): DailyLineCard[] {
  const line: DailyLineCard[] = [{ kind: "anchor", year: d.anchorYear }];
  for (const p of d.placements) {
    const film = getFilm(p.filmId);
    if (film) {
      const at = p.correct ? p.slot : correctSlot(line, film.year);
      line.splice(at, 0, { kind: "film", film, year: film.year, correct: p.correct });
    }
  }
  return line;
}

function addMarathonResult(prev: MarathonStats, hits: number): MarathonStats {
  return {
    played: prev.played + 1,
    best: Math.max(prev.best, hits),
    totalHits: prev.totalHits + hits,
  };
}

/** A run with its current film placed into `slot`, or undefined when that can't be done. */
export function placeInRun<T extends MarathonDay>(
  day: string,
  run: T,
  slot: number,
): T | undefined {
  const film = marathonCurrent(day, run);
  const line = marathonLine(run);
  if (!film || slot < 0 || slot > line.length) {
    return undefined;
  }
  const correct = isSlotCorrect(line, slot, film.year);
  return { ...run, placements: [...run.placements, { filmId: film.id, slot, correct }] };
}

/** A run with its current film skipped, or undefined when there's none. */
export function skipInRun<T extends MarathonDay>(day: string, run: T): T | undefined {
  const film = marathonCurrent(day, run);
  return film ? { ...run, skipped: [...run.skipped, film.id] } : undefined;
}

/** Place today's current film into `slot` (0 = before the first card). */
export function placeMarathonFilm(data: SaveData, day: string, slot: number): SaveData {
  const current = data.marathon.days[day];
  const next = isValidMarathonDay(current) ? placeInRun(day, current, slot) : undefined;
  if (!next) {
    return data;
  }
  const done = !marathonCurrent(day, next);
  return {
    ...data,
    marathon: {
      ...data.marathon,
      days: { ...data.marathon.days, [day]: next },
      stats: done
        ? addMarathonResult(data.marathon.stats, marathonHits(next))
        : data.marathon.stats,
    },
  };
}

/** What placing a run's current film into `slot` would do: right or wrong, and whether the run ends. */
export function marathonOutcome(day: string, run: MarathonDay, slot: number) {
  const after = placeInRun(day, run, slot);
  const correct = after?.placements.at(-1)?.correct ?? false;
  return {
    correct,
    ends: !after || !marathonCurrent(day, after),
    score: marathonHits(run) + (correct ? 1 : 0),
  };
}

/** Skip today's current film because its video won't play. */
export function skipMarathonFilm(data: SaveData, day: string): SaveData {
  const current = data.marathon.days[day];
  const next = isValidMarathonDay(current) ? skipInRun(day, current) : undefined;
  if (!next) {
    return data;
  }
  return { ...data, marathon: { ...data.marathon, days: { ...data.marathon.days, [day]: next } } };
}

/** Everything the Marathon screen shows about the day so far. */
export function marathonView(day: string, d: MarathonDay | MarathonFreeRun) {
  const [current, next] = upcoming(day, d);
  const line = marathonLine(d);
  const lastPlacement = d.placements.at(-1);
  const last = getFilm(lastPlacement?.filmId);
  const misses = marathonMisses(d);
  return {
    done: !current,
    line,
    turn: d.placements.length,
    current,
    next,
    last,
    lastCorrect: lastPlacement?.correct ?? false,
    hits: marathonHits(d),
    hearts: Math.max(0, MARATHON_HEARTS - misses),
    // Where the film just placed really went.
    lastAt: last ? line.findIndex((c) => c.kind === "film" && c.film.id === last.id) : -1,
  };
}

/** How today's game looked when the screen opened. */
export function marathonOpenEvent(data: SaveData, day: string): GameOpenEvent {
  const d = data.marathon.days[day];
  if (d && !marathonCurrent(day, d)) {
    return { mode: "marathon", status: "done" };
  }
  return { mode: "marathon", status: d && d.placements.length > 0 ? "in_progress" : "new" };
}

/** The end-of-day headline and score line. */
export function marathonEndText(t: Messages, hearts: number, hits: number) {
  return {
    title: hearts === 0 ? t.marathon.over : t.marathon.ranOut,
    score: t.marathon.final(hits),
  };
}

import { type Locale, LOCALES } from "@/i18n/config";
import { type Film, filmLanguage, FILMS } from "./films";
import { hashString, mulberry32, seededShuffle } from "./random";

export const DAILY_SIZE = 5;

/** Starting year if the catalog somehow has no other year to offer. */
const FALLBACK_YEAR = 1990;

/**
 * The day's film order for the player's chosen languages.
 *
 * Each language keeps its own order from the one seeded shuffle, then the lists are
 * interleaved: every next film comes from one of the chosen languages with equal odds
 * (a second seeded coin, `${seed}:mix`), whatever their catalog sizes. So with
 * International and Israeli films both on, about half the picks are each. When a
 * language runs out, the rest come from the others.
 *
 * Nothing here depends on anything but the seed and the setting: players with the same
 * setting (both on is the default) get the same puzzle.
 */
function shuffled(seed: string, langs: readonly Locale[] = LOCALES): Film[] {
  const all = seededShuffle(FILMS, seed);
  const queues = LOCALES.filter((l) => langs.includes(l))
    .map((l) => all.filter((s) => filmLanguage(s) === l))
    .filter((q) => q.length > 0);
  if (queues.length === 0) {
    return langs === LOCALES ? all : shuffled(seed);
  }
  const [first] = queues;
  if (queues.length === 1 && first) {
    return first;
  }

  const coin = mulberry32(hashString(`${seed}:mix`));
  const out: Film[] = [];
  let live = queues.map((films) => ({ films, next: 0 }));
  while (live.length > 0) {
    const pick = live[Math.floor(coin() * live.length)];
    const film = pick?.films[pick.next++];
    if (!pick || !film) {
      break;
    }
    out.push(film);
    if (pick.next === pick.films.length) {
      live = live.filter((q) => q !== pick);
    }
  }
  return out;
}

/**
 * The 5 films for the "Daily Five" puzzle, in the order they are played. Everyone
 * gets the same films on the same calendar day. Years are kept distinct.
 */
export function dailyFilmsFor(day: string, langs?: readonly Locale[]): Film[] {
  const picked: Film[] = [];
  const years = new Set<number>();
  for (const film of shuffled(`daily:${day}`, langs)) {
    if (years.has(film.year)) {
      continue;
    }
    picked.push(film);
    years.add(film.year);
    if (picked.length === DAILY_SIZE) {
      break;
    }
  }
  return picked;
}

/**
 * The starting year card for the daily five, e.g. 1980. Taken from another film
 * in the catalog (so it's a realistic year) whose year differs from all five.
 */
export function anchorYearFor(day: string, langs?: readonly Locale[]): number {
  const used = new Set(dailyFilmsFor(day, langs).map((s) => s.year));
  const pick = shuffled(`anchor:${day}`, langs).find((s) => !used.has(s.year));
  return pick?.year ?? FALLBACK_YEAR;
}

/**
 * The day's Marathon films, in the order they're played: the whole (chosen-language)
 * catalog, seeded by the day, without the day's Daily Five films (no spoilers).
 * Everyone with the same setting gets the same run of films.
 */
export function marathonFilmsFor(day: string, langs?: readonly Locale[]): Film[] {
  // The screen asks on every render, and the answer never changes: shuffle once.
  const key = `${day}|${(langs ?? LOCALES).join(",")}`;
  if (marathonCache?.key !== key) {
    const five = new Set(dailyFilmsFor(day, langs).map((s) => s.id));
    marathonCache = {
      key,
      films: shuffled(`marathon:${day}`, langs).filter((s) => !five.has(s.id)),
    };
  }
  return marathonCache.films;
}

let marathonCache: { key: string; films: Film[] } | null = null;

/** The Marathon's starting year, different from the first film's year. */
export function marathonAnchorYearFor(day: string, langs?: readonly Locale[]): number {
  const first = marathonFilmsFor(day, langs)[0];
  const pick = shuffled(`marathon-anchor:${day}`, langs).find((s) => s.year !== first?.year);
  return pick?.year ?? FALLBACK_YEAR;
}

/**
 * A free-play Marathon's films: the catalog in the run's own random order. Only the `seed`
 * (made when a player presses "Play again") and the film languages pick them, never the day,
 * so a friend who opens a shared run gets exactly the same films whenever they play it.
 */
export function marathonFreeFilmsFor(seed: string, langs?: readonly Locale[]): Film[] {
  const key = `${seed}|${(langs ?? LOCALES).join(",")}`;
  if (freeCache?.key !== key) {
    freeCache = { key, films: shuffled(`marathon-free:${seed}`, langs) };
  }
  return freeCache.films;
}

let freeCache: { key: string; films: Film[] } | null = null;

/** A free-play Marathon's starting year, different from its first film's year. */
export function marathonFreeAnchorYearFor(seed: string, langs?: readonly Locale[]): number {
  const first = marathonFreeFilmsFor(seed, langs)[0];
  const pick = shuffled(`marathon-free-anchor:${seed}`, langs).find((s) => s.year !== first?.year);
  return pick?.year ?? FALLBACK_YEAR;
}

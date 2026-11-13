import { expect, it } from "vitest";
import { marathonAnchorYearFor, marathonFilmsFor, dailyFilmsFor } from "@/lib/catalog/daily";
import { addDays } from "@/lib/catalog/dates";
import {
  ensureMarathonDay,
  MARATHON_HEARTS,
  marathonCurrent,
  marathonLine,
  marathonOpenEvent,
  marathonView,
  placeMarathonFilm,
  skipMarathonFilm,
} from "@/lib/games/marathonState";
import { correctSlot, isSlotCorrect } from "@/lib/line/timeline";
import type { SaveData } from "@/lib/save/saveData";
import { emptySave, setFilmLanguage } from "@/lib/save/storage";

const DAY = "2026-11-01";

/** Place today's next film right or wrong. */
function placeNext(d: SaveData, day: string, right: boolean): SaveData {
  const state = d.marathon.days[day]!;
  const film = marathonCurrent(day, state)!;
  const line = marathonLine(state);
  const good = correctSlot(line, film.year);
  const bad = [0, line.length].find((s) => !isSlotCorrect(line, s, film.year))!;
  return placeMarathonFilm(d, day, right ? good : bad);
}

it("marathon picks: are the same for everyone, skip the Daily Five, and change daily", () => {
  const films = marathonFilmsFor(DAY).map((s) => s.id);
  expect(marathonFilmsFor(DAY).map((s) => s.id)).toEqual(films);
  const five = new Set(dailyFilmsFor(DAY).map((s) => s.id));
  expect(films.some((id) => five.has(id))).toBe(false);
  expect(new Set(films).size).toBe(films.length);
  expect(marathonFilmsFor(addDays(DAY, 1)).map((s) => s.id)).not.toEqual(films);
});

it("marathon picks: start from a year other than the first film's", () => {
  for (let i = 0; i < 100; i++) {
    const day = addDays(DAY, i);
    expect(marathonAnchorYearFor(day)).not.toBe(marathonFilmsFor(day)[0]!.year);
  }
});

it("marathon: starts with the starting year, full hearts and the first film", () => {
  const d = ensureMarathonDay(emptySave(), DAY);
  const state = d.marathon.days[DAY]!;
  expect(marathonLine(state)).toEqual([{ kind: "anchor", year: marathonAnchorYearFor(DAY) }]);
  const view = marathonView(DAY, state);
  expect(view.hearts).toBe(MARATHON_HEARTS);
  expect(view.done).toBe(false);
  expect(view.current?.id).toBe(marathonFilmsFor(DAY)[0]!.id);
  expect(ensureMarathonDay(d, DAY)).toBe(d);
});

it("marathon: keeps going on right answers and costs a heart for each wrong one", () => {
  let d = ensureMarathonDay(emptySave(), DAY);
  for (const right of [true, true, false, true, false]) {
    d = placeNext(d, DAY, right);
  }
  const state = d.marathon.days[DAY]!;
  const view = marathonView(DAY, state);
  expect(view).toMatchObject({ done: false, hits: 3, hearts: 1, turn: 5 });
  // Wrong films still join the line at their real spot, so it stays in order.
  const years = marathonLine(state).map((c) => c.year);
  expect(years).toHaveLength(6);
  expect(years).toEqual(years.toSorted((a, b) => a - b));
  expect(d.marathon.stats.played).toBe(0);
});

it("marathon: ends on the third wrong answer and records the score", () => {
  let d = ensureMarathonDay(emptySave(), DAY);
  for (const right of [true, false, true, true, false, false]) {
    d = placeNext(d, DAY, right);
  }
  const state = d.marathon.days[DAY]!;
  expect(marathonView(DAY, state)).toMatchObject({ done: true, hits: 3, hearts: 0 });
  expect(marathonCurrent(DAY, state)).toBeUndefined();
  expect(placeMarathonFilm(d, DAY, 0)).toBe(d);
  expect(d.marathon.stats).toEqual({ played: 1, best: 3, totalHits: 3 });
  expect(marathonOpenEvent(d, DAY)).toEqual({ mode: "marathon", status: "done" });

  // The next day starts fresh, and the best score is kept.
  const next = addDays(DAY, 1);
  d = ensureMarathonDay(d, next);
  for (const right of [true, false, false, false]) {
    d = placeNext(d, next, right);
  }
  expect(d.marathon.stats).toEqual({ played: 2, best: 3, totalHits: 4 });
});

it("marathon: can skip a film whose video won't play", () => {
  let d = ensureMarathonDay(emptySave(), DAY);
  const first = marathonCurrent(DAY, d.marathon.days[DAY]!)!;
  d = skipMarathonFilm(d, DAY);
  const state = d.marathon.days[DAY]!;
  expect(state.skipped).toEqual([first.id]);
  expect(marathonCurrent(DAY, state)!.id).toBe(marathonFilmsFor(DAY)[1]!.id);
  expect(marathonView(DAY, state).hearts).toBe(MARATHON_HEARTS);
});

it("marathon: re-picks for new film languages only before the first film is placed", () => {
  const fresh = setFilmLanguage(ensureMarathonDay(emptySave(), DAY), "en", false);
  const repicked = ensureMarathonDay(fresh, DAY);
  expect(repicked.marathon.days[DAY]!.languages).toEqual(["he"]);
  expect(marathonCurrent(DAY, repicked.marathon.days[DAY]!)!.titleHe).toBeTruthy();

  const started = setFilmLanguage(
    placeNext(ensureMarathonDay(emptySave(), DAY), DAY, true),
    "en",
    false,
  );
  expect(ensureMarathonDay(started, DAY)).toBe(started);
  expect(marathonOpenEvent(started, DAY)).toEqual({ mode: "marathon", status: "in_progress" });
});

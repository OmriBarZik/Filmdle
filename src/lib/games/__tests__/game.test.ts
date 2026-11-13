import { expect, it } from "vitest";
import { MESSAGES } from "@/i18n/messages";
import { anchorYearFor, marathonFilmsFor, dailyFilmsFor } from "@/lib/catalog/daily";
import { addDays } from "@/lib/catalog/dates";
import { getFilm, FILMS } from "@/lib/catalog/films";
import { ensureDailyDay, placeDailyFilm, dailyDayDone, dailyLine } from "@/lib/games/dailyState";
import { ensureMarathonDay, marathonCurrent } from "@/lib/games/marathonState";
import { correctSlot, isSlotCorrect, slotLabel } from "@/lib/line/timeline";
import type { SaveData } from "@/lib/save/saveData";
import { emptySave, setFilmLanguage } from "@/lib/save/storage";

const DAY = "2026-11-01";

it("catalog: has unique, well-formed entries", () => {
  const ids = new Set(FILMS.map((f) => f.id));
  expect(ids.size).toBe(FILMS.length);
  for (const f of FILMS) {
    expect(f.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(getFilm(f.id)).toBe(f);
    expect(f.year).toBeGreaterThan(1900);
    expect(f.year).toBeLessThanOrEqual(new Date().getFullYear());
    expect(f.title && f.wiki).toBeTruthy();
    expect(f.poster).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
  }
});

it("daily selection: is deterministic and picks 5 distinct years", () => {
  const a = dailyFilmsFor(DAY);
  expect(a.map((s) => s.id)).toEqual(dailyFilmsFor(DAY).map((s) => s.id));
  expect(new Set(a.map((s) => s.year)).size).toBe(5);
  expect(dailyFilmsFor(addDays(DAY, 1)).map((s) => s.id)).not.toEqual(a.map((s) => s.id));
});

it("daily selection: picks an anchor year different from the five films", () => {
  for (let i = 0; i < 100; i++) {
    const day = addDays(DAY, i);
    const years = dailyFilmsFor(day).map((s) => s.year);
    expect(years).not.toContain(anchorYearFor(day));
  }
});

const cards = [{ year: 1994 }, { year: 1997 }, { year: 2000 }];
it("timeline slots: validates placement with ties allowed", () => {
  expect(isSlotCorrect(cards, 0, 1990)).toBe(true);
  expect(isSlotCorrect(cards, 2, 1998)).toBe(true);
  expect(isSlotCorrect(cards, 3, 2010)).toBe(true);
  expect(isSlotCorrect(cards, 1, 1997)).toBe(true);
  expect(isSlotCorrect(cards, 2, 1997)).toBe(true);
  expect(isSlotCorrect(cards, 0, 1998)).toBe(false);
  expect(correctSlot(cards, 1998)).toBe(2);
});
it("timeline slots: labels slots", () => {
  const en = MESSAGES.en.slots;
  expect(slotLabel([], 0, en)).toBe("Anywhere");
  expect(slotLabel(cards, 0, en)).toBe("Before 1994");
  expect(slotLabel(cards, 2, en)).toBe("1997 – 2000");
  expect(slotLabel(cards, 3, en)).toBe("After 2000");
  expect(slotLabel([{ year: 1997 }, { year: 1997 }], 1, en)).toBe("In 1997");
});

function playDay(d: SaveData, day: string, rightFor: (i: number) => boolean): SaveData {
  d = ensureDailyDay(d, day);
  for (let i = 0; i < 5; i++) {
    const state = d.daily.days[day]!;
    const line = dailyLine(state);
    const film = getFilm(state.filmIds[i])!;
    const right = correctSlot(line, film.year);
    const wrong = right === 0 ? line.length : 0;
    d = placeDailyFilm(d, day, rightFor(i) ? right : wrong);
  }
  return d;
}

it("daily five: starts with only the anchor year", () => {
  const d = ensureDailyDay(emptySave(), DAY);
  expect(dailyLine(d.daily.days[DAY]!)).toEqual([{ kind: "anchor", year: anchorYearFor(DAY) }]);
});

it("daily five: scores a perfect day and tracks streaks", () => {
  let d = playDay(emptySave(), DAY, () => true);
  d = playDay(d, addDays(DAY, 1), () => true);
  expect(d.daily.days[DAY]!.placements.every((p) => p.correct)).toBe(true);
  expect(d.daily.stats.streak).toBe(2);
  expect(d.daily.stats.perfect).toBe(2);
  expect(d.daily.stats.played).toBe(2);
});

it("daily five: keeps the line in order even after wrong placements", () => {
  const d = playDay(emptySave(), DAY, (i) => i % 2 === 0);
  const state = d.daily.days[DAY]!;
  expect(dailyDayDone(state)).toBe(true);
  expect(state.placements.map((p) => p.correct)).toEqual([true, false, true, false, true]);
  const years = dailyLine(state).map((c) => c.year);
  expect(years).toHaveLength(6);
  expect(years).toEqual(years.toSorted((a, b) => a - b));
  expect(d.daily.stats.streak).toBe(0);
  expect(d.daily.stats.distribution[3]).toBe(1);
});

it("daily five: ignores placements after the day is done", () => {
  const d = playDay(emptySave(), DAY, () => true);
  expect(placeDailyFilm(d, DAY, 0)).toBe(d);
});

const he = (id: string) => Boolean(getFilm(id)?.israeli);

it("film language settings: defaults to every language and leaves the shared puzzle unchanged", () => {
  const d = ensureDailyDay(emptySave(), DAY);
  expect(d.settings.filmLanguages).toEqual(["en", "he"]);
  expect(d.daily.days[DAY]!.filmIds).toEqual(dailyFilmsFor(DAY).map((s) => s.id));
  expect(d.daily.days[DAY]!.anchorYear).toBe(anchorYearFor(DAY));
});

it("film language settings: only picks films in the chosen language", () => {
  for (const lang of ["en", "he"] as const) {
    let d = setFilmLanguage(emptySave(), lang === "en" ? "he" : "en", false);
    for (let i = 0; i < 20; i++) {
      const day = addDays(DAY, i);
      d = ensureMarathonDay(ensureDailyDay(d, day), day);
      expect(d.daily.days[day]!.filmIds.every((id) => he(id) === (lang === "he"))).toBe(true);
      expect(he(marathonCurrent(day, d.marathon.days[day]!)!.id)).toBe(lang === "he");
    }
  }
});

it("film language settings: never turns off the last language", () => {
  const d = setFilmLanguage(emptySave(), "he", false);
  expect(setFilmLanguage(d, "en", false)).toBe(d);
  expect(setFilmLanguage(d, "en", true)).toBe(d);
});

it("film language settings: re-picks today only if it hasn't been started", () => {
  let d = ensureDailyDay(emptySave(), DAY);
  const before = d.daily.days[DAY]!.filmIds;
  d = setFilmLanguage(d, "en", false);
  const fresh = ensureDailyDay(d, DAY);
  expect(fresh.daily.days[DAY]!.filmIds).not.toEqual(before);
  expect(fresh.daily.days[DAY]!.filmIds.every(he)).toBe(true);

  const started = placeDailyFilm(ensureDailyDay(emptySave(), DAY), DAY, 0);
  const kept = setFilmLanguage(started, "en", false);
  expect(ensureDailyDay(kept, DAY)).toBe(kept);
});

const share = (ids: string[]) => ids.filter((id) => getFilm(id)?.israeli).length / ids.length;
const days = Array.from({ length: 365 }, (_, i) => addDays(DAY, i));

it("language balance: gives about half Israeli and half International films when both are on", () => {
  const five = days.flatMap((d) => dailyFilmsFor(d).map((s) => s.id));
  const marathon = days.flatMap((d) =>
    marathonFilmsFor(d)
      .slice(0, 20)
      .map((s) => s.id),
  );
  expect(share(five)).toBeGreaterThan(0.45);
  expect(share(five)).toBeLessThan(0.55);
  expect(share(marathon)).toBeGreaterThan(0.45);
  expect(share(marathon)).toBeLessThan(0.55);
});

it("language balance: still uses every film once in a full day's order", () => {
  const ids = new Set(dailyFilmsFor(DAY).map((s) => s.id));
  expect(ids.size).toBe(5);
});

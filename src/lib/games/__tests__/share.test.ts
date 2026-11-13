import { expect, it } from "vitest";
import { MESSAGES } from "@/i18n/messages";
import { marathonShareText, dailyShareText } from "@/lib/games/share";
import type { MarathonDay, DailyDay } from "@/lib/save/saveData";

const ORIGIN = "https://filmdle.example";
const day = (correct: boolean[], languages?: DailyDay["languages"]): DailyDay => ({
  anchorYear: 1990,
  filmIds: ["a", "b", "c", "d", "e"],
  placements: correct.map((c) => ({ slot: 0, correct: c })),
  languages,
});

it("formats a Daily Five result", () => {
  expect(dailyShareText(MESSAGES.en, day([true, false, true, true, true]), ORIGIN)).toBe(
    `Filmdle Daily Five 4/5\n🟩🟥🟩🟩🟩\n${ORIGIN}/daily`,
  );
  expect(dailyShareText(MESSAGES.en, day([true, true, true, true, true], ["en"]), ORIGIN)).toBe(
    `Filmdle Daily Five 5/5 · International films only\n🟩🟩🟩🟩🟩\n${ORIGIN}/daily`,
  );
  // Both kinds on (or an old save without languages) adds no tag.
  expect(dailyShareText(MESSAGES.en, day([], ["en", "he"]), ORIGIN)).toBe(
    `Filmdle Daily Five 0/5\n\n${ORIGIN}/daily`,
  );
});

const marathon = (correct: boolean[], languages: MarathonDay["languages"]): MarathonDay => ({
  anchorYear: 1990,
  languages,
  placements: correct.map((c, i) => ({ filmId: String(i), slot: 0, correct: c })),
  skipped: [],
});

it("formats a Marathon result, ten squares a row", () => {
  const twelve = [...Array.from({ length: 10 }, () => true), false, false];
  expect(
    marathonShareText(
      MESSAGES.en,
      marathon([true, false, true, false, false], ["en", "he"]),
      ORIGIN,
    ),
  ).toBe(`Filmdle Marathon · 2 🎬\n🟩🟥🟩🟥🟥\n${ORIGIN}/marathon`);
  expect(marathonShareText(MESSAGES.en, marathon(twelve, ["he"]), ORIGIN)).toBe(
    `Filmdle Marathon · 10 🎬 · Israeli films only\n${"🟩".repeat(10)}\n🟥🟥\n${ORIGIN}/marathon`,
  );
  expect(
    marathonShareText(MESSAGES.he, marathon([false, false, false], ["en", "he"]), ORIGIN),
  ).toBe(`Filmdle מרתון · 0 🎬\n🟥🟥🟥\n${ORIGIN}/marathon`);
});

it("formats a free-play Marathon as a challenge, without the day's number", () => {
  const free = {
    ...marathon([true, true, false], ["en", "he"]),
    day: "2026-11-02",
    seed: "s1s1s1s1s1",
  };
  expect(marathonShareText(MESSAGES.en, free, ORIGIN)).toBe(
    `Filmdle Marathon · Free play · 2 🎬\n🟩🟩🟥\nSame films. Can you beat my 2? 🎯\n${ORIGIN}/marathon?run=s1s1s1s1s1`,
  );
  const israeli = { ...free, languages: ["he" as const] };
  expect(marathonShareText(MESSAGES.he, israeli, ORIGIN)).toBe(
    `Filmdle מרתון · משחק חופשי · 2 🎬 · רק סרטים ישראליים\n🟩🟩🟥\nאותם סרטים. תצליחו לעבור את ה־2 שלי? 🎯\n${ORIGIN}/marathon?run=s1s1s1s1s1&films=he`,
  );
});

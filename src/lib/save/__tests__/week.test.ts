import { expect, it } from "vitest";
import { ensureDailyDay, placeDailyFilm } from "@/lib/games/dailyState";
import { emptySave } from "@/lib/save/storage";
import { dayDate, weekDays } from "@/lib/save/week";

it("week: is today's week from Sunday to Saturday, with the days a game was started", () => {
  let d = ensureDailyDay(emptySave(), "2026-11-02");
  d = placeDailyFilm(d, "2026-11-02", 0);
  // Opening a game without placing a film doesn't count, nor do days before Sunday.
  d = ensureDailyDay(d, "2026-11-03");
  d = placeDailyFilm(ensureDailyDay(d, "2026-10-31"), "2026-10-31", 0);
  // 2026-11-04 is a Wednesday.
  expect(weekDays(d, "2026-11-04")).toEqual([
    { day: "2026-11-01", played: false, future: false },
    { day: "2026-11-02", played: true, future: false },
    { day: "2026-11-03", played: false, future: false },
    { day: "2026-11-04", played: false, future: false },
    { day: "2026-11-05", played: false, future: true },
    { day: "2026-11-06", played: false, future: true },
    { day: "2026-11-07", played: false, future: true },
  ]);
  // On a Sunday the week starts today.
  expect(weekDays(d, "2026-11-08")[0]).toEqual({ day: "2026-11-08", played: false, future: false });
});

it("week: reads a day key as that local date", () => {
  const date = dayDate("2026-11-02");
  expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 2]);
});

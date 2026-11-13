// Each move depends on the previous one, so the loops click one step at a time.
/* oxlint-disable no-await-in-loop */
import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { DailyGame } from "@/components/daily/DailyGame";
import { MESSAGES } from "@/i18n/messages";
import { anchorYearFor, dailyFilmsFor } from "@/lib/catalog/daily";
import { getFilm } from "@/lib/catalog/films";
import { correctSlot, slotLabel } from "@/lib/line/timeline";
import { expectAccessible } from "@/test/expectAccessible";
import { trackedEvents } from "@/test/fakes/fakeAnalytics";
import { fakeClipboard } from "@/test/fakes/fakeClipboard";
import { wikipediaRequests } from "@/test/fakes/fakeWikipedia";
import { movePosterTo, seePoster, posterGap } from "@/test/input/posterControls";
import { renderIn } from "@/test/renderIn";
import { savedData } from "@/test/savedData";
import { setupGameTests } from "@/test/setupGameTests";

setupGameTests();

const DAY = "2026-11-01";

/** The line as the player sees it, rebuilt from the save. */
function currentLine(): { year: number }[] {
  const d = savedData().daily.days[DAY]!;
  const line: { year: number }[] = [{ year: d.anchorYear }];
  for (const [i, p] of d.placements.entries()) {
    const year = getFilm(d.filmIds[i])!.year;
    line.splice(p.correct ? p.slot : correctSlot(line, year), 0, { year });
  }
  return line;
}

function placeButton() {
  return screen.getByRole("button", { name: /^Place it: / });
}

/** Place film `i` (0-based) right or wrong, then let the poster's animation end. */
async function place(i: number, right: boolean, container: HTMLElement) {
  const line = currentLine();
  const year = dailyFilmsFor(DAY)[i]!.year;
  const good = correctSlot(line, year);
  const bad = good === 0 ? line.length : 0;
  const slot = right ? good : bad;
  await seePoster();
  await movePosterTo(container, slot);
  // The button says where the film goes; its name adds the action.
  const where = slotLabel(line, slot, MESSAGES.en.placeAt);
  expect(placeButton().textContent).toBe(where);
  expect(placeButton().getAttribute("aria-label")).toBe(`Place it: ${where}`);
  await userEvent.click(placeButton());
  // Locked until the poster's result animation ends (the last film has no button left).
  const locked = screen.queryByRole("button", { name: /^Place it: / });
  expect(locked?.hasAttribute("disabled") ?? true).toBe(true);
  const swap = container.querySelector(".poster-swap");
  expect(swap).not.toBeNull();
  fireEvent.animationEnd(swap!);
  expect(container.querySelector(".poster-swap")).toBeNull();
}

it("starts from the day's starting year with two gaps", async () => {
  const { container } = renderIn("en", <DailyGame />);
  const year = anchorYearFor(DAY);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Daily Five");
  expect(container.textContent).toContain(`Your line starts at ${year}`);
  expect(container.querySelectorAll("[data-gap]")).toHaveLength(2);
  // No placing a film before its poster is on screen.
  const unseen = screen.getByRole("button", { name: "Loading the poster…" });
  expect(unseen).toHaveProperty("disabled", true);
  await seePoster();
  // The poster starts on a gap, so the button is ready to answer.
  expect(placeButton().textContent).toBe(`After ${year}`);
  expect(placeButton()).toHaveProperty("disabled", false);
  await movePosterTo(container, 0);
  expect(placeButton().textContent).toBe(`Before ${year}`);
  expect(screen.getByRole("button", { name: "Earlier" })).toHaveProperty("disabled", true);
  expect(screen.getByText("Film 1 of 5")).toBeTruthy();
});

it("plays a whole day, revealing each film and keeping score", async () => {
  const copied = fakeClipboard();
  const { container } = renderIn("en", <DailyGame />);
  const films = dailyFilmsFor(DAY);
  const right = [true, false, true, true, false];

  for (let i = 0; i < 4; i++) {
    await place(i, right[i]!, container);
    expect(container.textContent).toContain(right[i]! ? "✅ Correct!" : "❌ Not quite.");
    expect(container.textContent).toContain(`“${films[i]!.title}” came out in ${films[i]!.year}`);
  }
  await place(4, right[4]!, container);

  expect(container.textContent).toContain("3 / 5 placed right");
  expect(container.textContent).toContain("🟩🟥🟩🟩🟥");
  // Wrong films are shown red at their real spot, with no extra label.
  expect(container.querySelectorAll(".card-bad")).toHaveLength(2);
  expect(container.querySelector("[data-gap]")).toBeNull();
  expect(savedData().daily.stats.played).toBe(1);

  await userEvent.click(screen.getByRole("button", { name: "Share result" }));
  await vi.waitFor(() =>
    expect(copied).toEqual([`Filmdle Daily Five 3/5\n🟩🟥🟩🟩🟥\n${window.location.origin}/daily`]),
  );
  await screen.findByRole("button", { name: "Copied!" });
});

it("sends analytics events through the day, without film details", async () => {
  fakeClipboard();
  const { container } = renderIn("en", <DailyGame />);
  await seePoster();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{Escape}");
  for (let i = 0; i < 5; i++) {
    await place(i, i !== 1, container);
  }
  await userEvent.click(screen.getByRole("button", { name: "Share result" }));
  await vi.waitFor(() => expect(trackedEvents().at(-1)?.[0]).toBe("share"));

  const mode = "daily_five";
  expect(trackedEvents()).toEqual([
    ["game_open", { mode, status: "new" }],
    ["poster_zoom", { mode, turn: 1 }],
    ["film_place", { mode, turn: 1, correct: true }],
    ["film_place", { mode, turn: 2, correct: false }],
    ["film_place", { mode, turn: 3, correct: true }],
    ["film_place", { mode, turn: 4, correct: true }],
    ["film_place", { mode, turn: 5, correct: true }],
    ["game_complete", { mode, score: 4, total: 5, perfect: false }],
    ["share", { content_type: mode, method: "copied" }],
  ]);
  // Reopening a finished day says so.
  container.remove();
  renderIn("en", <DailyGame />);
  expect(trackedEvents().at(-1)).toEqual(["game_open", { mode, status: "done" }]);
});

it("tags the share text when the puzzle used one kind of film", async () => {
  window.localStorage.setItem(
    "filmdle:v1",
    JSON.stringify({ version: 1, settings: { filmLanguages: ["he"] } }),
  );
  const copied = fakeClipboard();
  const { container } = renderIn("he", <DailyGame />);
  const films = dailyFilmsFor(DAY, ["he"]);
  for (let i = 0; i < 5; i++) {
    const line = currentLine();
    const slot = correctSlot(line, films[i]!.year);
    await seePoster("he");
    await movePosterTo(container, slot, "he");
    await userEvent.click(screen.getByRole("button", { name: /^לשבץ/ }));
    fireEvent.animationEnd(container.querySelector(".poster-swap")!);
  }
  expect(container.textContent).toContain("מושלם! 🎉");
  await userEvent.click(screen.getByRole("button", { name: "שיתוף התוצאה" }));
  await vi.waitFor(() =>
    expect(copied).toEqual([
      `Filmdle החמישייה היומית 5/5 · רק סרטים ישראליים\n🟩🟩🟩🟩🟩\n${window.location.origin}/daily`,
    ]),
  );
  // Hebrew pages show Hebrew titles.
  expect(container.textContent).toContain(films[0]!.titleHe);
});

it("restores a day in progress", async () => {
  const first = renderIn("en", <DailyGame />);
  await place(0, true, first.container);
  first.unmount();
  const { container } = renderIn("en", <DailyGame />);
  expect(screen.getByText("Film 2 of 5")).toBeTruthy();
  expect(container.querySelectorAll("[data-gap]")).toHaveLength(3);
});

it("announces each result to screen readers", async () => {
  const { container } = renderIn("en", <DailyGame />);
  const status = () =>
    screen
      .getAllByRole("status")
      .map((el) => el.textContent)
      .join("|");
  await place(0, true, container);
  expect(status()).toContain("✅ Correct!");
  await place(1, false, container);
  expect(status()).toContain("❌ Not quite.");
});

it("moves the poster with the arrow keys, with nothing focused", async () => {
  const { container } = renderIn("en", <DailyGame />);
  const year = anchorYearFor(DAY);
  await seePoster();
  await userEvent.keyboard("{ArrowLeft}");
  expect(placeButton().textContent).toBe(`Before ${year}`);
  await userEvent.keyboard("{ArrowRight}");
  expect(placeButton().textContent).toBe(`After ${year}`);
  await userEvent.keyboard("{Home}");
  expect(posterGap(container)).toBe(0);
  await userEvent.keyboard("{End}");
  expect(posterGap(container)).toBe(1);
});

it("swaps the arrow keys on right-to-left pages", async ({ onTestFinished }) => {
  document.documentElement.dir = "rtl";
  onTestFinished(() => {
    document.documentElement.removeAttribute("dir");
  });
  const { container } = renderIn("he", <DailyGame />);
  await userEvent.keyboard("{Home}");
  await userEvent.keyboard("{ArrowLeft}");
  expect(posterGap(container)).toBe(1);
  await userEvent.keyboard("{ArrowRight}");
  expect(posterGap(container)).toBe(0);
});

it("leaves the browser's own arrow shortcuts alone", async () => {
  const { container } = renderIn("en", <DailyGame />);
  await userEvent.keyboard("{Home}");
  await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
  expect(posterGap(container)).toBe(0);
});

it("ignores the arrow keys while the answer is showing", async () => {
  const { container } = renderIn("en", <DailyGame />);
  await seePoster();
  await userEvent.click(placeButton());
  const before = posterGap(container);
  await userEvent.keyboard("{ArrowLeft}");
  await userEvent.keyboard("{ArrowRight}");
  expect(posterGap(container)).toBe(before);
  fireEvent.animationEnd(container.querySelector(".poster-swap")!);
});

it("shows where the film really went while the poster glows", async () => {
  const { container } = renderIn("en", <DailyGame />);
  const year = dailyFilmsFor(DAY)[0]!.year;
  const slot = correctSlot(currentLine(), year);
  await seePoster();
  await movePosterTo(container, slot === 0 ? 1 : 0);
  await userEvent.click(placeButton());
  // The answer sits beside the poster, and the choosing glow is gone.
  expect(container.querySelector(".swipe-gap-on")).toBeNull();
  expect(container.querySelector(".swipe-lit")).toBeNull();
  expect(container.querySelector(".card-bad")).not.toBeNull();
  fireEvent.animationEnd(container.querySelector(".poster-swap")!);
  expect(container.querySelector(".swipe-gap-on")).not.toBeNull();
});

it("never names the film before it is placed", async () => {
  const { container } = renderIn("en", <DailyGame />);
  const film = dailyFilmsFor(DAY)[0]!;
  await seePoster();
  // The poster is the only clue: no title anywhere, not even for screen readers.
  expect(container.textContent).not.toContain(film.title);
  const poster = container.querySelector<HTMLImageElement>(".poster-img")!;
  expect(poster.alt).toBe("");
  expect(screen.getByRole("button", { name: MESSAGES.en.common.posterLabel })).toBeTruthy();
  expect(document.body.innerHTML).not.toContain(film.title);
});

it("opens the poster full screen with a tap or Space, and closes it", async () => {
  renderIn("en", <DailyGame />);
  await seePoster();
  const zoomed = () => document.querySelector<HTMLDialogElement>("dialog.sheet-zoom")?.open;
  await userEvent.click(screen.getByRole("button", { name: MESSAGES.en.common.posterLabel }));
  expect(zoomed()).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(zoomed()).toBe(false);
  await userEvent.keyboard(" ");
  expect(zoomed()).toBe(true);
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(zoomed()).toBe(false));
});

it("tells all about a film once it's placed", async () => {
  const { container } = renderIn("en", <DailyGame />);
  const film = dailyFilmsFor(DAY)[0]!;
  await place(0, true, container);
  await userEvent.click(screen.getByRole("button", { name: "More about this film" }));
  const details = await screen.findByRole("dialog", { name: "More about this film" });
  expect(details.textContent).toContain(film.title);
  expect(details.textContent).toContain(`Released in ${film.year}`);
  await vi.waitFor(() => expect(details.textContent).toContain("The story of a test film."));
  expect(wikipediaRequests()).toEqual([`en:${film.wiki}`]);
  const link = screen.getByRole("link", { name: /Read more on Wikipedia/ });
  expect(link.getAttribute("href")).toBe(
    `https://en.wikipedia.org/wiki/${encodeURIComponent(film.wiki)}`,
  );
  await userEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();

  // Its card on the line opens the same details.
  await userEvent.click(
    screen.getByRole("button", { name: `${film.year} ${film.title} (details)` }),
  );
  expect((await screen.findByRole("dialog")).textContent).toContain(film.title);
});

it("still lets a film be placed when its poster can't load", async () => {
  const { container } = renderIn("en", <DailyGame />);
  await seePoster();
  // A fresh film whose poster fails, as a broken Wikimedia link would.
  fireEvent.error(container.querySelector(".poster-img")!);
  expect(container.textContent).toContain("This poster couldn't load.");
  expect(placeButton()).toHaveProperty("disabled", false);
});

it("has no accessibility violations, in both languages and when done", async () => {
  const en = renderIn("en", <DailyGame />);
  await seePoster();
  await expectAccessible(en.container);
  for (let i = 0; i < 5; i++) {
    await place(i, i % 2 === 0, en.container);
  }
  await expectAccessible(en.container);
  en.unmount();
  const he = renderIn("he", <DailyGame />);
  await expectAccessible(he.container);
});

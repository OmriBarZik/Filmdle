// Each move depends on the previous one, so the loops click one step at a time.
/* oxlint-disable no-await-in-loop */
import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { MarathonGame } from "@/components/marathon/MarathonGame";
import { marathonAnchorYearFor, marathonFilmsFor } from "@/lib/catalog/daily";
import { marathonRun } from "@/lib/games/marathonFree";
import { marathonCurrent, marathonLine } from "@/lib/games/marathonState";
import { gapToSlot, slotToGap, stackSizes } from "@/lib/line/stacks";
import { correctSlot, isSlotCorrect } from "@/lib/line/timeline";
import { expectAccessible } from "@/test/expectAccessible";
import { trackedEvents } from "@/test/fakes/fakeAnalytics";
import { fakeClipboard } from "@/test/fakes/fakeClipboard";
import { movePosterTo, seePoster } from "@/test/input/posterControls";
import { renderIn } from "@/test/renderIn";
import { savedData } from "@/test/savedData";
import { setupGameTests } from "@/test/setupGameTests";

setupGameTests();

const DAY = "2026-11-01";

function placeButton() {
  return screen.getByRole("button", { name: /^Place it: / });
}

/** Place the current film right or wrong, then let the poster's animation end. */
async function place(right: boolean, container: HTMLElement) {
  const { state } = marathonRun(savedData(), DAY)!;
  const film = marathonCurrent(DAY, state)!;
  const line = marathonLine(state);
  // The poster moves between gaps, and same-year films share one stack with no gap inside.
  const sizes = stackSizes(line);
  const good = slotToGap(sizes, correctSlot(line, film.year));
  const bad = [0, sizes.length].find((g) => !isSlotCorrect(line, gapToSlot(sizes, g), film.year))!;
  await seePoster();
  await movePosterTo(container, right ? good : bad);
  await userEvent.click(placeButton());
  fireEvent.animationEnd(container.querySelector(".poster-swap")!);
}

function hearts() {
  return screen.getByRole("img", { name: /hearts left$/ }).getAttribute("aria-label");
}

it("starts from the day's starting year with three hearts", async () => {
  const { container } = renderIn("en", <MarathonGame />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Marathon");
  expect(container.textContent).toContain(`Your line starts at ${marathonAnchorYearFor(DAY)}`);
  expect(hearts()).toBe("3 of 3 hearts left");
  expect(container.textContent).toContain("Score: 0");
  expect(screen.getByText("Film 1")).toBeTruthy();
  // The film can be placed once its poster is on screen.
  const unseen = screen.getByRole("button", { name: "Loading the poster…" });
  expect(unseen).toHaveProperty("disabled", true);
  await seePoster();
  expect(placeButton()).toHaveProperty("disabled", false);
});

it("plays until the third wrong answer, then shows and shares the score", async () => {
  const copied = fakeClipboard();
  const { container } = renderIn("en", <MarathonGame />);
  const films = marathonFilmsFor(DAY);
  const answers = [true, false, true, true, false];
  for (const [i, right] of answers.entries()) {
    await place(right, container);
    expect(container.textContent).toContain(right ? "✅ Correct!" : "❌ Not quite.");
    expect(container.textContent).toContain(`“${films[i]!.title}” came out in ${films[i]!.year}`);
  }
  expect(hearts()).toBe("1 of 3 hearts left");
  expect(container.textContent).toContain("You lost a heart.");
  expect(container.textContent).toContain("Score: 3");
  expect(screen.getByText("Film 6")).toBeTruthy();

  await place(false, container);
  expect(hearts()).toBe("0 of 3 hearts left");
  expect(container.textContent).toContain("Out of hearts!");
  expect(container.textContent).toContain("3 films placed right");
  expect(container.querySelector("[data-gap]")).toBeNull();
  expect(savedData().marathon.stats).toEqual({ played: 1, best: 3, totalHits: 3 });

  // Every film of the run is a poster card on the line that opens its details.
  const line = screen.getByRole("group", { name: /^Your timeline/ });
  for (const film of films.slice(0, 6)) {
    expect(line.textContent).toContain(film.title);
    const card = screen.getByRole("button", { name: `${film.year} ${film.title} (details)` });
    expect(card.querySelector("img")?.getAttribute("src")).toBe(film.poster);
  }
  // Earlier / Later step through the cards freely.
  line.scrollLeft = 0;
  await userEvent.click(screen.getByRole("button", { name: "Later" }));
  await vi.waitFor(() => expect(line.scrollLeft).toBeGreaterThan(100));
  const after = line.scrollLeft;
  await userEvent.click(screen.getByRole("button", { name: "Earlier" }));
  await vi.waitFor(() => expect(line.scrollLeft).toBeLessThan(after));

  await userEvent.click(screen.getByRole("button", { name: "Share result" }));
  await vi.waitFor(() =>
    expect(copied).toEqual([
      `Filmdle Marathon · 3 🎬\n🟩🟥🟩🟩🟥🟥\n${window.location.origin}/marathon`,
    ]),
  );
});

it("sends analytics events, without film details", async () => {
  const { container } = renderIn("en", <MarathonGame />);
  for (const right of [true, false, false, false]) {
    await place(right, container);
  }
  const mode = "marathon";
  expect(trackedEvents()).toEqual([
    ["game_open", { mode, status: "new" }],
    ["film_place", { mode, turn: 1, correct: true }],
    ["film_place", { mode, turn: 2, correct: false }],
    ["film_place", { mode, turn: 3, correct: false }],
    ["film_place", { mode, turn: 4, correct: false }],
    ["game_complete", { mode, score: 1, free_play: false }],
  ]);
  container.remove();
  renderIn("en", <MarathonGame />);
  expect(trackedEvents().at(-1)).toEqual(["game_open", { mode, status: "done" }]);
});

it("plays again after the day's run, as free play that doesn't count", async () => {
  const copied = fakeClipboard();
  const { container } = renderIn("en", <MarathonGame />);
  for (const right of [false, false, false]) {
    await place(right, container);
  }
  const stats = savedData().marathon.stats;
  await userEvent.click(screen.getByRole("button", { name: "Play again" }));
  expect(container.textContent).toContain("Free play, just for fun");
  expect(hearts()).toBe("3 of 3 hearts left");
  expect(screen.getByText("Film 1")).toBeTruthy();
  expect(savedData().marathon.free?.day).toBe(DAY);

  for (const right of [true, false, false, false]) {
    await place(right, container);
  }
  expect(container.textContent).toContain("1 film placed right");
  expect(savedData().marathon.stats).toEqual(stats);
  expect(savedData().marathon.days[DAY]!.placements).toHaveLength(3);
  await userEvent.click(screen.getByRole("button", { name: "Challenge a friend" }));
  const seed = savedData().marathon.free!.seed;
  await vi.waitFor(() =>
    expect(copied).toEqual([
      `Filmdle Marathon · Free play · 1 🎬\n🟩🟥🟥🟥\nSame films. Can you beat my 1? 🎯\n${window.location.origin}/marathon?run=${seed}`,
    ]),
  );
  expect(trackedEvents()).toContainEqual(["play_again", { mode: "marathon" }]);
  expect(trackedEvents()).toContainEqual([
    "game_complete",
    { mode: "marathon", score: 1, free_play: true },
  ]);
  await expectAccessible(container);

  // Again and again: each run starts fresh.
  await userEvent.click(screen.getByRole("button", { name: "Play again" }));
  expect(hearts()).toBe("3 of 3 hearts left");
  expect(container.textContent).toContain("Score: 0");
});

it("opens a friend's challenge link: the same films, from the seed alone", async () => {
  const seed = "friend1234";
  window.history.replaceState(null, "", `/en/marathon?run=${seed}`);
  const { container } = renderIn("en", <MarathonGame />);
  expect(container.textContent).toContain("Challenge: a friend sent you the films they played");
  expect(savedData().marathon.free).toMatchObject({ seed, shared: true, placements: [] });
  // The link is used up, so a reload after "Play again" won't bring it back.
  expect(window.location.search).toBe("");
  expect(trackedEvents()).toContainEqual(["challenge_open", { mode: "marathon" }]);

  for (const right of [true, true, false, false, false]) {
    await place(right, container);
  }
  expect(container.textContent).toContain("2 films placed right");
  await expectAccessible(container);
  // The day's own run is still waiting.
  expect(savedData().marathon.days[DAY]!.placements).toEqual([]);
  await userEvent.click(screen.getByRole("button", { name: "Play today's marathon" }));
  expect(container.textContent).toContain(`Your line starts at ${marathonAnchorYearFor(DAY)}`);
  expect(hearts()).toBe("3 of 3 hearts left");
});

it("restores a run in progress", async () => {
  const first = renderIn("en", <MarathonGame />);
  await place(false, first.container);
  first.unmount();
  const { container } = renderIn("en", <MarathonGame />);
  expect(hearts()).toBe("2 of 3 hearts left");
  expect(screen.getByText("Film 2")).toBeTruthy();
  expect(container.querySelectorAll("[data-gap]")).toHaveLength(3);
});

it("offers a different film when the poster can't load", async () => {
  const { container } = renderIn("en", <MarathonGame />);
  const [first, second] = marathonFilmsFor(DAY);
  await seePoster();
  fireEvent.error(container.querySelector(".poster-img")!);
  expect(container.textContent).toContain("This poster couldn't load.");
  await userEvent.click(screen.getByRole("button", { name: "Give me a different film" }));
  const state = savedData().marathon.days[DAY]!;
  expect(state.skipped).toEqual([first!.id]);
  expect(marathonCurrent(DAY, state)?.id).toBe(second!.id);
  expect(hearts()).toBe("3 of 3 hearts left");
  expect(trackedEvents().at(-1)).toEqual(["film_skip", { mode: "marathon" }]);
});

it("has no accessibility violations, in both languages and when done", async () => {
  const en = renderIn("en", <MarathonGame />);
  await seePoster();
  await expectAccessible(en.container);
  for (const right of [true, false, false, false]) {
    await place(right, en.container);
  }
  await expectAccessible(en.container);
  en.unmount();
  const he = renderIn("he", <MarathonGame />);
  await expectAccessible(he.container);
});

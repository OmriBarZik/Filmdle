import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { DailyGame } from "@/components/daily/DailyGame";
import { KeyHints } from "@/components/game/KeyHints";
import { MarathonGame } from "@/components/marathon/MarathonGame";
import type { Locale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";
import { trackedEvents } from "@/test/fakes/fakeAnalytics";
import { lineTrack, placeWithEnter, posterGap, seePoster } from "@/test/input/posterControls";
import { renderIn } from "@/test/renderIn";
import { savedData } from "@/test/savedData";
import { setupGameTests } from "@/test/setupGameTests";

// Arrow keys, Home and End are covered in DailyGame.test.tsx.
setupGameTests();

const DAY = "2026-11-01";

function dailyPlaced() {
  return savedData().daily.days[DAY]?.placements.length ?? 0;
}

const zoomed = () => document.querySelector<HTMLDialogElement>("dialog.sheet-zoom")?.open ?? false;

it("opens the poster full screen with Space, with nothing focused", async () => {
  renderIn("en", <DailyGame />);
  await seePoster();
  const poster = screen.getByRole("button", { name: MESSAGES.en.common.posterLabel });
  expect(poster.getAttribute("aria-keyshortcuts")).toBe("Space");
  await userEvent.keyboard(" ");
  expect(zoomed()).toBe(true);
  expect(trackedEvents().map(([name]) => name)).toContain("poster_zoom");
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(zoomed()).toBe(false));
});

it("opens the poster with Space while the line has the focus", async () => {
  const { container } = renderIn("en", <DailyGame />);
  await seePoster();
  lineTrack(container).focus();
  await userEvent.keyboard(" ");
  expect(zoomed()).toBe(true);
});

it("places with Enter, and not again while the answer shows", async () => {
  const { container } = renderIn("en", <DailyGame />);
  await seePoster();
  const place = screen.getByRole("button", { name: /^Place it: / });
  expect(place.getAttribute("aria-keyshortcuts")).toBe("Enter");
  await userEvent.keyboard("{Enter}");
  expect(dailyPlaced()).toBe(1);
  await userEvent.keyboard("{Enter}");
  expect(dailyPlaced()).toBe(1);
  // Nor does Space open the glowing poster.
  await userEvent.keyboard(" ");
  expect(zoomed()).toBe(false);
  fireEvent.animationEnd(container.querySelector(".poster-swap")!);
  await seePoster();
  await userEvent.keyboard("{Enter}");
  expect(dailyPlaced()).toBe(2);
});

it("places at the gap the arrow keys chose", async () => {
  renderIn("en", <DailyGame />);
  await seePoster();
  await userEvent.keyboard("{Home}");
  await userEvent.keyboard("{Enter}");
  expect(savedData().daily.days[DAY]?.placements[0]?.slot).toBe(0);
});

it("leaves Space to a focused button", async () => {
  const { container } = renderIn("en", <DailyGame />);
  await seePoster();
  await userEvent.keyboard("{End}");
  screen.getByRole("button", { name: "Earlier" }).focus();
  await userEvent.keyboard(" ");
  expect(posterGap(container)).toBe(0);
  expect(zoomed()).toBe(false);
});

it("never gives Enter to another button", async () => {
  const { container } = renderIn("en", <DailyGame />);
  await seePoster();
  await userEvent.keyboard("{End}");
  screen.getByRole("button", { name: "Earlier" }).focus();
  await userEvent.keyboard("{Enter}");
  // Placed at the poster's gap; Earlier didn't move it first.
  expect(savedData().daily.days[DAY]?.placements[0]?.slot).toBe(1);
  expect(posterGap(container)).toBe(1);
});

it("places with Enter while the poster button has the focus", async () => {
  renderIn("en", <DailyGame />);
  await seePoster();
  screen.getByRole("button", { name: MESSAGES.en.common.posterLabel }).focus();
  await userEvent.keyboard("{Enter}");
  expect(dailyPlaced()).toBe(1);
  expect(zoomed()).toBe(false);
});

it.for([{ name: "Control" }, { name: "Shift" }, { name: "Alt" }, { name: "Meta" }])(
  "leaves $name with Enter or Space to the browser",
  async ({ name: key }) => {
    renderIn("en", <DailyGame />);
    await seePoster();
    await userEvent.keyboard(`{${key}>}{Enter}{/${key}}`);
    await userEvent.keyboard(`{${key}>} {/${key}}`);
    expect(dailyPlaced()).toBe(0);
    expect(zoomed()).toBe(false);
  },
);

it("has no shortcuts once the day is done", async () => {
  const { container } = renderIn("en", <DailyGame />);
  await placeWithEnter(container, 5);
  expect(dailyPlaced()).toBe(5);
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{Enter}");
  expect(dailyPlaced()).toBe(5);
  expect(screen.queryByRole("button", { name: /^Place it: / })).toBeNull();
});

it("opens the poster with Space and places with Enter in the Marathon", async () => {
  renderIn("en", <MarathonGame />);
  await seePoster();
  await userEvent.keyboard(" ");
  expect(zoomed()).toBe(true);
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() => expect(zoomed()).toBe(false));
  await userEvent.keyboard("{Enter}");
  expect(savedData().marathon.days[DAY]?.placements).toHaveLength(1);
});

it.for<{ name: Locale }>([{ name: "en" }, { name: "he" }])(
  "lists the keys under the place button ($name)",
  ({ name }) => {
    const { container } = renderIn(name, <KeyHints />);
    const { keys } = MESSAGES[name].common;
    const hints = container.querySelector(".key-hints")!;
    for (const text of [keys.space, keys.enter, keys.move, keys.zoom, keys.place]) {
      expect(hints.textContent).toContain(text);
    }
    // Shown with a mouse or trackpad, as in this browser.
    expect(getComputedStyle(hints).display).toBe("flex");
  },
);

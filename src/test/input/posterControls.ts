import { fireEvent, screen } from "@testing-library/react";
import { expect } from "vitest";
import { userEvent } from "vitest/browser";
import type { Locale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";

/** The gap the poster is on, read from the line's overview bar. */
export function posterGap(container: HTMLElement): number {
  return [...container.querySelectorAll(".swipe-map-gap")].findIndex((g) =>
    g.classList.contains("swipe-map-on"),
  );
}

/** Moves the poster to gap `slot` with the Earlier / Later buttons. */
export async function movePosterTo(container: HTMLElement, slot: number, lang: Locale = "en") {
  const { earlier, later } = MESSAGES[lang].common;
  for (let step = 0; posterGap(container) !== slot; step++) {
    if (step > 50) {
      throw new Error(`The poster never reached gap ${slot}`);
    }
    const name = posterGap(container) < slot ? later : earlier;
    // Each step depends on the one before.
    // oxlint-disable-next-line no-await-in-loop
    await userEvent.click(screen.getByRole("button", { name }));
  }
}

/** The line's scrolling strip. */
export function lineTrack(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>(".swipe-track")!;
}

/** A point on an element, `fx` and `fy` of the way across it (clientX / clientY). */
export function pointOn(el: Element, fx: number, fy: number): [x: number, y: number] {
  const r = el.getBoundingClientRect();
  return [r.left + r.width * fx, r.top + r.height * fy];
}

/**
 * Waits for the current film's poster to load: a film can't be placed before its poster
 * has been seen.
 */
export async function seePoster(lang: Locale = "en") {
  const { waitForPoster } = MESSAGES[lang].common;
  await expect.poll(() => screen.queryByText(waitForPoster)).toBeNull();
}

/**
 * Places `n` films with Enter, wherever the poster is, letting each poster's animation
 * end.
 */
export async function placeWithEnter(container: HTMLElement, n: number) {
  for (let i = 0; i < n; i++) {
    // Each placement waits for the one before.
    // oxlint-disable-next-line no-await-in-loop
    await seePoster();
    // oxlint-disable-next-line no-await-in-loop
    await userEvent.keyboard("{Enter}");
    fireEvent.animationEnd(container.querySelector(".poster-swap")!);
  }
}

/** Presses and releases a pointer at a point, without moving it (a tap or a click). */
export function tapAt(target: Element, [x, y]: [number, number], pointerType: "mouse" | "touch") {
  const init = { pointerType, pointerId: 1, button: 0, clientX: x, clientY: y, bubbles: true };
  target.dispatchEvent(new PointerEvent("pointerdown", init));
  target.dispatchEvent(new PointerEvent("pointerup", init));
}

/** Turns the wheel over the line; returns whether the game took the event. */
export function wheelOn(target: Element, init: WheelEventInit): boolean {
  const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

/**
 * The gap in the middle of the strip, under the poster, and whether the strip has come
 * to rest with that gap centred under it.
 */
export function gapUnderPoster(container: HTMLElement): { gap: number; centred: boolean } {
  const box = lineTrack(container).getBoundingClientRect();
  const middle = box.left + box.width / 2;
  let best = { gap: -1, off: Infinity };
  for (const el of container.querySelectorAll("[data-gap]")) {
    const r = el.getBoundingClientRect();
    const off = Math.abs(r.left + r.width / 2 - middle);
    if (off < best.off) {
      best = { gap: Number(el.getAttribute("data-gap")), off };
    }
  }
  // A glide redirected mid-way (Home, then an arrow key at once) can stop a pixel or two short.
  return { gap: best.gap, centred: best.off <= 2 };
}

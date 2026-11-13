import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import type { MarathonDay, MarathonFreeRun, DailyDay } from "@/lib/save/saveData";
import { dailyHits } from "./dailyState";
import { challengePath } from "./marathonFree";
import { marathonHits } from "./marathonState";

/** Shares through the phone's share sheet, or copies to the clipboard elsewhere. */
export async function shareOrCopy(text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (
      typeof navigator.share === "function" &&
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    ) {
      await navigator.share({ text });
      return "shared";
    }
  } catch {
    // fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/** " · Israeli films only" when a puzzle came from one kind of film, since it differs. */
function onlyTag(t: Messages, langs: readonly Locale[] | undefined): string {
  const [only] = langs ?? [];
  return langs?.length === 1 && only ? ` · ${t.settings.shareTag[only]}` : "";
}

const lines = (...parts: string[]) => parts.join("\n");

// Share links point at the game itself (`/daily`, `/marathon`) without a language prefix,
// so the proxy sends each friend to it in their own language.

/** Daily Five share text: head, one square per film, link to the game. */
export function dailyShareText(t: Messages, dailyDay: DailyDay, origin: string): string {
  const head = t.daily.shareHead(dailyHits(dailyDay.placements), dailyDay.filmIds.length);
  return lines(`${head}${onlyTag(t, dailyDay.languages)}`, dailyEmoji(dailyDay), `${origin}/daily`);
}

export function dailyEmoji(dailyDay: DailyDay): string {
  return dailyDay.placements.map((p) => (p.correct ? "🟩" : "🟥")).join("");
}

const SQUARES_PER_ROW = 10;

/** One square per film, ten a row. */
function squareRows(marathonDay: MarathonDay): string[] {
  const squares = marathonDay.placements.map((p) => (p.correct ? "🟩" : "🟥"));
  return Array.from({ length: Math.ceil(squares.length / SQUARES_PER_ROW) }, (_, i) =>
    squares.slice(i * SQUARES_PER_ROW, (i + 1) * SQUARES_PER_ROW).join(""),
  );
}

/**
 * Marathon share text: head with the score, one square per film (ten a row), link. Free play
 * isn't the day's puzzle, so it says so and dares friends to beat the score on the same films:
 * its link carries only the run's seed (and its film languages).
 */
export function marathonShareText(
  t: Messages,
  marathonDay: MarathonDay | MarathonFreeRun,
  origin: string,
): string {
  const hits = marathonHits(marathonDay);
  const tag = onlyTag(t, marathonDay.languages);
  if ("seed" in marathonDay) {
    return lines(
      `${t.marathon.freeShareHead(hits)}${tag}`,
      ...squareRows(marathonDay),
      t.marathon.shareDare(hits),
      `${origin}${challengePath(marathonDay)}`,
    );
  }
  const head = t.marathon.shareHead(hits);
  return lines(`${head}${tag}`, ...squareRows(marathonDay), `${origin}/marathon`);
}

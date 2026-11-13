"use client";

import type { ReactNode } from "react";
import { DailyFeedback } from "@/components/daily/DailyFeedback";
import { DailyFeedbackBox } from "@/components/daily/DailyFeedbackBox";
import { DailyHeader } from "@/components/daily/DailyHeader";
import { DailyResult } from "@/components/daily/DailyResult";
import { FilmDetails } from "@/components/film/FilmDetails";
import { Announce } from "@/components/game/Announce";
import { KeyHints } from "@/components/game/KeyHints";
import { PlaceButton } from "@/components/game/PlaceButton";
import { ScreenMain } from "@/components/game/ScreenMain";
import { Poster } from "@/components/poster/Poster";
import { SwipeLine } from "@/components/swipe/SwipeLine";
import { useGameScreen } from "@/hooks/game/useGameScreen";
import { useI18n } from "@/i18n/I18nProvider";
import type { Messages } from "@/i18n/messages";
import {
  ensureDailyDay,
  placeDailyFilm,
  dailyLineItems,
  dailyOpenEvent,
  dailyView,
} from "@/lib/games/dailyState";
import { isSlotCorrect, recordSlot } from "@/lib/line/timeline";
import { track } from "@/lib/services/analytics";

function dailyScoreText(t: Messages, hits: number, total: number) {
  return hits === total ? t.daily.perfect : t.daily.score(hits, total);
}

/**
 * Daily Five: start from a single year, then place five film posters one at a time.
 */
export function DailyGame() {
  const { t } = useI18n();
  const { day, data, update, slot, setSlot, live, swap, setSwap, seen, setSeen } = useGameScreen(
    ensureDailyDay,
    dailyOpenEvent,
  );
  // `ensureDailyDay` always prepares today, so this is only a type guard.
  const state = data.daily.days[day];
  if (!state) {
    return null;
  }

  const { done, line, turn, total, current, next, last, lastCorrect, hits, lastAt } =
    dailyView(state);
  const feedback = last && !done ? <DailyFeedback film={last} correct={lastCorrect} /> : null;
  const score = dailyScoreText(t, hits, total);
  const items = dailyLineItems(line);
  // While the poster glows, the line holds still with the film just placed beside it,
  // so the player sees where it landed.
  const placing = !done || Boolean(swap);
  const at = recordSlot(Boolean(swap), lastAt, slot, line.length);

  const place = (where: number) => {
    if (!current || swap) {
      return;
    }
    const correct = isSlotCorrect(line, where, current.year);
    const lastFilm = turn + 1 === total;
    setSwap({ correct, kind: lastFilm ? "last" : "next", film: current });
    track("film_place", { mode: "daily_five", turn: turn + 1, correct });
    if (lastFilm) {
      const final = hits + (correct ? 1 : 0);
      track("game_complete", {
        mode: "daily_five",
        score: final,
        total,
        perfect: final === total,
      });
    }
    update((d) => placeDailyFilm(d, day, where));
    setSlot(null);
  };

  const swipeLine = (poster?: ReactNode) => (
    <SwipeLine
      items={items}
      slot={placing ? at : null}
      onSlot={setSlot}
      focus={Math.max(0, lastAt)}
      poster={poster}
      live={live}
      reveal={Boolean(swap)}
    />
  );

  return (
    <ScreenMain game="daily">
      <DailyHeader state={state} />

      <Announce>{done ? score : feedback}</Announce>
      <DailyFeedbackBox correct={lastCorrect} filmId={last?.id}>
        {feedback}
      </DailyFeedbackBox>

      {!done || swap ? (
        <Poster
          film={current}
          next={next}
          seen={seen}
          onSeen={setSeen}
          label={done ? undefined : t.daily.deckLabel(turn + 1, total)}
          swap={swap}
          onSwapEnd={() => setSwap(null)}
          onZoom={() => track("poster_zoom", { mode: "daily_five", turn: turn + 1 })}
          around={swipeLine}
        />
      ) : (
        swipeLine()
      )}

      {done ? (
        <DailyResult state={state} stats={data.daily.stats} score={score} />
      ) : (
        <>
          <PlaceButton
            live={live}
            cards={line}
            slot={at}
            disabled={Boolean(swap)}
            seen={seen?.id === current?.id}
            onPlace={place}
          />
          <KeyHints />
        </>
      )}
      <FilmDetails />
    </ScreenMain>
  );
}

"use client";

import type { ReactNode } from "react";
import { DailyFeedbackBox } from "@/components/daily/DailyFeedbackBox";
import { FilmDetails } from "@/components/film/FilmDetails";
import { Announce } from "@/components/game/Announce";
import { KeyHints } from "@/components/game/KeyHints";
import { PlaceButton } from "@/components/game/PlaceButton";
import { ScreenMain } from "@/components/game/ScreenMain";
import { MarathonFeedback } from "@/components/marathon/MarathonFeedback";
import { MarathonHeader } from "@/components/marathon/MarathonHeader";
import { MarathonResult } from "@/components/marathon/MarathonResult";
import { Poster } from "@/components/poster/Poster";
import { SwipeLine } from "@/components/swipe/SwipeLine";
import { useMarathonScreen } from "@/hooks/game/useMarathonScreen";
import { useI18n } from "@/i18n/I18nProvider";
import { dailyLineItems } from "@/lib/games/dailyState";
import {
  leaveFreeMarathon,
  marathonRun,
  newFreeSeed,
  placeMarathon,
  skipMarathon,
  startFreeMarathon,
} from "@/lib/games/marathonFree";
import { marathonEndText, marathonOutcome, marathonView } from "@/lib/games/marathonState";
import { recordSlot } from "@/lib/line/timeline";
import { track } from "@/lib/services/analytics";

/**
 * Marathon: place film posters on one growing line for as long as you can. Each wrong
 * placement costs a heart; when the last one goes, the day's score is final. After that,
 * "Play again" starts free-play runs with their own films, which don't count.
 */
export function MarathonGame() {
  const { t } = useI18n();
  const { day, data, update, slot, setSlot, live, swap, setSwap, seen, setSeen } =
    useMarathonScreen();
  // The screen always prepares today, so this is only a type guard.
  const run = marathonRun(data, day);
  if (!run) {
    return null;
  }
  const { state, daily } = run;
  const free = daily !== null;

  const { done, line, turn, current, next, last, lastCorrect, hits, hearts, lastAt } = marathonView(
    day,
    state,
  );
  const feedback = last && !done ? <MarathonFeedback film={last} correct={lastCorrect} /> : null;
  const { title, score } = marathonEndText(t, hearts, hits);
  const items = dailyLineItems(line);
  // While the poster glows, the line holds still with the film just placed beside it.
  const placing = !done || Boolean(swap);
  const at = recordSlot(Boolean(swap), lastAt, slot, line.length);

  const place = (where: number) => {
    if (!current || swap) {
      return;
    }
    const { correct, ends, score: final } = marathonOutcome(day, state, where);
    setSwap({ correct, kind: ends ? "last" : "next", film: current });
    track("film_place", { mode: "marathon", turn: turn + 1, correct });
    if (ends) {
      track("game_complete", { mode: "marathon", score: final, free_play: free });
    }
    update((d) => placeMarathon(d, day, where));
    setSlot(null);
  };

  const playAgain = () => {
    const seed = newFreeSeed();
    update((d) => startFreeMarathon(d, day, seed));
    setSlot(null);
    track("play_again", { mode: "marathon" });
    window.scrollTo({ top: 0 });
  };

  const playDaily = () => {
    update(leaveFreeMarathon);
    setSlot(null);
    window.scrollTo({ top: 0 });
  };

  const skip = () => {
    update((d) => skipMarathon(d, day));
    track("film_skip", { mode: "marathon" });
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
      browse
    />
  );

  return (
    <ScreenMain game="marathon">
      <MarathonHeader run={state} hearts={hearts} hits={hits} />

      <Announce>
        {done ? (
          <>
            {title} {score}
          </>
        ) : (
          feedback
        )}
      </Announce>
      <DailyFeedbackBox correct={lastCorrect} filmId={last?.id}>
        {feedback}
      </DailyFeedbackBox>

      {!done || swap ? (
        <Poster
          film={current}
          next={next}
          seen={seen}
          onSeen={setSeen}
          label={done ? undefined : t.marathon.deckLabel(turn + 1)}
          onSkip={done ? undefined : skip}
          swap={swap}
          onSwapEnd={() => setSwap(null)}
          onZoom={() => track("poster_zoom", { mode: "marathon", turn: turn + 1 })}
          around={swipeLine}
        />
      ) : (
        swipeLine()
      )}

      {done ? (
        <MarathonResult
          run={run}
          stats={data.marathon.stats}
          title={title}
          score={score}
          hits={hits}
          onPlayAgain={playAgain}
          onPlayDaily={playDaily}
        />
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

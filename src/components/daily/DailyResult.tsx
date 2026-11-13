"use client";

import { ResultCard } from "@/components/result/ResultCard";
import { ShareButton } from "@/components/result/ShareButton";
import { Stats } from "@/components/result/Stats";
import { useI18n } from "@/i18n/I18nProvider";
import { dailyEmoji, dailyShareText } from "@/lib/games/share";
import type { DailyDay, DailyStats } from "@/lib/save/saveData";

/** The finished day: score, stats and share. */
export function DailyResult({
  state,
  stats,
  score,
}: {
  state: DailyDay;
  stats: DailyStats;
  score: string;
}) {
  const { t } = useI18n();
  return (
    <ResultCard>
      <div className="text-3xl font-bold">{score}</div>
      {/* The score above says the same for screen readers. */}
      <div dir="ltr" aria-hidden className="text-2xl tracking-wider">
        {dailyEmoji(state)}
      </div>
      <Stats
        items={[
          [t.daily.stats.played, stats.played],
          [t.daily.stats.perfect, stats.perfect],
          [t.daily.stats.streak, stats.streak],
          [t.daily.stats.bestStreak, stats.maxStreak],
        ]}
      />
      <ShareButton mode="daily_five" text={dailyShareText(t, state, window.location.origin)} />
      <p className="text-sm text-muted">{t.daily.tomorrow}</p>
    </ResultCard>
  );
}

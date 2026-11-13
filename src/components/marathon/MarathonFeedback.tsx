"use client";

import { DailyFeedback } from "@/components/daily/DailyFeedback";
import { useI18n } from "@/i18n/I18nProvider";
import type { Film } from "@/lib/catalog/films";

/** How the last placement went, which film it was, and the heart it cost if wrong. */
export function MarathonFeedback({ film, correct }: { film: Film; correct: boolean }) {
  const { t } = useI18n();
  return (
    <>
      <DailyFeedback film={film} correct={correct} />
      {correct ? null : ` ${t.marathon.lostHeart}`}
    </>
  );
}

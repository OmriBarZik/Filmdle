"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { type Film, filmTitle } from "@/lib/catalog/films";

/** How the last placement went, and which film it was. */
export function DailyFeedback({ film, correct }: { film: Film; correct: boolean }) {
  const { lang, t } = useI18n();
  return (
    <>
      {correct ? t.daily.correct : t.daily.wrong} {t.daily.reveal(filmTitle(film, lang), film.year)}
    </>
  );
}

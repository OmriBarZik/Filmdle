"use client";

import type { FilmSummaryState } from "@/hooks/game/useFilmSummary";
import { useI18n } from "@/i18n/I18nProvider";

/** Wikipedia's opening paragraph about the film, or why it isn't there. */
export function SummaryText({ summary }: { summary: FilmSummaryState }) {
  const { t } = useI18n();
  if (summary.status === "loading") {
    return <p className="text-sm text-muted">{t.info.loading}</p>;
  }
  if (summary.status === "failed" || !summary.summary.extract) {
    return <p className="text-sm text-muted">{t.info.failed}</p>;
  }
  return (
    <p dir="auto" className="text-start text-sm leading-300">
      {summary.summary.extract}
    </p>
  );
}

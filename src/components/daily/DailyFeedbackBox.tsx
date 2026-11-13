"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { openFilmDetails } from "@/lib/display/filmDetails";

/** The last placement's result, with a way into the film's details (none before the first). */
export function DailyFeedbackBox({
  correct,
  filmId,
  children,
}: {
  correct: boolean;
  filmId: string | undefined;
  children: ReactNode;
}) {
  const { t } = useI18n();
  if (!filmId || !children) {
    return null;
  }
  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-page rounded-control px-150 py-100 text-center text-sm",
        correct ? "bg-success/15 text-success-ink" : "bg-danger/15 text-danger-ink",
      )}
    >
      {children}{" "}
      <button
        type="button"
        className="font-bold whitespace-nowrap underline underline-offset-2"
        onClick={() => openFilmDetails(filmId)}
      >
        {t.info.more}
      </button>
    </div>
  );
}

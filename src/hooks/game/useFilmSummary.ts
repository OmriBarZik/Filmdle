"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { type FilmSummary, fetchFilmSummary } from "@/lib/services/wikipedia";

type SummaryState =
  | { key: string; status: "ready"; summary: FilmSummary }
  | { key: string; status: "failed" };

/** A summary on its way, arrived, or failed. */
export type FilmSummaryState = { status: "loading" } | SummaryState;

/** The Wikipedia summary of a page, once it arrives; `null` while loading. */
export function useFilmSummary(lang: Locale, page: string): FilmSummaryState {
  const key = `${lang}:${page}`;
  const [state, setState] = useState<SummaryState | null>(null);
  useEffect(() => {
    let live = true;
    void fetchFilmSummary(lang, page).then(
      (summary) => live && setState({ key, status: "ready", summary }),
      () => live && setState({ key, status: "failed" }),
    );
    return () => {
      live = false;
    };
  }, [key, lang, page]);
  return state?.key === key ? state : { status: "loading" };
}

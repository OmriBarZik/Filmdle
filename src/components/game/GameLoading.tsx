"use client";

import { useI18n } from "@/i18n/I18nProvider";

/** Shown while a screen's code loads. */
export function GameLoading() {
  const { t } = useI18n();
  return <p className="p-400 text-center text-muted">{t.common.loadingGame}</p>;
}

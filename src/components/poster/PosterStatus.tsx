"use client";

import { useI18n } from "@/i18n/I18nProvider";

/** Under the poster: which film this is, or why its poster can't be shown. Fixed height, so nothing jumps. */
export function PosterStatus({
  status,
  label,
  onSkip,
}: {
  status: "loading" | "loaded" | "failed";
  label?: string;
  onSkip?: () => void;
}) {
  const { t } = useI18n();
  if (status !== "failed") {
    return (
      <p
        role="status"
        aria-live="polite"
        className="h-250 text-xs leading-250 font-bold tracking-widest text-muted uppercase rtl:tracking-normal"
      >
        {label}
      </p>
    );
  }
  return (
    <div className="max-w-narrow text-center text-sm text-warning-ink">
      {t.common.posterFailed}
      {onSkip ? (
        <button type="button" onClick={onSkip} className="ms-100 underline">
          {t.common.differentFilm}
        </button>
      ) : null}
    </div>
  );
}

"use client";

import { clsx } from "clsx";
import { useI18n } from "@/i18n/I18nProvider";

/** The ✕ in a sheet's corner. */
export function CloseButton({ onClose, className }: { onClose: () => void; className?: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={t.info.close}
      className={clsx(
        "grid size-500 place-items-center rounded-full bg-scrim text-lg text-on-scrim",
        className,
      )}
    >
      <span aria-hidden>✕</span>
    </button>
  );
}

"use client";

import { clsx } from "clsx";
import { SwipeCardPoster } from "@/components/swipe/card/SwipeCardPoster";
import { useI18n } from "@/i18n/I18nProvider";
import type { LineItem } from "@/lib/line/timeline";

/** The class that colours a card: answered right or wrong, or the starting year. */
function cardVariant(item: LineItem): string {
  return item.film
    ? { plain: "", good: "card-good", bad: "card-bad" }[item.variant ?? "plain"]
    : "card-anchor";
}

/** A card's face: a placed film's poster, or the starting year. */
export function SwipeCardFace({ item, className }: { item: LineItem; className?: string }) {
  const { t } = useI18n();
  if (item.film) {
    return (
      <SwipeCardPoster
        film={item.film}
        note={item.note}
        className={clsx(cardVariant(item), className)}
      />
    );
  }
  return (
    <div className={clsx("card swipe-card justify-center", cardVariant(item), className)}>
      <span className="text-2xl leading-none font-black tabular-nums lg:text-3xl">{item.year}</span>
      <span className="text-sm text-muted lg:text-base">{t.common.startingYear}</span>
      {item.note ? <span className="swipe-note text-xs font-semibold">{item.note}</span> : null}
    </div>
  );
}

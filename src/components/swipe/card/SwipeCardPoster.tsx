"use client";

import { clsx } from "clsx";
import { useI18n } from "@/i18n/I18nProvider";
import { type Film, filmTitle } from "@/lib/catalog/films";
import { openFilmDetails } from "@/lib/display/filmDetails";

/**
 * A placed film on the line: its poster, with its year and title on top. It is a
 * button that opens the film's details (its name is what it shows, plus "details").
 */
export function SwipeCardPoster({
  film,
  note,
  className,
}: {
  film: Film;
  note?: string;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const title = filmTitle(film, lang);
  return (
    <button
      type="button"
      className={clsx("card swipe-card swipe-film", className)}
      onClick={() => openFilmDetails(film.id)}
    >
      {/* Hot-linked from Wikimedia, which serves its own sizes: next/image can't help. */}
      {/* oxlint-disable-next-line nextjs/no-img-element */}
      <img
        src={film.poster}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        draggable={false}
        className="swipe-film-img"
      />
      <span className="swipe-film-year">
        {film.year}
      </span>
      {note ? <span className="swipe-note text-xs font-semibold">{note}</span> : null}
      {/* Its own direction (dir="auto"), so a long English name is cut at its end even on
          a Hebrew page. */}
      <span dir="auto" className="swipe-film-title line-clamp-3">
        {title}
      </span>
      <span className="sr-only">{t.common.cardDetails}</span>
    </button>
  );
}

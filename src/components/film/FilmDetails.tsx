"use client";

import { FilmDetailsBody } from "@/components/film/FilmDetailsBody";
import { Sheet } from "@/components/film/Sheet";
import { useOpenFilm } from "@/hooks/game/useFilmDetails";
import { useI18n } from "@/i18n/I18nProvider";
import { closeFilmDetails } from "@/lib/display/filmDetails";

/** A placed film's details, opened from its card on the line or from the feedback. */
export function FilmDetails() {
  const { t } = useI18n();
  const film = useOpenFilm();
  return (
    <Sheet open={Boolean(film)} onClose={closeFilmDetails} label={t.info.more}>
      {film ? <FilmDetailsBody key={film.id} film={film} /> : null}
    </Sheet>
  );
}

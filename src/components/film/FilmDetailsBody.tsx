"use client";

import { CloseButton } from "@/components/film/CloseButton";
import { SummaryText } from "@/components/film/SummaryText";
import { ExternalLink } from "@/components/site/ExternalLink";
import { useFilmSummary } from "@/hooks/game/useFilmSummary";
import { useI18n } from "@/i18n/I18nProvider";
import { type Film, filmTitle, filmWiki, filmWikiUrl } from "@/lib/catalog/films";
import { closeFilmDetails } from "@/lib/display/filmDetails";

/** What the details sheet shows: the poster, the names, the year and Wikipedia's summary. */
export function FilmDetailsBody({ film }: { film: Film }) {
  const { lang, t } = useI18n();
  const title = filmTitle(film, lang);
  // On Hebrew pages, the original title too.
  const original = title === film.title ? null : film.title;
  const wiki = filmWiki(film, lang);
  const summary = useFilmSummary(wiki.lang, wiki.page);

  return (
    <article className="flex flex-col gap-200 p-200">
      <header className="flex items-start gap-200">
        {/* Hot-linked from Wikimedia, which serves its own sizes: next/image can't help. */}
        {/* oxlint-disable-next-line nextjs/no-img-element */}
        <img
          src={film.poster}
          alt={t.info.filmPosterAlt(title)}
          referrerPolicy="no-referrer"
          className="sheet-poster"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-50">
          <h2 dir="auto" className="text-start text-xl font-black text-balance">
            {title}
          </h2>
          {original ? (
            <p dir="auto" className="text-start text-sm text-muted">
              {original}
            </p>
          ) : null}
          <p className="text-sm font-bold text-secondary-bright">{t.info.released(film.year)}</p>
          {summary.status === "ready" && summary.summary.description ? (
            <p dir="auto" className="text-start text-sm text-muted">
              {summary.summary.description}
            </p>
          ) : null}
        </div>
        <CloseButton onClose={closeFilmDetails} className="flex-none" />
      </header>

      <SummaryText summary={summary} />

      <ExternalLink
        href={filmWikiUrl(film, lang)}
        className="self-start text-sm font-bold underline decoration-dotted underline-offset-4 hover:text-secondary-bright"
      >
        {t.info.wikipedia}
      </ExternalLink>
    </article>
  );
}

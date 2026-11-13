import filmsData from "@/data/films.json";
import type { Locale } from "@/i18n/config";

export type Film = {
  /** Stable film id (a slug of the English title), stored in saves. */
  id: string;
  /** English title, as on English Wikipedia. */
  title: string;
  /** Hebrew title, shown on Hebrew pages when there is one. */
  titleHe?: string;
  /** Original release year (first public screening). */
  year: number;
  /** English Wikipedia page title. */
  wiki: string;
  /** Hebrew Wikipedia page title, when there is one. */
  wikiHe?: string;
  /** The theatrical poster, hot-linked from Wikimedia. */
  poster: string;
  /** Israeli films form their own pool in the settings. */
  israeli?: boolean;
};

export const FILMS: Film[] = filmsData;

/**
 * Which pool a film belongs to, for the player's film settings: Israeli films are "he",
 * everything else is "en" (the UI calls these "Israeli" and "International" films).
 */
export function filmLanguage(film: Pick<Film, "israeli">): Locale {
  return film.israeli ? "he" : "en";
}

const FILM_BY_ID = new Map(FILMS.map((f) => [f.id, f]));

/** Finds a film by its stable id. */
export function getFilm(id: string | undefined): Film | undefined {
  return id === undefined ? undefined : FILM_BY_ID.get(id);
}

/** The title to show in a language. */
export function filmTitle(film: Pick<Film, "title" | "titleHe">, lang: Locale): string {
  return lang === "he" ? (film.titleHe ?? film.title) : film.title;
}

/** The film's Wikipedia page in a language (English when there's no Hebrew page). */
export function filmWiki(
  film: Pick<Film, "wiki" | "wikiHe">,
  lang: Locale,
): {
  lang: Locale;
  page: string;
} {
  return lang === "he" && film.wikiHe
    ? { lang: "he", page: film.wikiHe }
    : { lang: "en", page: film.wiki };
}

/** A link to the film's Wikipedia page. */
export function filmWikiUrl(film: Pick<Film, "wiki" | "wikiHe">, lang: Locale): string {
  const w = filmWiki(film, lang);
  return `https://${w.lang}.wikipedia.org/wiki/${encodeURIComponent(w.page)}`;
}

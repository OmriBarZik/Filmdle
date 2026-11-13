import type { Locale } from "@/i18n/config";

/** The bit of a Wikipedia page summary the details sheet shows. */
export type FilmSummary = { description?: string; extract: string };

const cache = new Map<string, Promise<FilmSummary>>();

/**
 * A film's summary from Wikipedia's REST API (it allows cross-origin requests), fetched
 * only after the film was placed, when the player opens its details. Cached per page.
 */
export function fetchFilmSummary(lang: Locale, page: string): Promise<FilmSummary> {
  const key = `${lang}:${page}`;
  let pending = cache.get(key);
  if (!pending) {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`;
    pending = fetch(url, { headers: { accept: "application/json" } })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Wikipedia answered ${res.status}`);
        }
        return res.json() as Promise<{ description?: unknown; extract?: unknown }>;
      })
      .then((json) => ({
        description: typeof json.description === "string" ? json.description : undefined,
        extract: typeof json.extract === "string" ? json.extract : "",
      }));
    // A failure may be passing (offline): let the next opening try again.
    void pending.catch(() => cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

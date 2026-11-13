import { FILMS } from "@/lib/catalog/films";

/** A 2×3 grey GIF: loads at once, with no network. */
const POSTER = "data:image/gif;base64,R0lGODlhAgADAIAAAICAgP///yH5BAAAAAAALAAAAAACAAMAAAIChF8AOw==";

/**
 * Points every film's poster at a local image, so tests never reach Wikimedia and every
 * poster loads. The catalogue's objects are the app's own, so the screens see it.
 */
export function installFakePosters(): void {
  for (const film of FILMS) {
    film.poster = POSTER;
  }
}

"use client";

import { useSyncExternalStore } from "react";
import { getFilm } from "@/lib/catalog/films";
import { openFilmId, subscribeFilmDetails } from "@/lib/display/filmDetails";

/** The film whose details are open, if any. */
export function useOpenFilm() {
  const id = useSyncExternalStore(subscribeFilmDetails, openFilmId, () => null);
  return getFilm(id ?? undefined);
}

import { expect, it } from "vitest";
import { localePath, matchAcceptLanguage, splitLocale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";
import { FILMS, filmTitle, filmWikiUrl } from "@/lib/catalog/films";
import { slotLabel } from "@/lib/line/timeline";

it("i18n routing: prefixes every language the same way", () => {
  expect(localePath("en", "/")).toBe("/en");
  expect(localePath("he", "/")).toBe("/he");
  expect(localePath("en", "/daily")).toBe("/en/daily");
  expect(localePath("he", "/marathon")).toBe("/he/marathon");
});
it("i18n routing: splits a language prefix off a path", () => {
  expect(splitLocale("/he/daily")).toEqual(["he", "/daily"]);
  expect(splitLocale("/en")).toEqual(["en", "/"]);
  expect(splitLocale("/daily")).toEqual([null, "/daily"]);
  expect(splitLocale("/hello")).toEqual([null, "/hello"]);
});
it("i18n routing: matches Accept-Language", () => {
  expect(matchAcceptLanguage("he-IL,he;q=0.9,en-US;q=0.8")).toBe("he");
  expect(matchAcceptLanguage("en-US,en;q=0.9,he;q=0.8")).toBe("en");
  expect(matchAcceptLanguage("fr-FR,iw;q=0.5")).toBe("he");
  expect(matchAcceptLanguage("fr-FR,de;q=0.5")).toBeNull();
  expect(matchAcceptLanguage("en;q=0.2,he;q=0.7")).toBe("he");
  expect(matchAcceptLanguage(null)).toBeNull();
});

it("messages: has the same keys in every language", () => {
  const shape = (o: Record<string, unknown>): string[] =>
    Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === "object" && !Array.isArray(v) && !("$$typeof" in v)
        ? shape(v as Record<string, unknown>).map((s) => `${k}.${s}`)
        : [k],
    );
  expect(shape(MESSAGES.he).toSorted()).toEqual(shape(MESSAGES.en).toSorted());
  expect(MESSAGES.he.home.rules).toHaveLength(MESSAGES.en.home.rules.length);
});
it("messages: labels slots in Hebrew", () => {
  const cards = [{ year: 1994 }, { year: 1997 }, { year: 2000 }];
  expect(slotLabel(cards, 0, MESSAGES.he.slots)).toBe("לפני 1994");
  expect(slotLabel(cards, 3, MESSAGES.he.slots)).toBe("אחרי 2000");
  expect(MESSAGES.he.common.films(1)).toBe("סרט אחד");
  expect(MESSAGES.he.common.films(3)).toBe("3 סרטים");
});

it("film names: shows Hebrew titles on Hebrew pages and keeps English elsewhere", () => {
  const he = FILMS.find((f) => f.titleHe)!;
  expect(filmTitle(he, "he")).toBe(he.titleHe);
  expect(filmTitle(he, "en")).toBe(he.title);
  expect(filmTitle({ title: "Untranslated" }, "he")).toBe("Untranslated");
});

it("film names: gives every Israeli film a Hebrew title", () => {
  const israeli = FILMS.filter((f) => f.israeli);
  for (const f of israeli) {
    expect(f.titleHe).toBeTruthy();
  }
  expect(israeli.length).toBeGreaterThanOrEqual(40);
});

it("film pages: links the Hebrew Wikipedia page on Hebrew pages when there is one", () => {
  const film = { wiki: "Jaws_(film)", wikiHe: "מלתעות_(סרט)" };
  expect(filmWikiUrl(film, "en")).toBe("https://en.wikipedia.org/wiki/Jaws_(film)");
  expect(filmWikiUrl(film, "he")).toBe(
    `https://he.wikipedia.org/wiki/${encodeURIComponent("מלתעות_(סרט)")}`,
  );
  expect(filmWikiUrl({ wiki: "Jaws_(film)" }, "he")).toBe(
    "https://en.wikipedia.org/wiki/Jaws_(film)",
  );
});

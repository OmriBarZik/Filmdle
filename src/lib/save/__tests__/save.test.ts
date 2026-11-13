import { afterEach, beforeEach, expect, it } from "vitest";
import { emptySave, loadSave, writeSave } from "@/lib/save/storage";

const KEY = "filmdle:v1";

type FakeStorage = {
  store: Map<string, string>;
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
};

/** A tiny in-memory localStorage for the node test environment. */
function fakeStorage(fail = false): FakeStorage {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (fail) {
        throw new Error("QuotaExceededError");
      }
      store.set(k, v);
    },
  };
}

let storage: FakeStorage;

beforeEach(() => {
  storage = fakeStorage();
  (globalThis as { window?: unknown }).window = { localStorage: storage };
});
afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

it("loadSave: starts fresh without a save", () => {
  expect(loadSave()).toEqual(emptySave());
});

it("loadSave: starts fresh on broken JSON or an unknown version", () => {
  storage.store.set(KEY, "{nope");
  expect(loadSave()).toEqual(emptySave());
  storage.store.set(KEY, JSON.stringify({ version: 2 }));
  expect(loadSave()).toEqual(emptySave());
  storage.store.set(KEY, "null");
  expect(loadSave()).toEqual(emptySave());
});

it("loadSave: round-trips a save", () => {
  const d = emptySave();
  d.marathon.stats.best = 7;
  d.daily.stats.played = 3;
  writeSave(d);
  expect(loadSave()).toEqual(d);
});

it("loadSave: fills in fields missing from older saves", () => {
  storage.store.set(
    KEY,
    JSON.stringify({
      version: 1,
      daily: { stats: { played: 4 } },
      marathon: { stats: { best: 2 } },
    }),
  );
  const d = loadSave();
  expect(d.daily.days).toEqual({});
  expect(d.daily.stats).toEqual({ ...emptySave().daily.stats, played: 4 });
  expect(d.marathon).toEqual({ days: {}, stats: { ...emptySave().marathon.stats, best: 2 } });
  expect(d.settings.filmLanguages).toEqual(["en", "he"]);
});

it("loadSave: cleans the film-language setting", () => {
  const save = (filmLanguages: unknown) =>
    storage.store.set(KEY, JSON.stringify({ version: 1, settings: { filmLanguages } }));
  save(["he", "fr", "en"]);
  expect(loadSave().settings.filmLanguages).toEqual(["en", "he"]);
  save([]);
  expect(loadSave().settings.filmLanguages).toEqual(["en", "he"]);
  save("he");
  expect(loadSave().settings.filmLanguages).toEqual(["en", "he"]);
  save(["he"]);
  expect(loadSave().settings.filmLanguages).toEqual(["he"]);
});

it("writeSave: ignores storage errors", () => {
  storage = fakeStorage(true);
  (globalThis as { window?: unknown }).window = { localStorage: storage };
  expect(() => writeSave(emptySave())).not.toThrow();
});

it("loadSave: gives a save from before Marathon an empty one, and keeps the rest", () => {
  storage.store.set(KEY, JSON.stringify({ version: 1, daily: { stats: { played: 1 } } }));
  const d = loadSave();
  expect(d.marathon).toEqual(emptySave().marathon);
  expect(d.daily.stats.played).toBe(1);
});

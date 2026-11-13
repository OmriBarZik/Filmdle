import { type Locale, LOCALES } from "@/i18n/config";
import { DAILY_SIZE } from "@/lib/catalog/daily";
import type {
  MarathonDay,
  MarathonFreeRun,
  MarathonStats,
  SaveData,
  DailyDay,
  DailyStats,
} from "./saveData";

const STORAGE_KEY = "filmdle:v1";

export function emptySave(): SaveData {
  return {
    version: 1,
    daily: {
      days: {},
      stats: {
        played: 0,
        perfect: 0,
        streak: 0,
        maxStreak: 0,
        lastPerfect: null,
        distribution: Array.from({ length: DAILY_SIZE + 1 }, () => 0),
      },
    },
    marathon: { days: {}, stats: { played: 0, best: 0, totalHits: 0 } },
    settings: { filmLanguages: [...LOCALES] },
  };
}

/** Keeps only known languages, in canonical order; falls back to all when empty. */
function cleanLanguages(value: unknown): Locale[] {
  const list: unknown[] = Array.isArray(value) ? value : [];
  const kept = LOCALES.filter((l) => list.includes(l));
  return kept.length > 0 ? kept : [...LOCALES];
}

/** What may be in storage: anything from an older version, or hand-edited junk. */
type StoredSave = {
  version?: unknown;
  daily?: { days?: Record<string, DailyDay>; stats?: Partial<DailyStats> };
  marathon?: {
    days?: Record<string, MarathonDay>;
    stats?: Partial<MarathonStats>;
    free?: MarathonFreeRun;
  };
  settings?: { filmLanguages?: unknown };
} | null;

export function loadSave(): SaveData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptySave();
    }
    const parsed = JSON.parse(raw) as StoredSave;
    if (parsed?.version !== 1) {
      return emptySave();
    }
    const base = emptySave();
    return {
      ...base,
      ...parsed,
      version: 1,
      daily: {
        days: parsed.daily?.days ?? {},
        stats: { ...base.daily.stats, ...parsed.daily?.stats },
      },
      marathon: {
        days: parsed.marathon?.days ?? {},
        stats: { ...base.marathon.stats, ...parsed.marathon?.stats },
        ...(parsed.marathon?.free ? { free: parsed.marathon.free } : {}),
      },
      settings: { filmLanguages: cleanLanguages(parsed.settings?.filmLanguages) },
    };
  } catch {
    return emptySave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Private mode / storage full: the game still works for this session.
  }
}

/** Turn a film language on or off. The last one left can't be turned off. */
export function setFilmLanguage(data: SaveData, lang: Locale, on: boolean): SaveData {
  const current = data.settings.filmLanguages;
  if (current.includes(lang) === on) {
    return data;
  }
  const next = on ? cleanLanguages([...current, lang]) : current.filter((l) => l !== lang);
  if (next.length === 0) {
    return data;
  }
  return { ...data, settings: { ...data.settings, filmLanguages: next } };
}

#!/usr/bin/env node
/**
 * Checks every film in src/data/films.json:
 * - its poster still loads from Wikimedia, as an image;
 * - its English (and Hebrew) Wikipedia page still exists, for the details sheet.
 *
 * Usage: pnpm validate-posters          (all films)
 *        pnpm validate-posters --quiet  (only problems)
 *
 * Runs as TypeScript directly (Node strips the types). Needs access to wikipedia.org and
 * upload.wikimedia.org.
 */
import { readFile } from "node:fs/promises";

type Film = {
  id: string;
  title: string;
  year: number;
  wiki: string;
  wikiHe?: string;
  poster: string;
};

const quiet = process.argv.includes("--quiet");
const films = JSON.parse(
  await readFile(new URL("../src/data/films.json", import.meta.url), "utf8"),
) as Film[];

// Wikimedia asks automated clients to say who they are.
const headers = { "user-agent": "FilmdlePosterCheck/1.0 (open-source game)" };
const problems: { film: Film; reason: string }[] = [];
const CONCURRENCY = 6;
let index = 0;

const describe = (film: Film) => `${film.id}  ${film.title} (${film.year})`;

/** Why a URL fails, or null when it answers with the right kind of content. */
async function failure(url: string, kind: "image" | "page"): Promise<string | null> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    return `${kind} HTTP ${res.status}`;
  }
  const type = res.headers.get("content-type") ?? "";
  await res.body?.cancel();
  return kind === "image" && !type.startsWith("image/") ? `poster is ${type}` : null;
}

const summary = (lang: string, page: string) =>
  `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`;

async function check(film: Film): Promise<void> {
  try {
    const reasons = await Promise.all([
      failure(film.poster, "image"),
      failure(summary("en", film.wiki), "page"),
      film.wikiHe ? failure(summary("he", film.wikiHe), "page") : null,
    ]);
    const reason = reasons.filter(Boolean).join(", ");
    if (reason) {
      problems.push({ film, reason });
      console.log(`❌ ${describe(film)}  (${reason})`);
    } else if (!quiet) {
      console.log(`✅ ${describe(film)}`);
    }
  } catch (err) {
    problems.push({ film, reason: String(err) });
    console.log(`⚠️  ${describe(film)}  (${String(err)})`);
  }
}

// A small pool of workers, each checking one film at a time.
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let film = films[index++]; film; film = films[index++]) {
      // Sequential within a worker on purpose: CONCURRENCY limits parallel requests.
      // oxlint-disable-next-line no-await-in-loop
      await check(film);
    }
  }),
);

console.log(`\n${films.length - problems.length}/${films.length} films OK.`);
if (problems.length > 0) {
  process.exit(1);
}

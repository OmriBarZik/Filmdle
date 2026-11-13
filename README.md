# Filmdle 🎬

A daily movie game: **guess-the-year meets daily puzzle**. You see a film's poster and
nothing else, and slide it onto a timeline where you think it belongs. Only after you
place it do you learn the film's name, its year and its story.

Built mainly for phones: one screen, no scrolling, swipe the line and tap to place.

## Game modes

### 🎞️ Daily Five
Five films, the same for everyone each day, shown **one poster at a time**. The line starts
with a single year card (e.g. *1980*). Swipe the first poster *before* or *after* it, then
the next one into one of the gaps, and so on. Each right placement scores a 🟩; a wrong one
is shown in red and moved to its real spot so the line stays accurate. Perfect days build a
streak.

### ❤️ Marathon
Once a day, as many films as you can. The line starts with a single year card, and posters
keep coming one at a time. A wrong placement costs one of your **three hearts** (and the
film moves to its real spot). When the last heart is gone, your score for the day is how many
films you placed right. Same films for everyone. Afterwards, **Play again** starts free-play
runs, and their share link challenges a friend to the same films.

Films from the same year count as correct on either side. The year is the film's first
release.

### What you see, and when
- **Before placing:** only the poster. Tap it (or press Space) to see it full screen. The
  page never shows the film's name, not even to screen readers.
- **After placing:** the title (in Hebrew on Hebrew pages), the year, and a card on the line
  with the poster. Tap any card, or "More about this film", for its details: Wikipedia's
  summary and a link to the full article.

Progress is stored in the browser (`localStorage`): no accounts, no backend. A new day
starts at the player's local midnight. The site is fully bilingual (English and Hebrew), and
players choose International and/or Israeli films in the settings.

## Where the posters come from

Filmdle hosts no images. Each film in [`src/data/films.json`](src/data/films.json) points at
its theatrical poster on Wikimedia (`upload.wikimedia.org`), the one shown in the film's
English Wikipedia infobox, and at its Wikipedia pages. The details sheet fetches the
summary from Wikipedia's public REST API when a player opens it. Posters belong to their
rights holders.

## Development

```bash
pnpm install
pnpm dev                # http://localhost:3000
pnpm test               # unit + component tests (vitest, Testing Library, axe)
pnpm lint               # oxlint (React, type-aware TypeScript, accessibility, Next.js rules)
pnpm format             # oxfmt
pnpm typecheck
pnpm check              # everything CI runs except the build
pnpm build
pnpm validate-posters   # check every poster and Wikipedia page still exists
```

Built with Next.js (App Router), React, TypeScript 7 and Tailwind CSS. Linted with oxlint and
formatted with oxfmt.

### Project layout

| Path | What |
| --- | --- |
| `src/data/films.json` | The film catalog |
| `src/lib/catalog/` | The catalog and deterministic daily film selection (seeded by date) |
| `src/lib/games/`, `src/lib/save/` | Every game's state transitions, and the save format |
| `src/lib/line/` | Slot / placement rules |
| `src/components/` | One folder per screen (`daily/`, `marathon/`, `settings/`, `home/`) and per shared part (`poster/` for the poster being placed, `film/` for the full-screen poster and details, `swipe/` for the line) |

Folders hold at most 7 files each (enforced by lint): group new files into feature folders.

## Adding films

Add an entry to `src/data/films.json` (one film per line):

```json
{"id":"jaws","title":"Jaws","titleHe":"מלתעות","year":1975,"wiki":"Jaws_(film)","wikiHe":"מלתעות_(סרט)","poster":"https://upload.wikimedia.org/wikipedia/en/e/eb/JAWS_Movie_poster.jpg"}
```

- `id` is a stable slug (it is stored in saves): never change it.
- `year` is the original release year (first public screening).
- `wiki` / `wikiHe` are the English / Hebrew Wikipedia page titles; `titleHe` is the
  Hebrew title shown on Hebrew pages.
- `poster` is the infobox poster's file on `upload.wikimedia.org`.
- Israeli films get `"israeli": true`.
- Run `pnpm validate-posters`.

Daily picks are derived from the catalog, so **changing the catalog changes future (and
past) puzzles**. Adding films is fine; avoid editing on a day people are mid-puzzle.

## Deploying to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub repository.
2. Keep the defaults (framework: Next.js, build: `next build`). No environment variables
   are needed.
3. Deploy. Every push to `main` redeploys automatically; pull requests get preview URLs.

## License

[MIT](./LICENSE). Film posters and texts belong to their respective rights holders and are
loaded from Wikimedia and Wikipedia.

@AGENTS.md

# Filmdle: notes for agents

Filmdle is a daily movie game that combines Hitster and Wordle. Players see a film's poster
(and nothing else: no title, no year) and place it on a timeline by release year. Only after
placing do they get the title, the year and the film's details (Wikipedia's summary).
It is mainly for phones. It started as a copy of Spindle (the same game with songs), so the
two share their structure, tooling and rules.
It is open source (MIT) and deployed on Vercel from `main` with no environment variables.
Production runs **Node 26**: `engines.node` in `package.json` (`26.x`) sets it for Vercel and
CI (`node-version-file`), and `@types/node` matches it. Change all of them together.

## Commands

```bash
pnpm install            # install dependencies (pnpm is pinned in package.json's packageManager)
pnpm dev                # http://localhost:3000
pnpm test               # vitest projects: unit (node), lint-rules, browser (Chromium) and performance (Chromium on a slowed CPU)
pnpm lint               # oxlint (.oxlintrc.json): React Compiler rules, type-aware TS, jsx-a11y, Next.js
pnpm lint:css           # stylelint (.stylelintrc.json): every style on the design tokens
pnpm lint:fix           # oxlint --fix and stylelint --fix
pnpm format             # oxfmt (.oxfmtrc.json): also sorts imports and Tailwind classes
pnpm typecheck          # next typegen + tsc --noEmit (TypeScript 7, the native compiler)
pnpm knip               # unused files, exports and dependencies
pnpm check              # format check + lint + CSS lint + knip + typecheck + tests (what CI runs, minus the build)
pnpm build              # production build; all routes are static
pnpm validate-posters   # checks every poster and Wikipedia page (needs wikipedia.org / upload.wikimedia.org access)
```

Run `pnpm check` and `pnpm build` before pushing. CI (`.github/workflows/ci.yml`)
runs format, lint, CSS lint, knip, typecheck, tests and build on every PR and on `main`.

**On a remote or cloud machine (e.g. Claude Code on the web), skip the CPU check.** The
`performance` project times swipes on a throttled CPU, and shared machines are too noisy for it:
it fails there even on an untouched `main`. Run the other checks one by one and test with
`pnpm vitest run --project '!performance-*'`; CI runs the performance test on every PR.

## Styling: design tokens only

All styles come from `src/app/styles/tokens.css`. Nothing else holds a raw colour, length or
duration, and the linters enforce it.

- **Spacing is named in hundreds on a 4px grid:** `--spacing-100` = 0.5rem (8px), `50` = 4px,
  `150` = 12px, `200` = 1rem. Tailwind uses the same scale (`p-100`, `gap-150`, `w-600`,
  `-inset-150`); Tailwind's own numbers (`p-3`) are switched off. `25` (2px) is only for hairlines
  and optical nudges. The root font size stays 16px. Component sizes (`--swipe-*`, `--size-reel*`,
  …) are built from spacing tokens (`var(--spacing-1300)`, `calc()` of them), never raw rem.
- **Colours have roles:** `page`, `surface`, `line`, `ink` / `muted` / `faint` (text), `hover`,
  `primary` (the main action: Place it, Share), `secondary` (Filmdle's violet: focus, the line's
  glow, the starting year), `tertiary` (quiet fills: off, still to come), `success` / `danger` /
  `warning-ink`, `heart`, `scrim` / `on-scrim` (text over a poster), `backdrop` (behind a sheet), and
  one set per game mode: `daily`, `marathon` (sleeve colour, `-ink` for text on it, `-label` for its reel). Use them as Tailwind classes (`bg-surface`,
  `text-muted`) or `var(--color-…)`. Raw colours live only in `--palette-*`.
- **Light and dark:** each themed role is `light-dark(light, dark)` and follows the system setting.
  A browser without `light-dark()` gets the dark values. The home page's reels stay dark in both.
  Component tests run in both schemes (`browser-dark`, `browser-light`), so axe checks contrast in each.
- **Desktop (`lg:`, 64rem and up):** pages widen to `max-w-wide`. The home page becomes two
  columns (`.home` grid in `styles/home.css`: headline, "This week" and "How to play" beside bigger
  sleeves). A game screen's line uses the full width with bigger cards and poster (the `--swipe-*`
  overrides under `@variant lg` in `tokens.css`), while its header, buttons and result stay in the
  narrow `max-w-page` column. Phones must look exactly as before.
- **Game colours:** a game screen passes `game` to `ScreenMain` (`.game-*`); a home sleeve passes
  `game` to `ModeSleeve`.
- **Lint:** stylelint (`stylelint-config-standard` plus `lint/stylelint-tokens.mjs`):
  `filmdle/tokens-only` rejects raw colours outside `--palette-*`, lengths outside `--spacing-*`,
  `--text-*`, `--border-thin`/`--border-thick` and `--tracking-*`, and durations outside
  `--duration-*`; `filmdle/spacing-grid` checks that `--spacing-N` is `N / 200` rem and on the 4px
  grid. In TS/TSX, oxlint's `filmdle/no-raw-style` rejects hex/rgb colours, Tailwind's own colours
  (`text-white`), arbitrary values (`text-[13px]`) and off-scale spacing (`gap-3`). The only
  exception is `src/lib/display/palette.ts` (the link preview image and favicon can't read CSS).

## Game modes

| Mode | Route | Internal name | Rules |
| --- | --- | --- | --- |
| **Daily Five** | `/{lang}/daily` | "daily" (`DailyGame`, `data.daily`, `dailyFilmsFor`) | The line starts with one **starting year**. Five posters come **one at a time**, and each is placed into a gap. A wrong placement is marked red and moved to its real spot. Score is x/5. Everyone gets the same films each day. |
| **Marathon** | `/{lang}/marathon` | "marathon" (`MarathonGame`, `data.marathon`, `marathonFilmsFor`) | Once a day. The line starts with one **starting year**, then posters come one at a time, as many as the player can place. Each wrong placement costs one of **3 hearts** (`MARATHON_HEARTS`) and the film is moved to its real spot; when the last heart goes, the day's score (films placed right) is final. Everyone gets the same run each day. After that, **Play again** starts a **free-play** run (`marathonFree.ts`, `data.marathon.free`) as often as the player likes: its own random films (`marathonFreeFilmsFor`, seeded by a stored random `seed` of ten letters and digits; only the seed and the film languages pick the films, never the day). It never changes the stats and shares as "Free play". The share is a **challenge**: its link (`/marathon?run=<seed>[&films=he]`, `challengePath`) carries only the seed and gives a friend the same films (`parseChallenge` refuses anything not exactly in that shape), even before their own daily run (then "Play today's marathon" takes them back to it). |
| **Settings** | `/{lang}/settings` | `Settings` | Players choose which films can appear: International (`en`) and/or Israeli (`he`) films (`israeli: true` in the catalog). Stored in `data.settings.filmLanguages` (never empty). |

Shared rules:
- **Slot `i`** means "insert before `cards[i]`"; `slot === cards.length` is the end.
- **Desktop controls:** Space opens the poster full screen and Enter places, from anywhere on the
  page (`useKeyShortcut`). A focused button keeps Space, but never gets Enter while the place button
  is on screen (it's claimed: a clicked poster keeps the focus, and Enter must place); links keep it,
  alongside the arrow keys, Home and End.
  With a mouse, the strip can be dragged, a click moves the poster to the nearest gap
  (`useSwipeDrag`), and the wheel moves it one gap per notch (`useSwipeWheel`). `KeyHints` lists
  the keys under the place button, only for fine pointers. Every control has tests:
  `KeyboardControls`, `MouseControls`, `WheelControls` and `DesktopLayout` (at 1280px) in
  `src/components/swipe/__tests__/`, plus the arrow keys in `DailyGame.test.tsx`. Add one with any new control.
- **Placing is swipe-then-tap.** The poster always sits on a gap (it starts in the middle,
  `defaultSlot`), so the place button is ready as soon as the poster has loaded, and the whole
  line, poster and button fit on one phone screen. Keep it that way: no scrolling up and down.
- **Equal years are correct on either side** (`isSlotCorrect` in `src/lib/line/timeline.ts`).
  So neighbouring films from the same year are one **stack** on the line (`SwipeStack`): one spot
  on the rail, the cards behind peeking out, a "1/2" button to flip, and no gap inside it.
  The strip counts gaps between stacks; `useStackedLine` converts them to card slots.
- A new day starts at the **player's local midnight** (`dayKey()` in `src/lib/catalog/dates.ts`).

## Languages (i18n)

The site is fully bilingual: **English (`en`) and Hebrew (`he`) are equal**. Neither one
is a "default" served without a prefix.

- `src/i18n/config.ts` is the **one place** that knows which languages exist: `Locale`, `LOCALES`,
  and each language's name, direction and aliases. Never write out the language list anywhere
  else; loop over `LOCALES`. Film pools use the same `Locale` codes, so `LOCALES` drives them too.
  **Don't reorder it**: the daily picks walk it in order, so that would change everyone's puzzles.

- Every page lives under `src/app/[lang]/` (`/en`, `/he/daily`, …). `[lang]/layout.tsx` is the
  root layout. It sets `<html lang dir>` (`rtl` for Hebrew) and statically generates both
  languages.
- `src/proxy.ts` redirects any URL without a prefix (`/`, `/daily`) to the
  `filmdle-lang` cookie's language (set by the header switch), else the browser's
  `Accept-Language`, else English.
- All UI text is in `src/i18n/messages.tsx` (one `Messages` object per language; the
  types force both languages to have every key). Server components use `getI18n()` from
  `src/i18n/server.ts`; client components use `useI18n()` from `src/i18n/I18nProvider.tsx`.
  **Never hard-code UI text in components**; add it to both languages.
- `slotLabel(cards, slot, t.slots)` takes the language's slot labels.
- Film names: use `filmTitle(film, lang)` (`src/lib/catalog/films.ts`): `titleHe` on Hebrew pages
  when there is one. `filmWiki` / `filmWikiUrl` pick the Hebrew Wikipedia page when there is one.
- Saves are shared between languages, so switching language keeps progress.
- **RTL layout:** use logical utilities (`ms-*`, `ps-*`, `text-start`/`text-end`, `start-*`)
  instead of `ml`/`pl`/`text-left`, and the `rtl:` variant where needed (e.g.
  `rtl:tracking-normal`, since wide letter-spacing breaks Hebrew). Wrap Latin film
  titles in `<bdi>` inside sentences, and give titles on their own `dir="auto"`.
- Fonts: Roboto (and Roboto Mono) for Latin. Roboto has no Hebrew, so Heebo
  (`--font-hebrew`, Roboto's Hebrew companion) is the fallback for Hebrew glyphs.

## Architecture

- **No backend.** All state lives in `localStorage` under the key `filmdle:v1`
  (`src/lib/save/storage.ts`, with the shape in `src/lib/save/saveData.ts`). There are no accounts and no API routes.
- **External content, loaded by the browser only:** posters are hot-linked from
  `upload.wikimedia.org` (each `<img>` has `referrerPolicy="no-referrer"`), and a placed film's
  details come from Wikipedia's REST API (`fetchFilmSummary` in `src/lib/services/wikipedia.ts`,
  cached per page). Nothing is proxied or stored by Filmdle.
- **Analytics.** Off by default: `track()` in `src/lib/services/analytics.ts` sends to Google
  Analytics 4 only when a `gtag` snippet is on the page (there is none yet; add one to the root
  layout with a measurement ID of Filmdle's own). Its `Events` type lists every event and its
  parameters (component tests check them with `trackedEvents()`). **Never send film details**
  (title, year, poster) to analytics.
- **Client-only game screens.** `src/app/[lang]/{daily,marathon}/page.tsx` are server components
  that render `DailyGameClient` and `MarathonGameClient` from `src/components/LazyScreens.tsx`.
  The home page's "This week" strip (`WeekStripClient`) loads the same way.
  These use `next/dynamic` with `ssr: false`, because the initial state reads
  `localStorage` and the local date. `ssr: false` is only allowed inside a client
  component, which is why `LazyScreens.tsx` exists.
- **Deterministic daily picks.** `src/lib/catalog/daily.ts` runs `seededShuffle(FILMS, seed)`
  (`src/lib/catalog/random.ts`, FNV-1a + mulberry32) with these seed strings:
  `daily:${day}`, `anchor:${day}`, `marathon:${day}`, `marathon-anchor:${day}`,
  `marathon-free:${seed}` and `marathon-free-anchor:${seed}`.
  `shuffled()` in `daily.ts` splits that shuffle by film language and interleaves the
  lists with a seeded 50/50 coin (seed `${seed}:mix`), so with both kinds on about half the
  picks are Israeli even though the catalog is mostly international. The film-language
  setting only chooses which lists take part; it never changes the seed. So everyone with both
  kinds on (the default) shares one puzzle, and players with the same setting match each other.
  A Daily Five day remembers its `languages` and is re-picked only while no film has been placed,
  and so is a Marathon day. The Marathon plays the day's whole shuffle in order, minus the day's
  Daily Five films. Share text says "Israeli films only" etc. when the puzzle came from one kind.
  **Never change these strings or the shuffle algorithm**: doing so changes everyone's
  past and future puzzles. Editing `films.json` also reshuffles the picks, so add films
  rather than reorder or remove them, and avoid doing it mid-day.
- **Pure state transitions.** Every game action is a pure function
  `(SaveData, day, ...) => SaveData`, for example `ensureDailyDay` and `placeDailyFilm` in
  `dailyState.ts`, and `ensureMarathonDay`, `placeMarathonFilm` and `skipMarathonFilm` in
  `marathonState.ts`.
  A no-op returns the **same object** (the tests check identity). Components call them
  through `useSave()` (`src/hooks/game/useSave.ts`), which persists only when the object changes.

### Folders

At most **7 files per folder** (`filmdle/max-files-per-folder`; see `.claude/rules/code-style.md`),
grouped by feature, with each folder's tests in its own `__tests__/`:

| Folder | What |
| --- | --- |
| `src/components/` | `LazyScreens.tsx`, plus `poster/` (the poster being placed), `film/` (the full-screen poster, the film details sheet and the `<dialog>` they share), `swipe/` (the line; `swipe/card/` its cards and stacks), `game/` (pieces every game screen uses: `ScreenMain`, `PlaceButton`, `KeyHints`, `Announce`, `GameLoading`), `result/` (`ResultCard`, `ShareButton`, `Stats`), one folder per screen (`daily/`, `marathon/`, `settings/`), `home/` (sleeves, "This week", footer), `brand/` (the reel mark) and `site/` (header, language switch, `ExternalLink`, and the pages test) |
| `src/hooks/` | `game/` (screen state, save, key shortcuts, poster preloading, film details) and `swipe/` (the strip's controls) |
| `src/lib/` | `catalog/` (films, daily picks, seeded random, dates), `games/` (each mode's state and the share texts), `line/` (cards, slots, stacks, the live gap), `save/` (save format, storage, the week), `display/` (motion, smooth scroll, palette, which film's details are open) and `services/` (Wikipedia, analytics) |
| `src/test/` | Test setup at the top, `fakes/` (posters, Wikipedia, analytics, clipboard) and `input/` (real mouse, poster controls, CPU throttling) |

### File map

| Path | What |
| --- | --- |
| `src/data/films.json` | Film catalog, one film per line: `{ id, title, titleHe?, year, wiki, wikiHe?, poster, israeli? }`. `id` (stored in saves) is a stable slug: never change it. `year` is the first release. `poster` is the English Wikipedia infobox poster on `upload.wikimedia.org` (at most 500px wide). One shared pool: Israeli films (`israeli: true`) sit alongside the rest. |
| `src/lib/catalog/films.ts` | Loads the catalog; `getFilm(id)`, `filmLanguage`, `filmTitle`, `filmWiki`, `filmWikiUrl` |
| `src/lib/catalog/daily.ts` | Daily film and starting-year selection |
| `src/lib/save/saveData.ts` | The save format's types |
| `src/lib/save/storage.ts` | Reading and writing the save (migrations-on-load), `emptySave`, `setFilmLanguage` |
| `src/lib/games/dailyState.ts` | Daily Five: pure state transitions, stats, and what the screen shows (`dailyView`, `dailyLineItems`) |
| `src/lib/games/marathonState.ts` | Marathon: pure state transitions, hearts, stats and what the screen shows (`marathonView`, which also gives the `next` film so its poster preloads) |
| `src/lib/games/marathonFree.ts` | Marathon free play after the daily run and challenge links: `startFreeMarathon`, `marathonRun` (the run on screen), `placeMarathon`, `skipMarathon`, `challengePath` / `parseChallenge` / `startChallenge` (opened by `useMarathonScreen`) |
| `src/lib/line/timeline.ts` | `LineItem`, `isSlotCorrect`, `correctSlot`, `defaultSlot`, `recordSlot`, `slotLabel` |
| `src/lib/save/week.ts` | `weekDays()`: the home page's "This week", Sunday to Saturday in reading direction (a day counts once any film was placed) |
| `src/lib/line/stacks.ts` | Same-year films as one stack on the line, and converting the strip's gaps to card slots (`SwipeStack`, `useStackedLine`) |
| `src/hooks/game/useGameScreen.ts` | What both game screens start from: today's save, the poster's state (`seen`: loaded or failed, per film), the line state, the result animation (`PosterSwap`) and the `game_open` event |
| `src/components/poster/Poster.tsx` | The film to place: `PosterFrame` (a button showing the poster; tap or Space opens `PosterZoom`), `PosterFace` (image, loading shimmer, 🎬 when it fails) and `PosterStatus` (loading / failed, with "Give me a different film" in the Marathon). Preloads the next film's poster (`usePreloadPoster`). |
| `src/components/film/FilmDetails.tsx` | The details sheet of a placed film (`FilmDetailsBody`, `SummaryText`): poster, titles, year, Wikipedia's summary and link. Opened through the small store in `src/lib/display/filmDetails.ts` by a card on the line (`SwipeCardPoster`) or "More about this film" in the feedback box. `Sheet` is the shared native `<dialog>` (focus trap, Escape, tap outside to close). |
| `src/hooks/swipe/useSwipeTrack.ts` | Keeps the scrolling strip and the chosen gap in step (`PITCH`) |
| `src/hooks/swipe/useSwipeKeys.ts` | Arrow keys, Home and End move the poster from anywhere on the page |
| `src/hooks/game/useKeyShortcut.ts` | A page-wide key (Space zooms in `Poster`, Enter places in `PlaceButton`) |
| `src/hooks/swipe/useSwipePitch.ts` | `PITCH` (the phone's gap-to-gap distance) and the strip's measured pitch, kept in a ref and re-measured on resize |
| `src/hooks/swipe/useSwipeDrag.ts`, `useSwipeWheel.ts` | Mouse controls for the strip: drag, click to a gap, wheel |
| `src/lib/games/share.ts` | `shareOrCopy()` plus the pure share-text builders (`dailyShareText`, `marathonShareText`); share texts carry no puzzle number |
| `src/lib/display/motion.ts` | `canAnimate()` (Web Animations + reduced-motion check) |
| `src/lib/display/smoothScroll.ts` | `smoothScrollToCenter()`: brings the poster into view after a guess |
| `src/components/home/Footer.tsx` | The home page's site footer (where posters come from, and the GitHub link) |
| `src/components/daily/DailyGame.tsx` | Daily Five screen |
| `src/components/marathon/MarathonGame.tsx` | Marathon screen (with `MarathonHeader`, `Hearts`, `MarathonFeedback`, `MarathonResult`) |
| `src/app/[lang]/page.tsx` | Home page: each mode is a film can (`ModeSleeve`, `.sleeve-*` in `styles/home.css`) with its reel peeking out, then `WeekStrip` and "How to play" |
| `src/components/swipe/SwipeLine.tsx` | With `SwipeCard`, `SwipeGap`, `SwipeOverview` and `useSwipeTrack`, the line both games use: a sideways strip of poster cards on a time rail. While placing, `Poster` puts itself in the middle (`around` prop) and the player swipes the strip under it; the two cards beside it light up and the rail between their years glows. Earlier / Later buttons, arrow keys and an overview bar move it too. `reveal` holds the answer beside the poster while it glows; when not placing the poster sits above the strip, centered on `focus`. With `browse` (a finished Marathon), `SwipeBrowse` adds Earlier / Later buttons that scroll the strip a card at a time (`DONE_PITCH`). Styles are the `.swipe-*` classes in `styles/swipe.css`, sized by the `--swipe-*` tokens. **Swiping must stay cheap**: the glow lives inside each gap so the browser scrolls it; the gap under the poster comes from `scrollLeft / pitch` (no layout reads: `useSwipePitch` measures only on mount and resize, and `PITCH` must match the phone sizes); a move from outside the strip centres the gap by measuring it (`centreGap`); crossing a gap only moves CSS classes (`light()`) and sets the live gap (`src/lib/line/liveSlot.ts`), which the place button and the overview bar read with `useSyncExternalStore`. `SwipeLine.perf.test.tsx` fails if this regresses. Don't render React per scroll frame, and only transition `opacity`/`transform` there. |
| `src/components/game/PlaceButton.tsx` | Says where the film goes ("Between 1992 and 1997", from `t.placeAt`); its accessible name adds "Place it: ". Locked ("Loading the poster…") until the poster has loaded or failed |
| `src/components/game/Announce.tsx` | Screen-reader live region |
| `src/components/site/ExternalLink.tsx` | `target="_blank"` link that tells screen readers it opens a new tab |
| `src/test/` | Test setup and fakes: `fakePosters` (every poster becomes a local image), `fakeWikipedia` (answers summary requests, records them), `fakeAnalytics`, `fakeClipboard`, `setupGameTests`, `renderIn(lang, ui)`, `expectAccessible`, `posterControls` (moving and reading the poster, `seePoster`), `realMouse` (Playwright's real mouse, for drags and wheels) |
| `lint/filmdle-rules.mjs` | House lint rules oxlint has no built-in rule for |
| `src/i18n/` | Locale config, `messages.tsx` (all UI text), `I18nProvider`/`useI18n`, `getI18n` |
| `src/proxy.ts` | Redirects unprefixed URLs to the player's language |
| `src/components/settings/Settings.tsx` | Settings page (film-language switches) |
| `src/components/site/LanguageSwitch.tsx` | English / עברית toggle in the header |
| `src/app/[lang]/opengraph-image.tsx` | Link preview image (the reel + "Filmdle"), drawn with `next/og` and prerendered per language |
| `src/app/styles/tokens.css` | The design tokens: palette, colour roles (light/dark), spacing, type, radii, shadows, motion, component sizes |
| `src/app/globals.css` | Imports Tailwind and the tokens, plus shared classes (`.card`, `.btn-primary`, `.game-*`); `styles/home.css`, `poster.css` (the poster, its result animation, the sheets, the reels) and `swipe.css` (`.swipe-*`) hold the rest |
| `src/lib/display/palette.ts` | The few raw colours TypeScript needs (link preview image, favicon, theme colour); mirrors `tokens.css` |
| `scripts/validate-posters.mts` | Checks every poster and Wikipedia page still exists |

## Save format (`filmdle:v1`)

- `daily.days[day]` = `{ anchorYear, filmIds, placements: {slot, correct}[], languages }`. The day
  is done when `placements.length === filmIds.length` (`dailyDayDone`). `dailyLine(dailyDay)` rebuilds
  the visible line: the anchor plus placed films, with wrong ones moved to their correct position.
- `marathon.days[day]` = `{ anchorYear, languages, placements: {filmId, slot, correct}[], skipped }`.
  The next film is the first of `marathonFilmsFor(day, languages)` not yet placed or skipped;
  the day is over after `MARATHON_HEARTS` wrong placements. `marathon.stats` =
  `{ played, best, totalHits }`, updated once when a day ends.
  `marathon.free` (optional) = the latest free-play run: a `MarathonDay` plus `{ day, seed, shared? }`
  (`shared` = opened from a friend's link). It shows only on its `day`, after that
  day's run is over (or at once for a challenge), and never counts toward the stats.
- **Be backward compatible** once players have saves. `loadSave()` merges with defaults and
  `ensureDailyDay` replaces malformed days. Follow that pattern rather than bumping the
  version, which would wipe everyone's progress.

## Poster rules (product requirement)

- **Before a film is placed, the page shows its poster and nothing else about it**: no title,
  no year, no Wikipedia link, not in the DOM either (the poster's `alt` is empty and its button
  is named "The film to place…"). `DailyGame.test.tsx` checks this. The poster itself may
  show the title; that's the clue.
- **Seen before placing:** the place button stays locked ("Loading the poster…") until the
  current poster has loaded (`seen` in `useGameScreen`), or failed to: a failed poster shows 🎬,
  and the Marathon offers "Give me a different film" (`skipMarathonFilm`); it costs no heart.
- **After placing**, everything is shown: the feedback box names the film and year and offers
  "More about this film"; its card on the line shows the poster, year and title and opens the
  details sheet.
- **Avoid layout shift.** The poster's box has a fixed size (`--swipe-poster-*`) and a shimmer
  while loading; the status line under it has a fixed height. Keep it that way.
- **Result animation:** after a guess, `Poster`'s `swap` prop keeps showing the film just placed
  (`swap.film`), which glows green or red and flies off in the reading direction (separate `-rtl`
  keyframes under `[dir="rtl"]`); then the next poster eases in (`.poster-enter`). Keep `var()`
  out of `@keyframes`: Safari can't run those off the main thread. "Place it" stays locked until
  `onSwapEnd`.

## Gotchas

- **Next.js 16** with `cacheComponents` enabled. APIs differ from older versions, so read
  `node_modules/next/dist/docs/` before using unfamiliar APIs (see AGENTS.md).
- The **React Compiler lint rules** (oxlint's `react/refs`, `react/set-state-in-effect`,
  `react/purity`, …) are strict. Avoid `setState` inside effects and ref
  access during render. Prefer lazy `useState(() => ...)` initialisers in `ssr: false`
  components.
- **Tailwind v4.** `.card` and the other classes in the CSS files are unlayered, so they
  **beat Tailwind utilities**. To change a card's border or background, add a custom class
  (like `.card-good`, `.card-bad` or `.card-anchor`) instead of utility classes.
- **CSS minifier:** in the CSS files, an `animation` shorthand without a name is
  minified to `animation: none`. Use longhands (`animation-duration`, …) when the name is set
  by another class, and check the built CSS in `.next/static/chunks/*.css`. If a CSS edit
  doesn't show up there, Turbopack's cache is stale: `rm -rf .next` and build again.
- The site has a light and a dark theme (see "Styling"). Check new colours in both.
- **Film years** are the original release year (the first public screening, often a festival
  premiere), not a re-release or a remaster.

## Code style

- No ESLint or Prettier: oxlint lints (type-aware rules come from `oxlint-tsgolint`, built
  on TypeScript 7) and oxfmt formats everything except `films.json` (one film per line)
  and Markdown. Disable comments use `// oxlint-disable-next-line <rule>` plus a reason.
- **TypeScript 7** is the native (Go) compiler. It has no JavaScript API yet, so `next build`
  type-checks by running the local `tsc` CLI (Next's default `experimental.useTypeScriptCli`).
- TypeScript is strict with `noUncheckedIndexedAccess`: indexing an array or record gives
  `T | undefined`, so handle the missing case (`getFilm` accepts `undefined` for this).
- Lint is strict and type-aware. Don't silence a rule without a comment saying why.
- House style (one component per file, specific file names, no barrels, `a ? <B /> : null`, no
  `typeof` in types, …) is in `.claude/rules/code-style.md`; lint enforces most of it.
- **Accessibility is checked in two layers; keep both green:**
  1. **Lint:** every `jsx-a11y` rule is an error in `.oxlintrc.json` (listed explicitly, since
     oxlint only turns on some of them by category). Only `prefer-tag-over-role` is off, with its reason.
  2. **Component tests:** `expectAccessible(container)` runs axe (WCAG A/AA + best practices,
     colour contrast included) on each game state and the settings page, in Chromium at phone
     width (390px) with the real site CSS (`globals.css` through `@tailwindcss/vite`). It also
     fails if the page scrolls sideways. The home page is a server component and isn't covered.
     axe can't measure contrast over the gradient at the top of the page (it reports
     "needs review" there, which doesn't fail), and it skips `aria-hidden` text. Check those by hand:
     small text needs **4.5:1** in both themes (`--color-muted` and the rail's `--color-faint`), and
     icons and borders need 3:1.
- Every control needs an accessible name; decorative emoji/SVGs get `aria-hidden`; results are
  announced through `Announce`. Anything that moves respects
  `prefers-reduced-motion` (CSS media query, or `canAnimate()` in JavaScript). Focus rings must
  stay visible: where a mask or `overflow` would clip one (the swipe line), draw it on a parent.

## Testing tips

- Project test rules live in `.claude/rules/testing.md` (import everything, never use `describe`, avoid mocks, parameterized tests use `it.for`); oxlint enforces them.

- Put logic tests in a `__tests__/` folder next to the code they test (`src/lib/games/__tests__/`, …; vitest, node environment, `@/` alias set in
  `vitest.config.mts`).
- `src/lib/catalog/__tests__/golden.test.ts` snapshots a month of daily picks. If it fails, the
  daily puzzles changed for everyone: fix the code, don't update the snapshot (unless
  you added films on purpose, then run `pnpm vitest -u`).
- Component tests live in a `__tests__/` folder inside each component folder (`src/components/daily/__tests__/`, …) and run in **Vitest Browser Mode**
  (headless Chromium through `@vitest/browser-playwright`; the `browser` project in
  `vitest.config.mts`). The site CSS is loaded (`globals.css` via `@tailwindcss/vite`) and the viewport is 390px wide, in both colour schemes. Click with `await userEvent.click(el)`
  from `vitest/browser` (real pointer events), so helpers that click are `async`. Locally,
  a fresh machine needs `pnpm exec playwright install chromium` once. `setupGameTests()` points every
  poster at a local image (`fakePosters`) and answers Wikipedia with a fixed summary (`fakeWikipedia`),
  so tests never touch the network. Wait for the poster with `seePoster()` before placing, render with
  `renderIn("en", <DailyGame />)`, and call `expectAccessible(container)` (axe).
  Fire `animationEnd` on `.poster-swap` to finish the result animation, and `fireEvent.error` on
  `.poster-img` to simulate a broken poster.
- For UI checks, use the pre-installed Playwright/Chromium against `next start`. Wikimedia
  may be blocked in sandboxes; route `https://upload.wikimedia.org/**` to a local image if so.
- To simulate later days, use `page.clock.setSystemTime(new Date('2026-11-02T10:00:00'))`
  and reload.

## Git workflow

- Feature work goes on a branch and is merged into `main` by PR. `main` deploys to
  production on Vercel, and other branches get preview URLs.
- Don't commit model identifiers.

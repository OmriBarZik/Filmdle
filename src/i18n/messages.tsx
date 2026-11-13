import type { ReactNode } from "react";
import type { SlotLabels } from "@/lib/line/timeline";
import type { Locale } from "./config";

/**
 * All UI text, per language. Values can be strings, functions (for numbers and
 * names), or small bits of JSX where a sentence has bold/italic parts.
 *
 * Film titles come from `films.json`. Wrap them in <bdi> when they appear inside a
 * sentence so they don't scramble right-to-left text.
 */
export type Messages = {
  meta: {
    title: string;
    description: string;
    dailyTitle: string;
    marathonTitle: string;
    settingsTitle: string;
  };
  common: {
    languageLabel: string;
    loadingGame: string;
    /** Steps the poster one gap toward older / newer films. */
    earlier: string;
    later: string;
    /** Name of the swipeable line of cards. */
    lineLabel: string;
    /** The poster being placed: its button opens it full screen. */
    posterLabel: string;
    posterFailed: string;
    differentFilm: string;
    /** Read to screen readers after links that open in a new tab. */
    newTab: string;
    startingYear: string;
    shareResult: string;
    copied: string;
    copyFailed: string;
    /** Accessible name of the place button, e.g. "Place it: Between 1992 and 1997". */
    placeIt: (label: string) => string;
    /** The place button while the poster is still loading. */
    waitForPoster: string;
    /** The "1/2" button on a stack of same-year cards, which brings the next one to the front. */
    stackNext: (shown: number, total: number, year: number) => string;
    /** The keyboard hints under the place button (pointer devices only). */
    keys: { space: string; enter: string; move: string; zoom: string; place: string };
    /** Read after a placed film's card (its year and title): it opens the film's details. */
    cardDetails: string;
    films: (n: number) => string;
  };
  /** The full-screen poster and the film's details after it was placed. */
  info: {
    close: string;
    posterAlt: string;
    filmPosterAlt: (title: string) => string;
    released: (year: number) => string;
    loading: string;
    failed: string;
    wikipedia: string;
    more: string;
  };
  slots: SlotLabels;
  /** What the place button says: where today's film goes, as a phrase. */
  placeAt: SlotLabels;
  home: {
    headline: string;
    tagline: string;
    modesLabel: string;
    dailyTag: string;
    dailyDesc: string;
    marathonTag: string;
    marathonDesc: string;
    weekHeading: string;
    weekCount: (n: number) => string;
    weekDay: (day: string, played: boolean) => string;
    howTo: string;
    rules: ReactNode[];
    footer: string;
    github: string;
  };
  daily: {
    name: string;
    intro: (year: number) => ReactNode;
    progress: (n: number, total: number) => string;
    deckLabel: (n: number, total: number) => string;
    correct: string;
    wrong: string;
    reveal: (title: string, year: number) => ReactNode;
    perfect: string;
    score: (hits: number, total: number) => string;
    stats: { played: string; perfect: string; streak: string; bestStreak: string };
    tomorrow: string;
    shareHead: (hits: number, total: number) => string;
  };
  settings: {
    name: string;
    filmsHeading: string;
    filmsIntro: string;
    kinds: Record<Locale, { name: string; desc: string }>;
    count: (n: number) => string;
    lastOne: string;
    applyNote: string;
    /** Added to share text when only one kind is on, since the puzzle differs. */
    shareTag: Record<Locale, string>;
    back: string;
  };
  marathon: {
    name: string;
    intro: (year: number) => ReactNode;
    hearts: (left: number, total: number) => string;
    score: (hits: number) => string;
    deckLabel: (n: number) => string;
    lostHeart: string;
    over: string;
    ranOut: string;
    final: (hits: number) => string;
    stats: { today: string; best: string; played: string; average: string; run: string };
    tomorrow: string;
    shareHead: (hits: number) => string;
    /** Free play: another run after the daily one, with its own films and no stats. */
    playAgain: string;
    freeIntro: (year: number) => ReactNode;
    freeNote: string;
    shareFree: string;
    freeShareHead: (hits: number) => string;
    /** The dare under a free-play share; its link opens the same films. */
    shareDare: (hits: number) => string;
    /** A run opened from a friend's link. */
    challengeIntro: (year: number) => ReactNode;
    playDaily: string;
  };
};

const enFilms = (n: number) => `${n} film${n === 1 ? "" : "s"}`;

const en: Messages = {
  meta: {
    title: "Filmdle — the daily movie poster timeline game",
    description:
      "See a film poster, guess when it came out, and place it on a timeline. A new puzzle every day.",
    dailyTitle: "Daily Five · Filmdle",
    marathonTitle: "Marathon · Filmdle",
    settingsTitle: "Settings · Filmdle",
  },
  common: {
    languageLabel: "Language",
    loadingGame: "Dimming the lights…",
    earlier: "Earlier",
    later: "Later",
    lineLabel: "Your timeline. Swipe to move the poster between two films.",
    posterLabel: "The film to place. Open the poster full screen",
    posterFailed: "This poster couldn't load.",
    differentFilm: "Give me a different film",
    newTab: "(opens in a new tab)",
    startingYear: "Starting year",
    shareResult: "Share result",
    copied: "Copied!",
    copyFailed: "Couldn't copy",
    placeIt: (l) => `Place it: ${l}`,
    waitForPoster: "Loading the poster…",
    stackNext: (shown, total, year) => `${shown}/${total} from ${year}: show the next film`,
    keys: { space: "Space", enter: "Enter", move: "move", zoom: "full screen", place: "place it" },
    cardDetails: "(details)",
    films: enFilms,
  },
  info: {
    close: "Close",
    posterAlt: "The poster of the film to place",
    filmPosterAlt: (title) => `Poster of ${title}`,
    released: (y) => `Released in ${y}`,
    loading: "Loading the story…",
    failed: "Couldn't load the details right now.",
    wikipedia: "Read more on Wikipedia",
    more: "More about this film",
  },
  slots: {
    anywhere: "Anywhere",
    before: (y) => `Before ${y}`,
    after: (y) => `After ${y}`,
    in: (y) => `In ${y}`,
    between: (a, b) => `${a} – ${b}`,
  },
  placeAt: {
    anywhere: "Anywhere",
    before: (y) => `Before ${y}`,
    after: (y) => `After ${y}`,
    in: (y) => `In ${y}`,
    between: (a, b) => `Between ${a} and ${b}`,
  },
  home: {
    headline: "When did this film come out?",
    tagline:
      "A daily movie game. Look at a poster, guess its year, and slide it into place on a timeline.",
    modesLabel: "Games",
    dailyTag: "5 films",
    dailyDesc: "Place five posters on one line. Same films for everyone.",
    marathonTag: "3 hearts",
    marathonDesc: "As many films as you can. Three wrong and you're out.",
    weekHeading: "This week",
    weekCount: (n) => `${n} of 7 days played`,
    weekDay: (day, played) => `${day}: ${played ? "played" : "not played"}`,
    howTo: "How to play",
    rules: [
      <>
        <b className="text-ink">Daily Five:</b> your line starts with a single year (say 1980). Look
        at the first poster and swipe it <i>before 1980</i> or <i>after 1980</i>. It joins the line,
        and the next film has one more gap to choose from. Five films, one at a time — each right
        placement is a 🟩.
      </>,
      <>
        <b className="text-ink">Marathon:</b> the same idea, without the limit. Keep placing films
        on one growing line for as long as you can. Each wrong placement costs a ❤️ — after three,
        your score for the day is how many you got right.
      </>,
      "Tap the poster to see it full screen. Once it's placed, tap any card for the film's details.",
      "Films from the same year count either way. The year is the film's first release.",
      "Everything is saved in your browser. A new day starts at your local midnight.",
    ],
    footer: "Posters and film details come from Wikipedia; they belong to their rights holders.",
    github: "Open source on GitHub",
  },
  daily: {
    name: "Daily Five",
    intro: (year) => (
      <>
        Your line starts at <b className="text-ink">{year}</b>. Swipe each poster to where it
        belongs — one film at a time.
      </>
    ),
    progress: (n, total) => `Film ${n} of ${total}`,
    deckLabel: (n, total) => `Film ${n} of ${total}`,
    correct: "✅ Correct!",
    wrong: "❌ Not quite.",
    reveal: (title, year) => (
      <>
        “<bdi>{title}</bdi>” came out in <b>{year}</b>.
      </>
    ),
    perfect: "Perfect! 🎉",
    score: (hits, total) => `${hits} / ${total} placed right`,
    stats: { played: "Played", perfect: "Perfect", streak: "Streak", bestStreak: "Best streak" },
    tomorrow: "New films tomorrow.",
    shareHead: (hits, total) => `Filmdle Daily Five ${hits}/${total}`,
  },
  settings: {
    name: "Settings",
    filmsHeading: "Films",
    filmsIntro: "Choose which films can show up in your puzzles.",
    kinds: {
      en: { name: "International films", desc: "Classics and blockbusters from around the world" },
      he: { name: "Israeli films", desc: "Israeli cinema, from Sallah Shabati on" },
    },
    count: enFilms,
    lastOne: "Keep at least one kind of film on.",
    applyNote:
      "Changes apply to puzzles you haven't started yet. With only one kind on, your daily puzzle is different from players who have both.",
    shareTag: { en: "International films only", he: "Israeli films only" },
    back: "Back to the games",
  },
  marathon: {
    name: "Marathon",
    intro: (year) => (
      <>
        Your line starts at <b className="text-ink">{year}</b>. Place as many films as you can —
        three wrong and the run is over.
      </>
    ),
    hearts: (left, total) => `${left} of ${total} hearts left`,
    score: (hits) => `Score: ${hits}`,
    deckLabel: (n) => `Film ${n}`,
    lostHeart: "You lost a heart.",
    over: "Out of hearts!",
    ranOut: "You placed every film we have!",
    final: (hits) => `${enFilms(hits)} placed right`,
    stats: { today: "Today", best: "Best", played: "Played", average: "Average", run: "This run" },
    tomorrow: "A new marathon tomorrow.",
    shareHead: (hits) => `Filmdle Marathon · ${hits} 🎬`,
    playAgain: "Play again",
    freeIntro: (year) => (
      <>
        <b className="text-ink">Free play</b>, just for fun: it isn&apos;t the daily marathon and
        doesn&apos;t count toward your stats. Your line starts at <b className="text-ink">{year}</b>
        .
      </>
    ),
    freeNote: "Free play doesn't count toward your stats. A new daily marathon tomorrow.",
    shareFree: "Challenge a friend",
    freeShareHead: (hits) => `Filmdle Marathon · Free play · ${hits} 🎬`,
    shareDare: (hits) => `Same films. Can you beat my ${hits}? 🎯`,
    challengeIntro: (year) => (
      <>
        <b className="text-ink">Challenge:</b> a friend sent you the films they played. How many can
        you place right? Free play, so it doesn&apos;t count toward your stats. Your line starts at{" "}
        <b className="text-ink">{year}</b>.
      </>
    ),
    playDaily: "Play today's marathon",
  },
};

const heFilms = (n: number) => (n === 1 ? "סרט אחד" : `${n} סרטים`);

const he: Messages = {
  meta: {
    title: "Filmdle — משחק ציר הזמן היומי של כרזות הסרטים",
    description: "ראו כרזה של סרט, נחשו מתי הוא יצא ושבצו אותו על ציר הזמן. חידה חדשה בכל יום.",
    dailyTitle: "החמישייה היומית · Filmdle",
    marathonTitle: "מרתון · Filmdle",
    settingsTitle: "הגדרות · Filmdle",
  },
  common: {
    languageLabel: "שפה",
    loadingGame: "מחשיכים את האולם…",
    earlier: "מוקדם יותר",
    later: "מאוחר יותר",
    lineLabel: "ציר הזמן שלכם. החליקו כדי להזיז את הכרזה בין שני סרטים.",
    posterLabel: "הסרט לשיבוץ. לפתיחת הכרזה במסך מלא",
    posterFailed: "הכרזה הזאת לא נטענה.",
    differentFilm: "תנו לי סרט אחר",
    newTab: "(נפתח בכרטיסייה חדשה)",
    startingYear: "שנת ההתחלה",
    shareResult: "שיתוף התוצאה",
    copied: "הועתק!",
    copyFailed: "ההעתקה נכשלה",
    placeIt: (l) => `לשבץ: ${l}`,
    waitForPoster: "טוען את הכרזה…",
    stackNext: (shown, total, year) => `${shown}/${total} משנת ${year}: להצגת הסרט הבא`,
    keys: { space: "רווח", enter: "Enter", move: "הזזה", zoom: "מסך מלא", place: "שיבוץ" },
    cardDetails: "(פרטים)",
    films: heFilms,
  },
  info: {
    close: "סגירה",
    posterAlt: "הכרזה של הסרט לשיבוץ",
    filmPosterAlt: (title) => `הכרזה של ${title}`,
    released: (y) => `יצא ב־${y}`,
    loading: "טוען את הסיפור…",
    failed: "לא הצלחנו לטעון את הפרטים כרגע.",
    wikipedia: "להמשך קריאה בוויקיפדיה",
    more: "עוד על הסרט",
  },
  slots: {
    anywhere: "בכל מקום",
    before: (y) => `לפני ${y}`,
    after: (y) => `אחרי ${y}`,
    in: (y) => `ב־${y}`,
    between: (a, b) => `${a} – ${b}`,
  },
  placeAt: {
    anywhere: "בכל מקום",
    before: (y) => `לפני ${y}`,
    after: (y) => `אחרי ${y}`,
    in: (y) => `ב־${y}`,
    between: (a, b) => `בין ${a} ל־${b}`,
  },
  home: {
    headline: "מתי הסרט הזה יצא?",
    tagline: "משחק סרטים יומי. הסתכלו על הכרזה, נחשו את השנה והחליקו אותה למקום על ציר הזמן.",
    modesLabel: "משחקים",
    dailyTag: "5 סרטים",
    dailyDesc: "משבצים חמש כרזות על ציר אחד. אותם סרטים לכולם.",
    marathonTag: "3 לבבות",
    marathonDesc: "כמה שיותר סרטים. שלוש טעויות ואתם בחוץ.",
    weekHeading: "השבוע",
    weekCount: (n) => `שיחקתם ${n} מתוך 7 ימים`,
    weekDay: (day, played) => `${day}: ${played ? "שיחקתם" : "לא שיחקתם"}`,
    howTo: "איך משחקים",
    rules: [
      <>
        <b className="text-ink">החמישייה היומית:</b> הציר שלכם מתחיל בשנה אחת (נגיד 1980). הסתכלו על
        הכרזה הראשונה והחליקו אותה <i>לפני 1980</i> או <i>אחרי 1980</i>. הסרט מצטרף לציר, ולסרט הבא
        יש עוד רווח אחד לבחור ממנו. חמישה סרטים, אחד בכל פעם — כל שיבוץ נכון הוא 🟩.
      </>,
      <>
        <b className="text-ink">מרתון:</b> אותו רעיון, בלי הגבלה. ממשיכים לשבץ סרטים על ציר אחד
        שהולך וגדל, כמה שאפשר. כל שיבוץ שגוי עולה ❤️ — אחרי שלוש טעויות, הניקוד היומי שלכם הוא מספר
        הסרטים ששיבצתם נכון.
      </>,
      "הקישו על הכרזה כדי לראות אותה במסך מלא. אחרי השיבוץ, הקישו על כל קלף כדי לראות את פרטי הסרט.",
      "סרטים מאותה שנה נחשבים נכונים בשני הצדדים. השנה היא שנת ההקרנה הראשונה.",
      "הכול נשמר בדפדפן שלכם. יום חדש מתחיל בחצות לפי השעה המקומית שלכם.",
    ],
    footer: "הכרזות ופרטי הסרטים מגיעים מוויקיפדיה, והזכויות בהם שמורות לבעליהן.",
    github: "קוד פתוח ב־GitHub",
  },
  daily: {
    name: "החמישייה היומית",
    intro: (year) => (
      <>
        הציר שלכם מתחיל ב־<b className="text-ink">{year}</b>. החליקו כל כרזה למקום שלה — סרט אחד בכל
        פעם.
      </>
    ),
    progress: (n, total) => `סרט ${n} מתוך ${total}`,
    deckLabel: (n, total) => `סרט ${n} מתוך ${total}`,
    correct: "✅ נכון!",
    wrong: "❌ לא בדיוק.",
    reveal: (title, year) => (
      <>
        ״<bdi>{title}</bdi>״ יצא ב־<b>{year}</b>.
      </>
    ),
    perfect: "מושלם! 🎉",
    score: (hits, total) => `${hits} / ${total} במקום הנכון`,
    stats: { played: "משחקים", perfect: "מושלמים", streak: "רצף", bestStreak: "רצף שיא" },
    tomorrow: "סרטים חדשים מחר.",
    shareHead: (hits, total) => `Filmdle החמישייה היומית ${hits}/${total}`,
  },
  settings: {
    name: "הגדרות",
    filmsHeading: "סרטים",
    filmsIntro: "בחרו אילו סרטים יכולים להופיע בחידות שלכם.",
    kinds: {
      en: { name: "סרטים בינלאומיים", desc: "קלאסיקות ושוברי קופות מכל העולם" },
      he: { name: "סרטים ישראליים", desc: "הקולנוע הישראלי, מסאלח שבתי והלאה" },
    },
    count: heFilms,
    lastOne: "צריך להשאיר לפחות סוג אחד של סרטים.",
    applyNote:
      "השינויים חלים על חידות שעוד לא התחלתם. כשרק סוג אחד מסומן, החידה היומית שלכם שונה משל שחקנים שמסמנים את שניהם.",
    shareTag: { en: "רק סרטים בינלאומיים", he: "רק סרטים ישראליים" },
    back: "חזרה למשחקים",
  },
  marathon: {
    name: "מרתון",
    intro: (year) => (
      <>
        הציר שלכם מתחיל ב־<b className="text-ink">{year}</b>. שבצו כמה שיותר סרטים — שלוש טעויות
        והמרתון נגמר.
      </>
    ),
    hearts: (left, total) => `נשארו ${left} מתוך ${total} לבבות`,
    score: (hits) => `ניקוד: ${hits}`,
    deckLabel: (n) => `סרט ${n}`,
    lostHeart: "איבדתם לב.",
    over: "נגמרו הלבבות!",
    ranOut: "שיבצתם את כל הסרטים שיש לנו!",
    final: (hits) => `${heFilms(hits)} במקום הנכון`,
    stats: { today: "היום", best: "שיא", played: "משחקים", average: "ממוצע", run: "הסבב הזה" },
    tomorrow: "מרתון חדש מחר.",
    shareHead: (hits) => `Filmdle מרתון · ${hits} 🎬`,
    playAgain: "שחקו שוב",
    freeIntro: (year) => (
      <>
        <b className="text-ink">משחק חופשי</b>, סתם בשביל הכיף: זה לא המרתון היומי והוא לא נספר
        בסטטיסטיקה. הציר שלכם מתחיל ב־<b className="text-ink">{year}</b>.
      </>
    ),
    freeNote: "משחק חופשי לא נספר בסטטיסטיקה. מרתון יומי חדש מחר.",
    shareFree: "אתגרו חברים",
    freeShareHead: (hits) => `Filmdle מרתון · משחק חופשי · ${hits} 🎬`,
    shareDare: (hits) => `אותם סרטים. תצליחו לעבור את ה־${hits} שלי? 🎯`,
    challengeIntro: (year) => (
      <>
        <b className="text-ink">אתגר:</b> חבר או חברה שלחו לכם את הסרטים ששיחקו. כמה מהם תשבצו נכון?
        זה משחק חופשי, והוא לא נספר בסטטיסטיקה. הציר שלכם מתחיל ב־
        <b className="text-ink">{year}</b>.
      </>
    ),
    playDaily: "למרתון של היום",
  },
};

export const MESSAGES: Record<Locale, Messages> = { en, he };

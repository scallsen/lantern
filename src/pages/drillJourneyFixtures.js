import { getTextbook } from '../data/textbooks.js'

// One fabricated learner working through Genki 1 Lesson 3, used by
// DrillJourney.stories.jsx. The words are the lesson's real vocabulary; the
// session (who missed what, in which round) is invented but shaped like the
// drill's real engine output — a first pass over every word, then redo rounds
// over whatever was missed until nothing is left.

export const TEXTBOOK = getTextbook('genki-1')
export const CHAPTER = TEXTBOOK.chapters[2]       // Lesson 3
export const NEXT_CHAPTER = TEXTBOOK.chapters[3]  // Lesson 4
export const CHAPTERS_DONE_BEFORE = 2

export const WORDS = [
  { id: 'eiga',      kanji: '映画',   kana: 'えいが',     english: 'movie' },
  { id: 'ongaku',    kanji: '音楽',   kana: 'おんがく',   english: 'music' },
  { id: 'zasshi',    kanji: '雑誌',   kana: 'ざっし',     english: 'magazine' },
  { id: 'asagohan',  kanji: '朝ご飯', kana: 'あさごはん', english: 'breakfast' },
  { id: 'osake',     kanji: 'お酒',   kana: 'おさけ',     english: 'sake; alcohol' },
  { id: 'ocha',      kanji: 'お茶',   kana: 'おちゃ',     english: 'green tea' },
  { id: 'bangohan',  kanji: '晩ご飯', kana: 'ばんごはん', english: 'dinner' },
  { id: 'ie',        kanji: '家',     kana: 'いえ',       english: 'home; house' },
  { id: 'gakkou',    kanji: '学校',   kana: 'がっこう',   english: 'school' },
  { id: 'ashita',    kanji: '明日',   kana: 'あした',     english: 'tomorrow' },
  { id: 'konban',    kanji: '今晩',   kana: 'こんばん',   english: 'tonight' },
  { id: 'mainichi',  kanji: '毎日',   kana: 'まいにち',   english: 'every day' },
  { id: 'shuumatsu', kanji: '週末',   kana: 'しゅうまつ', english: 'weekend' },
  { id: 'kaeru',     kanji: '帰る',   kana: 'かえる',     english: 'to go back; to return' },
  { id: 'kiku',      kanji: '聞く',   kana: 'きく',       english: 'to listen; to hear' },
  { id: 'nomu',      kanji: '飲む',   kana: 'のむ',       english: 'to drink' },
  { id: 'hanasu',    kanji: '話す',   kana: 'はなす',     english: 'to speak; to talk' },
  { id: 'yomu',      kanji: '読む',   kana: 'よむ',       english: 'to read' },
  { id: 'okiru',     kanji: '起きる', kana: 'おきる',     english: 'to get up' },
  { id: 'neru',      kanji: '寝る',   kana: 'ねる',       english: 'to sleep; to go to sleep' },
]

export const WORD_BY_ID = Object.fromEntries(WORDS.map(w => [w.id, w]))

// Misses per word within each round. Round 1 is every word; each later round
// is exactly the words that had a miss in the round before.
export const ROUNDS = [
  { size: 20, misses: { zasshi: 2, bangohan: 1, shuumatsu: 3, okiru: 1, kiku: 1, konban: 2 } },
  { size: 6, misses: { shuumatsu: 1, konban: 1 } },
  { size: 2, misses: {} },
]

export const SESSION = (() => {
  const cumulative = {}
  for (const round of ROUNDS) {
    for (const [id, n] of Object.entries(round.misses)) cumulative[id] = (cumulative[id] ?? 0) + n
  }
  const firstTry = ROUNDS[0].size - Object.keys(ROUNDS[0].misses).length
  const struggled = Object.entries(cumulative)
    .sort((a, b) => b[1] - a[1])
    .map(([id, misses]) => ({ ...WORD_BY_ID[id], misses }))
  return {
    total: ROUNDS[0].size,
    firstTry,
    firstTryPct: Math.round((firstTry / ROUNDS[0].size) * 100),
    rounds: ROUNDS.length,
    cumulative,
    struggled,
    bestStreak: 9,
    minutes: 6,
    // What today's engine actually hands the final done screen: the last
    // round's own counters, since every redo re-inits mistakeCounts.
    lastRoundOnly: { correct: ROUNDS.at(-1).size, troubled: 0, mistakeCounts: ROUNDS.at(-1).misses },
  }
})()

export const LAST_RUN = { firstTry: 12, total: 20, whenLabel: '3 days ago' }
export const LAST_RUN_PCT = Math.round((LAST_RUN.firstTry / LAST_RUN.total) * 100)

// Words missed in earlier runs of the same lesson. Nothing records this
// today — sublists only keeps { lastReviewed, correct, total } per chapter —
// so this is the data the "across sessions" variant would need to start
// storing.
export const PAST_SESSIONS = [
  { whenLabel: '3 days ago', missed: ['shuumatsu', 'zasshi', 'kaeru', 'konban', 'neru', 'ongaku', 'okiru', 'ocha'] },
  { whenLabel: '9 days ago', missed: ['shuumatsu', 'kaeru', 'asagohan', 'zasshi', 'mainichi'] },
]

// Missed in at least two of the last three runs, counting this one.
export const CHRONIC = (() => {
  const counts = {}
  const runs = [Object.keys(SESSION.cumulative), ...PAST_SESSIONS.map(s => s.missed)]
  for (const run of runs) for (const id of run) counts[id] = (counts[id] ?? 0) + 1
  return Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([id, runsMissed]) => ({ ...WORD_BY_ID[id], runsMissed }))
})()

// First interval ts-fsrs gives a brand-new card per rating, with the app's
// own generatorParameters (fuzz off): Again/Hard/Good all stay in same-day
// learning steps (1/6/10 min); only Easy graduates straight to review, 8 days
// out. That's why the "head start" variant has two buckets, not four.
export const FSRS_EASY_FIRST_INTERVAL_DAYS = 8

export const READINESS_TARGET_PCT = 80

export const DECKS = {
  'textbook-genki-1': { id: 'textbook-genki-1', name: 'Genki 1', active: true, source: 'imported', addedAt: 0 },
  'immersion-words': { id: 'immersion-words', name: 'Immersion Words', active: true, source: 'imported', addedAt: 0 },
}

// ── What's wrong with the journey today ──────────────────────────────────────

export const ISSUES = [
  { id: 'mid', title: 'Mid-loop screen says "Session complete"', detail: 'After round 1 the screen reads as the end, while 6 words are still unlearned. The Reviews panel shows up there too.' },
  { id: 'lost', title: 'Struggled words vanish by the last round', detail: 'Every redo resets the miss counts, so the final screen shows nothing missed and pre-selects nothing to send.' },
  { id: 'stats', title: 'Redo rounds overwrite the lesson score', detail: "Each round saves its own clean count against the whole lesson — a clean last round of 2 saves as 2/20, which is worse than the real first pass." },
  { id: 'decks', title: 'Two ways into Reviews that disagree', detail: "The done screen sends a hand-picked subset to any deck; moving to the next lesson sends the whole lesson to the book's deck." },
  { id: 'next', title: 'No next step from the finish', detail: 'End review drops you on the chapter list; the next lesson is hidden in a dropdown.' },
  { id: 'ready', title: 'No "am I ready to move on?" signal', detail: 'Nothing compares this run with the last one, or with a target.' },
  { id: 'reward', title: "Finishing doesn't feel like finishing", detail: 'The last screen looks and sounds like every other round.' },
  { id: 'chronic', title: 'Words you keep missing go unnoticed', detail: 'A word missed in every run of a lesson looks the same as one missed once.' },
]

// ── Candidate solutions per stage ────────────────────────────────────────────

export const STAGES = [
  {
    id: 'start',
    title: '1 · Choosing what to drill',
    question: 'After a drilled lesson, does the home card push you on, or let you stay?',
    variants: [
      { id: 'today', name: 'Today', fixes: [], today: true, tradeoff: 'The main button is "Redo"; moving on is hidden in the dropdown, with no hint about which one you should pick.' },
      { id: 'explicit', name: 'Next lesson first', fixes: ['next'], tradeoff: 'Makes moving on the default even when the last run went badly.' },
      { id: 'readiness', name: 'Readiness target', fixes: ['next', 'ready'], recommended: true, tradeoff: 'Needs a stored first-try score per lesson (the "stats" fix). The target is a nudge, not a lock.' },
    ],
  },
  {
    id: 'round',
    title: '2 · End of a round, words still left',
    question: 'What does the screen between rounds say and offer?',
    variants: [
      { id: 'today', name: 'Today', fixes: [], today: true, tradeoff: '"Session complete" with 6 words to go; Restart and End review compete with the one thing you should do.' },
      { id: 'checkpoint', name: 'Round checkpoint', fixes: ['mid'], recommended: true, tradeoff: 'One extra tap per round.' },
      { id: 'auto', name: 'Keep going', fixes: ['mid'], tradeoff: 'No screen at all — fastest, but no pause and no view of which words are coming back.' },
    ],
  },
  {
    id: 'cleared',
    title: '3 · Lesson cleared',
    question: 'What does finishing look like, and what does it remember?',
    variants: [
      { id: 'today', name: 'Today', fixes: [], today: true, tradeoff: 'Shows the last round only: 2 correct, 0 troubled, nothing flagged.' },
      { id: 'report', name: 'Lesson report', fixes: ['lost', 'stats', 'reward', 'ready'], recommended: true, tradeoff: 'Needs the engine to carry misses across rounds and save the first pass once.' },
      { id: 'moment', name: 'Big moment', fixes: ['lost', 'reward'], tradeoff: 'Feels good, says less: no comparison with last time.' },
    ],
  },
  {
    id: 'send',
    title: '4 · Sending words to Reviews',
    question: 'Whole lesson or only the hard ones? This session or history too?',
    variants: [
      { id: 'today', name: 'Today', fixes: [], today: true, tradeoff: "Pre-ticks only the last round's misses — after a clean final round, nothing — and the deck is whatever you pick." },
      { id: 'pick', name: 'Pick words', fixes: ['lost'], tradeoff: "Today's control with the miss counts fixed. The other 14 words still trigger the send prompt when you move on, so there are still two paths." },
      { id: 'chapter', name: 'Whole lesson', fixes: ['decks'], tradeoff: 'One path into Reviews, but the drill you just did counts for nothing there.' },
      { id: 'headstart', name: 'Whole lesson, head start', fixes: ['decks', 'lost'], recommended: true, tradeoff: 'Treats the drill as the first review. Words right first time skip the learning steps — a wrong guess costs one early lapse.' },
      { id: 'history', name: 'Hardest across sessions', fixes: ['lost', 'chronic'], tradeoff: 'Needs per-word miss history, which nothing stores yet. Still a subset, so two paths remain.' },
    ],
  },
  {
    id: 'next',
    title: '5 · What next',
    question: 'Once the words are sent, where does the finish lead?',
    variants: [
      { id: 'today', name: 'Today', fixes: [], today: true, tradeoff: 'End review lands on the chapter list with "Redo Lesson 3" as the main button.' },
      { id: 'nextButton', name: 'Next lesson button', fixes: ['next'], tradeoff: 'Pushes on regardless of how the run went.' },
      { id: 'readiness', name: 'Readiness-aware', fixes: ['next', 'ready'], recommended: true, tradeoff: 'Two layouts to maintain; the target has to be explained once.' },
      { id: 'focus', name: 'Focus round offer', fixes: ['next', 'lost'], tradeoff: 'A third choice on a screen that should have one main action.' },
    ],
  },
]

export const PRESETS = {
  today: { start: 'today', round: 'today', cleared: 'today', send: 'today', next: 'today' },
  recommended: { start: 'readiness', round: 'checkpoint', cleared: 'report', send: 'headstart', next: 'readiness' },
  minimalFix: { start: 'today', round: 'checkpoint', cleared: 'report', send: 'pick', next: 'nextButton' },
}

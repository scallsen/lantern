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
    cumulative,
    struggled,
    // What today's engine actually hands the final done screen: the last
    // round's own counters, since every redo re-inits mistakeCounts.
    lastRoundOnly: { correct: ROUNDS.at(-1).size, troubled: 0, mistakeCounts: ROUNDS.at(-1).misses },
  }
})()

// Earlier runs of this lesson, newest first, as first-try counts out of the
// same 20 words. Nothing stores this today — sublists keeps one
// { lastReviewed, correct, total } per chapter and each run overwrites it —
// so the summary's history needs a small per-run log to exist.
export const PREVIOUS_RUNS = [
  { whenLabel: '2 hours ago', firstTry: 11 },
  { whenLabel: 'Yesterday', firstTry: 7 },
]

// First interval ts-fsrs gives a brand-new card per rating, with the app's
// own generatorParameters (fuzz off): Again/Hard/Good all stay in same-day
// learning steps (1/6/10 min); only Easy graduates straight to review, 8 days
// out. So "Add to Reviews" can give right-first-time words a head start by
// rating them Easy, and leave the rest as new cards.
export const FSRS_EASY_FIRST_INTERVAL_DAYS = 8

export const READINESS_TARGET_PCT = 80

// ── What's wrong with the journey today ──────────────────────────────────────

export const ISSUES = [
  { id: 'mid', title: 'Mid-loop screen says "Session complete"', detail: 'After round 1 the screen reads as the end, while 6 words are still unlearned. The Reviews panel shows up there too.' },
  { id: 'lost', title: 'Struggled words vanish by the last round', detail: 'Every redo resets the miss counts, so the final screen shows nothing missed and pre-selects nothing to send.' },
  { id: 'stats', title: 'Redo rounds overwrite the lesson score', detail: "Each round saves its own clean count against the whole lesson — a clean last round of 2 saves as 2/20, which is worse than the real first pass." },
  { id: 'decks', title: 'Two ways into Reviews that disagree', detail: "The done screen sends a hand-picked subset to any deck; moving to the next lesson sends the whole lesson to the book's deck." },
  { id: 'next', title: 'No next step from the finish', detail: 'End review drops you on the chapter list; the next lesson is hidden in a dropdown.' },
  { id: 'ready', title: 'No "am I ready to move on?" signal', detail: 'Nothing compares this run with earlier ones, or with a target.' },
  { id: 'reward', title: "Finishing doesn't feel like finishing", detail: 'The last screen looks and sounds like every other round.' },
]

// ── Candidate solutions per stage ────────────────────────────────────────────

const END_FIXES = ['lost', 'stats', 'decks', 'next', 'ready', 'reward']

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
      { id: 'checkpoint', name: 'Round checkpoint', fixes: ['mid'], recommended: true, tradeoff: 'One extra tap per round. The buttons sit in the sticky bottom bar, so a long list never pushes them off screen.' },
      { id: 'auto', name: 'Keep going', fixes: ['mid'], tradeoff: 'No screen at all — fastest, but no pause and no view of which words are coming back.' },
    ],
  },
  {
    id: 'end',
    title: '3 · End of the lesson',
    question: 'One screen: the score, then keeping the words and moving on. How do the buttons split that up?',
    variants: [
      { id: 'today', name: 'Today', fixes: [], today: true, tradeoff: 'Shows the last round only (2 correct, 0 troubled), pre-selects nothing, and "End review" is the way out.' },
      { id: 'twoStep', name: 'Two steps in the bar', fixes: END_FIXES, tradeoff: 'The bar asks about Reviews first, then swaps to what next. Clear, but finishing always takes two taps. Click through it.' },
      { id: 'inline', name: 'Choice above the bar', fixes: END_FIXES, recommended: true, tradeoff: 'One tap finishes: the Reviews choice (All 20 by default) is applied by whichever next step you press. A setting-like control on a celebration screen.' },
      { id: 'auto', name: 'Added automatically', fixes: END_FIXES, tradeoff: 'No decision at all: the lesson goes into Reviews when it is cleared, with Undo. Quietest, but it writes to your Reviews without asking.' },
    ],
  },
]

export const PRESETS = {
  today: { start: 'today', round: 'today', end: 'today' },
  recommended: { start: 'readiness', round: 'checkpoint', end: 'inline' },
  minimalFix: { start: 'today', round: 'checkpoint', end: 'twoStep' },
}

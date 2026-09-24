// One fabricated learner finishing Genki 1 Lesson 3, for DrillFinish.stories.
// The words are the lesson's real vocabulary; who missed what is invented
// but shaped like the engine's real output (simpleQueue's sessionMistakes:
// misses summed across every round).

const WORDS = [
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

// Session misses, hardest first. A score of N first-try keeps only the
// hardest (20 - N) as troubled, so the list always agrees with the score.
const HARDEST = [['shuumatsu', 4], ['konban', 3], ['zasshi', 2], ['bangohan', 1], ['okiru', 1], ['kiku', 1]]

export function finishRows(firstTry) {
  const misses = Object.fromEntries(HARDEST.slice(0, WORDS.length - firstTry))
  return WORDS
    .map(word => ({ id: word.id, word, misses: misses[word.id] ?? 0 }))
    .sort((a, b) => b.misses - a.misses)
}

// The learner's own review decks. The book's deck isn't among them yet, so
// the picker offers it as "Suggested · new".
export const DECKS = {
  'imported-anime': { id: 'imported-anime', name: 'Anime words', addedAt: 1 },
  'imported-kanji': { id: 'imported-kanji', name: 'Kanji I keep missing', addedAt: 2 },
}

const HOUR = 60 * 60 * 1000
export const PREVIOUS_RUNS = [
  { at: new Date(Date.now() - 2 * HOUR).toISOString(), firstTry: 11, total: 20 },
  { at: new Date(Date.now() - 26 * HOUR).toISOString(), firstTry: 7, total: 20 },
]

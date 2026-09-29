// Everything in the Drill Context labs that isn't a component: the frozen
// fixtures, the small lookups over them, per-concept state, and the notes
// storage. Kept apart from the .jsx files so each of those exports only
// components (react-refresh/only-export-components).
import { useState } from 'react'
import fixtures from './fixtures.json'

export const WORDS = fixtures.words
export const KANJI = fixtures.kanji
export const CHAPTER = fixtures.chapter

export const DEVICES = {
  desktop: { w: 1280, h: 800, label: 'Desktop · 1280×800' },
  phone: { w: 390, h: 780, label: 'Phone · 390×780' },
}

// A bar the width of the text it covers, with a 3px gap on its right so a
// run of tokens reads as separate words. Drawn as an SVG rounded rect with no
// viewBox, so its 3px corner radius stays 3px at any size — a border-radius
// would round the element's box, not the narrower bar, leaving the right
// corners square. Background-size (not a margin) keeps the redacted sentence
// at the exact geometry of the real one, and box-decoration-break gives every
// wrapped line fragment its own bar.
const BAR_SVG = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' rx='3' fill='rgba(0,0,0,0.13)'/%3E%3C/svg%3E\")"
export const REDACT_BAR = {
  color: 'transparent',
  backgroundImage: BAR_SVG,
  backgroundSize: 'calc(100% - 3px) 100%',
  backgroundRepeat: 'no-repeat',
  boxDecorationBreak: 'clone',
  WebkitBoxDecorationBreak: 'clone',
}

export const hasKanji = s => /\p{Script=Han}/u.test(s)
export const kanjiOf = form => [...new Set([...form].filter(hasKanji))]

export function kanjiFamily(ch, word) {
  const k = KANJI[ch]
  const not = v => v.form !== word.form
  return {
    known: k.known.filter(not),
    lesson: k.lesson.filter(not),
    common: k.common,
  }
}

// Words sharing the kanji, tagged by where the learner met them.
export function familyOf(ch, word) {
  const fam = kanjiFamily(ch, word)
  return {
    known: fam.known.map(v => ({ ...v, tag: 'known' })),
    lesson: fam.lesson.map(v => ({ ...v, tag: 'lesson' })),
  }
}

export const cardWidth = mobile => (mobile ? 358 : 380)

export function current(s) {
  const word = WORDS[s.idx]
  const sentences = word.sentences
  const sentence = sentences[s.sIdx % sentences.length]
  const chars = kanjiOf(word.form)
  const kanji = chars.includes(s.kanji) ? s.kanji : chars[0]
  return { word, sentences, sentence, chars, kanji }
}

export function actions(u) {
  return {
    flip: () => u(p => ({ flipped: !p.flipped, tok: null })),
    next: () => u(p => ({ idx: (p.idx + 1) % WORDS.length, flipped: false, sIdx: 0, tok: null, enShown: false })),
  }
}

export function useConceptState(defaults) {
  const [s, setS] = useState({ idx: 0, sIdx: 0, tok: null, enShown: false, kanji: null, ...defaults })
  const u = patch => setS(prev => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  return [s, u]
}

export function readFeedback(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? '{}') ?? {} } catch { return {} }
}

export function writeFeedback(key, all) {
  try { localStorage.setItem(key, JSON.stringify(all)) } catch { /* private window — notes just won't persist */ }
}


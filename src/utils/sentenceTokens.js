import { buildFurigana } from './furigana.js'
import { displayFormOf } from '../lib/displayForm.js'

// Splits an example sentence into the runs the details panel draws: words a
// learner can tap (with the reading for each kanji run) and the plain text
// between them.
//
// There is no tokenizer in the browser. A Tanaka sentence already lists the
// dictionary entries its words were indexed to (`dictionary_ids`), so each
// entry's written forms are found in the sentence text instead — hand-curated
// linkage, and readings and meanings from the dictionary the rest of the app
// treats as the source of truth. What that can't find stays plain text: no
// reading, not tappable.
//
// Longest match wins, so 消費者 is claimed before 消費 can split it, and an
// inflected verb matches by its stem (立ち上が in 立ち上がった), leaving the
// inflection as plain text after it.

const HAN = /\p{Script=Han}/u
// A form ending in one of these can inflect (verbs, i-adjectives), so its
// stem is tried when the dictionary form itself isn't in the sentence.
const INFLECTING_END = /[うくぐすつぬぶむるい]$/u
// Kana-only forms shorter than this are almost all particles and auxiliaries
// (Tanaka indexes some of them), which would match inside other words.
const MIN_KANA_FORM = 3

function readingParts(form, entry) {
  for (const kana of entry.kana_forms ?? []) {
    const parts = buildFurigana(form, kana)
    if (parts) return parts
  }
  return null
}

// The parts covering just the first `length` characters of the form.
function truncateParts(parts, length) {
  const out = []
  let used = 0
  for (const part of parts) {
    if (used >= length) break
    const room = length - used
    if (part.text.length <= room) {
      out.push(part)
      used += part.text.length
    } else if (part.type === 'kana') {
      out.push({ type: 'kana', text: part.text.slice(0, room) })
      used = length
    } else {
      return null
    }
  }
  return out
}

function candidatesFor(entry) {
  const forms = [...new Set([entry.preferred_form, entry.primary_form, ...(entry.kana_forms ?? [])].filter(Boolean))]
  const out = []
  for (const form of forms) {
    const hasKanji = HAN.test(form)
    if (!hasKanji && form.length < MIN_KANA_FORM) continue
    const parts = hasKanji ? readingParts(form, entry) : null
    out.push({ text: form, parts })
    if (hasKanji && INFLECTING_END.test(form) && form.length > 1) {
      const stem = form.slice(0, -1)
      if (HAN.test(stem)) out.push({ text: stem, parts: parts && truncateParts(parts, stem.length) })
    }
  }
  return out
}

function occurrences(text, needle) {
  const found = []
  let at = text.indexOf(needle)
  while (at !== -1) {
    found.push(at)
    at = text.indexOf(needle, at + needle.length)
  }
  return found
}

function overlaps(taken, start, end) {
  return taken.some(s => start < s.end && end > s.start)
}

/**
 * @param {string} japanese  the sentence
 * @param {object} entries   { [jmdictId]: dictionary row } for the sentence's
 *                           dictionary_ids (rows may be null or missing)
 * @param {object} target    the card's word: { id, form, reading } — `id` is
 *                           its jmdictId, `form`/`reading` what the card shows
 * @returns {Array<{ t, parts?, id?, form?, target? }>} runs covering the
 *   whole sentence, in order. `parts` is buildFurigana's shape for a run with
 *   a reading; `id` marks a tappable word.
 */
export function tokenizeSentence(japanese, entries = {}, target = {}) {
  if (!japanese) return []
  const spans = []

  // The card's own word first, so nothing else can claim its characters. By
  // its dictionary entry when the sentence is indexed to it, else by the
  // form the card shows.
  const targetEntry = target.id ? entries[target.id] : null
  const targetCandidates = targetEntry ? candidatesFor(targetEntry) : []
  const bare = (target.form ?? '').replace(/[〜~～（）()]/gu, '').replace(/な$/u, '')
  if (bare) {
    const parts = HAN.test(bare) && target.reading ? buildFurigana(bare, target.reading.replace(/[〜~～（）()]/gu, '').replace(/な$/u, '')) : null
    targetCandidates.push({ text: bare, parts })
    if (INFLECTING_END.test(bare) && HAN.test(bare.slice(0, -1))) {
      targetCandidates.push({ text: bare.slice(0, -1), parts: parts && truncateParts(parts, bare.length - 1) })
    }
  }
  const bestTarget = targetCandidates
    .sort((a, b) => b.text.length - a.text.length)
    .find(c => japanese.includes(c.text))
  if (bestTarget) {
    for (const at of occurrences(japanese, bestTarget.text)) {
      spans.push({ start: at, end: at + bestTarget.text.length, parts: bestTarget.parts, id: target.id ?? null, form: target.form, target: true })
    }
  }

  const matches = []
  for (const [id, entry] of Object.entries(entries)) {
    if (!entry || id === target.id) continue
    const form = displayFormOf(entry)
    for (const c of candidatesFor(entry)) {
      for (const at of occurrences(japanese, c.text)) {
        matches.push({ start: at, end: at + c.text.length, parts: c.parts, id, form })
      }
    }
  }
  matches.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start)
  for (const m of matches) if (!overlaps(spans, m.start, m.end)) spans.push(m)

  spans.sort((a, b) => a.start - b.start)
  const tokens = []
  let pos = 0
  for (const s of spans) {
    if (s.start > pos) tokens.push({ t: japanese.slice(pos, s.start) })
    const token = { t: japanese.slice(s.start, s.end), form: s.form }
    if (s.parts) token.parts = s.parts
    if (s.id) token.id = s.id
    if (s.target) token.target = true
    tokens.push(token)
    pos = s.end
  }
  if (pos < japanese.length) tokens.push({ t: japanese.slice(pos) })
  return tokens
}

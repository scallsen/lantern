import { displayFormOf } from '../lib/displayForm.js'

export { displayFormOf }

// Archive copy: the live Supabase lookups are gone. The labs on this branch
// read a frozen snapshot (src/data/dictionarySnapshot.json) instead, so only
// the pure formatting helpers remain.

// Concise definition text for card display — first couple of gloss segments,
// further capped by character count so a handful of long senses (e.g. 枚数's
// "number of flat objects; sheet count; tally of individual pieces") can't
// still blow past a card's fixed height on their own. Whole senses are kept
// where possible; only the boundary sense gets hard-truncated.
export function briefGloss(row, count = 3, maxChars = 60) {
  if (!row?.gloss_en) return null
  return trimGlosses(row.gloss_en.split('; '), count, maxChars)
}

// The definition a card should show. A word may name which of the entry's
// senses its textbook is teaching — JMdict orders senses by general prominence,
// so あげる's "to give" sits at sense 5 of 上げる, behind "to raise; to elevate",
// and the first three glosses would answer a question the book never asked.
// `senseGlosses` is the map from useSenseGlosses/fetchSenseGlosses; without it
// (or before it resolves) this falls back to the entry's leading glosses, which
// is also what a word that names no sense always gets.
export function cardGloss(word, row, senseGlosses) {
  const gloss = word?.sense != null ? senseGlosses?.[word.jmdictId]?.[word.sense] : null
  if (gloss?.length) return trimGlosses(gloss)
  return briefGloss(row)
}

function trimGlosses(all, count = 3, maxChars = 60) {
  const senses = all.slice(0, count)
  const full = senses.join('; ')
  if (full.length <= maxChars) return full

  const kept = [senses[0]]
  let len = senses[0].length
  for (const sense of senses.slice(1)) {
    const next = len + 2 + sense.length
    if (next > maxChars) break
    kept.push(sense)
    len = next
  }
  let result = kept.join('; ')
  if (result.length > maxChars) result = result.slice(0, maxChars - 1).trimEnd()
  return `${result}…`
}

import { supabase } from '../lib/supabase.js'

const cache = new Map()
const attempted = new Set()

const SELECT = 'id, japanese, english, dictionary_ids, quality'

function pickBestSentence(rows) {
  if (!rows.length) return null
  // Prefer sentences flagged as a recommended example, then shorter/simpler ones.
  return rows.slice().sort((a, b) => (b.quality === true) - (a.quality === true) || a.japanese.length - b.japanese.length)[0]
}

// The already-resolved subset, synchronously — lets a hook that mounts
// fresh for every card (the drill card is keyed per card) render cached data
// on its first frame instead of flashing an empty state while the async
// lookup resolves from cache.
export function peekSentences(ids) {
  const result = {}
  for (const id of ids) if (attempted.has(id)) result[id] = cache.get(id) ?? null
  return result
}

// Returns { [jmdictId]: sentenceRow|null } for every id already resolved (found or not).
export async function fetchSentencesFor(ids) {
  const unique = [...new Set(ids)].filter(Boolean)
  const missing = unique.filter(id => !attempted.has(id))
  if (missing.length > 0 && supabase) {
    const { data } = await supabase.from('sentences').select(SELECT).overlaps('dictionary_ids', missing)
    missing.forEach(id => attempted.add(id))
    if (data) {
      for (const id of missing) {
        const candidates = data.filter(row => row.dictionary_ids.includes(id))
        cache.set(id, pickBestSentence(candidates))
      }
    }
  }
  const result = {}
  for (const id of unique) {
    if (attempted.has(id)) result[id] = cache.get(id) ?? null
  }
  return result
}

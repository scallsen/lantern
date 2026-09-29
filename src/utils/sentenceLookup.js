import { supabase } from '../lib/supabase.js'

const cache = new Map()
const attempted = new Set()

// The pick (quality-flagged, then shortest, then lowest id) lives in the
// best_sentences SQL function, not here: common words match more rows than a
// query returns, so a client-side pick saw an arbitrary subset and could change
// between sessions. generate-audio.mjs calls the same function, which is what
// keeps a card's sentence and its pre-recorded clip in step.
const BATCH = 500

// Returns { [jmdictId]: sentenceRow|null } for every id already resolved (found or not).
export async function fetchSentencesFor(ids) {
  const unique = [...new Set(ids)].filter(Boolean)
  const missing = unique.filter(id => !attempted.has(id))
  if (missing.length > 0 && supabase) {
    missing.forEach(id => attempted.add(id))
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH)
      const { data } = await supabase.rpc('best_sentences', { ids: batch })
      if (!data) continue
      const byId = new Map(data.map(row => [row.dictionary_id, row]))
      for (const id of batch) cache.set(id, byId.get(id) ?? null)
    }
  }
  const result = {}
  for (const id of unique) {
    if (attempted.has(id)) result[id] = cache.get(id) ?? null
  }
  return result
}

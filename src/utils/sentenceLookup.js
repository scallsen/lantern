import { supabase } from '../lib/supabase.js'

const cache = new Map()
// id -> the request that will fill it. A second caller for an id already on
// its way waits for that request instead of reading the cache early: the card
// face and the drill's sentence audio both ask for the new card's sentence in
// the same commit, and the old "attempted" set, marked before the request
// returned, told whichever asked second that the word had no sentence — so
// the sentence showed but never autoplayed until the card was seen again.
const pending = new Map()

// The pick (quality-flagged, then shortest, then lowest id) lives in the
// best_sentences SQL function, not here: common words match more rows than a
// query returns, so a client-side pick saw an arbitrary subset and could change
// between sessions. generate-audio.mjs calls the same function, which is what
// keeps a card's sentence and its pre-recorded clip in step.
const BATCH = 500

async function dictionaryIdsOf(sentenceIds) {
  const ids = [...new Set(sentenceIds)]
  if (!ids.length) return new Map()
  const { data } = await supabase.from('sentences').select('id, dictionary_ids').in('id', ids)
  return new Map((data ?? []).map(row => [row.id, row.dictionary_ids]))
}

// The already-resolved subset, synchronously — lets a hook that mounts
// fresh for every card (the drill card is keyed per card) render cached data
// on its first frame instead of flashing an empty state while the async
// lookup resolves from cache.
export function peekSentences(ids) {
  const result = {}
  for (const id of ids) if (cache.has(id)) result[id] = cache.get(id)
  return result
}

// Returns { [jmdictId]: sentenceRow|null } for every id resolved (found or
// not). A failed request resolves nothing, so the next call retries it.
export async function fetchSentencesFor(ids) {
  const unique = [...new Set(ids)].filter(Boolean)
  const missing = unique.filter(id => !cache.has(id) && !pending.has(id))
  if (missing.length > 0 && supabase) {
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH)
      const request = supabase.rpc('best_sentences', { ids: batch })
        .then(async ({ data }) => {
          if (!data) return
          // best_sentences doesn't return a sentence's dictionary_ids, which
          // the drill's details panel tokenizes it by, so they come from the
          // table in the same request. Without them a row still shows and
          // plays; only its words aren't tappable.
          const words = await dictionaryIdsOf(data.map(row => row.id))
          const byId = new Map(data.map(row => [row.dictionary_id, { ...row, dictionary_ids: words.get(row.id) ?? [] }]))
          for (const id of batch) cache.set(id, byId.get(id) ?? null)
        })
        .catch(() => {})
        .finally(() => batch.forEach(id => pending.delete(id)))
      batch.forEach(id => pending.set(id, request))
    }
  }
  await Promise.all([...new Set(unique.map(id => pending.get(id)).filter(Boolean))])
  const result = {}
  for (const id of unique) {
    if (cache.has(id)) result[id] = cache.get(id)
  }
  return result
}

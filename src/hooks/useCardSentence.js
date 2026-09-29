import { useEffect, useMemo } from 'react'
import { useSentencesForWords } from './useSentenceForWord.js'
import { useDictionaryEntries } from './useDictionaryEntries.js'
import { fetchSentencesFor } from '../utils/sentenceLookup.js'
import { fetchDictionaryEntries } from '../utils/dictionaryEntryLookup.js'
import { fetchKanjiMeanings, kanjiCharsOf } from '../utils/kanjiMeaningLookup.js'
import { tokenizeSentence } from '../utils/sentenceTokens.js'

// The example sentence a drill card's details panel shows, ready to draw:
// { japanese, english, tokens, entries, audio }, null when the card has none,
// or undefined while it's still resolving (the panel keeps its slot empty
// rather than flash a kanji-only panel first).
//
// Same priority rule as before the panel: the card's own curated sentence
// wins, and a Tanaka Corpus sentence fills the gap. Only a Tanaka sentence is
// indexed to dictionary entries, so a curated one gets the card's own word
// picked out and nothing else tappable.
export function useCardSentence({ jmdictId, form, reading, sentence, sentenceEnglish, sentenceAudio, enabled = true }) {
  const lookup = useSentencesForWords(jmdictId ? [jmdictId] : [], enabled && !sentence)
  const tanaka = jmdictId ? lookup[jmdictId] ?? null : null
  const ids = !sentence && tanaka ? tanaka.dictionary_ids : []
  const { entries, loading } = useDictionaryEntries(ids, enabled)

  const japanese = sentence ?? tanaka?.japanese ?? null
  const english = sentence ? sentenceEnglish : tanaka?.english
  // The lookup only lists an id once it has resolved, found or not.
  const pending = enabled && !sentence && !!jmdictId && !(jmdictId in lookup)

  const tokens = useMemo(() => {
    if (!japanese || loading) return null
    const own = Object.fromEntries(ids.map(id => [id, entries[id]]).filter(([, e]) => e))
    return tokenizeSentence(japanese, own, { id: jmdictId, form, reading })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [japanese, loading, form, reading, jmdictId, ids.join(',')])

  if (!enabled) return null
  if (pending || (japanese && !tokens)) return undefined
  if (!japanese) return null
  return { japanese, english: english ?? null, tokens, entries, audio: sentence ? sentenceAudio ?? null : null }
}

// Warms everything the details panel needs for the next few cards — the
// sentence, its words' dictionary entries, the word's kanji meanings — so the
// panel is complete on the frame a card arrives instead of filling in after.
// `words`: [{ jmdictId, form }].
export function usePrefetchCardDetails(words, enabled = true) {
  const ids = (words ?? []).map(w => w.jmdictId).filter(Boolean).join(',')
  const chars = [...new Set((words ?? []).flatMap(w => kanjiCharsOf(w.form)))].join('')
  useEffect(() => {
    if (!enabled || !ids) return
    for (const id of ids.split(',')) {
      fetchSentencesFor([id]).then(map => {
        const entryIds = map[id]?.dictionary_ids
        if (entryIds?.length) fetchDictionaryEntries(entryIds)
      })
    }
  }, [ids, enabled])
  useEffect(() => {
    if (enabled && chars) fetchKanjiMeanings([...chars])
  }, [chars, enabled])
}

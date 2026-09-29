import { useMemo } from 'react'
import { State } from 'ts-fsrs'
import { WORD_DATA } from '../data/wordData.js'
import { useDictionaryEntries } from './useDictionaryEntries.js'
import { cardFormOf } from '../lib/displayForm.js'
import { briefGloss } from '../utils/dictionaryEntryLookup.js'

// What the learner already knows, for the drill card's details panel: which
// sentence words can drop their furigana, and the "You know" words a kanji
// tile opens.
//
// Known means met and practised: every word of a textbook chapter the learner
// has drilled (other than the one being drilled now, whose words are "this
// lesson" instead), and every review card that has left New. The same rule in
// both drills, so a word doesn't gain furigana moving from one to the other.

// A word as the panel lists it. Drill words carry only a jmdictId and take
// their form and gloss from the dictionary; review cards carry their own.
export function wordItem(word, entry) {
  if (word.front) return { id: word.jmdictId ?? null, form: word.front, reading: word.kana ?? null, gloss: word.back ?? null }
  const { form, reading } = cardFormOf(word, entry)
  return { id: word.jmdictId ?? null, form, reading, gloss: briefGloss(entry) ?? word.english ?? null }
}

/**
 * @param {object}   vocabProgress   the `vocab-flashcard` progress payload
 * @param {object}   srsCards        the `vocab-srs` progress's `cards`
 * @param {string[]} excludeListKeys chapters being drilled right now
 * @returns {{ knownIds: Set<string>, known: Array }} `known` resolves as the
 *   dictionary answers; `knownIds` is ready at once.
 */
export function useKnownWords({ vocabProgress, srsCards, excludeListKeys = [], enabled = true }) {
  const exclude = excludeListKeys.join(',')
  const drilled = useMemo(() => {
    const lists = new Set(Object.keys(vocabProgress?.sublists ?? {}))
    for (const key of exclude.split(',')) lists.delete(key)
    return WORD_DATA.filter(w => w.jmdictId && lists.has(w.listKey))
  }, [vocabProgress?.sublists, exclude])

  const reviewed = useMemo(
    () => Object.values(srsCards ?? {}).filter(c => c.front && c.state != null && c.state !== State.New),
    [srsCards],
  )

  const knownIds = useMemo(
    () => new Set([...drilled.map(w => w.jmdictId), ...reviewed.map(c => c.jmdictId).filter(Boolean)]),
    [drilled, reviewed],
  )

  const ids = useMemo(() => drilled.map(w => w.jmdictId), [drilled])
  const { entries } = useDictionaryEntries(ids, enabled)

  const known = useMemo(() => {
    const seen = new Set()
    const out = []
    for (const item of [...reviewed.map(c => wordItem(c)), ...drilled.filter(w => w.jmdictId in entries).map(w => wordItem(w, entries[w.jmdictId]))]) {
      if (!item.form || seen.has(item.form)) continue
      seen.add(item.form)
      out.push(item)
    }
    return out
  }, [drilled, reviewed, entries])

  return { knownIds, known }
}

// The drill the Details Panel labs share: the frozen So-Matome W3D2 words
// (darkFixtures.json, real Tanaka sentences and dictionary rows) tokenized by
// the shipped tokenizer, and one drill state every frame on a page follows,
// so all the variants always show the same word on the same side.
import { useState, useEffect, useRef } from 'react'
import { tokenizeSentence } from '../../utils/sentenceTokens.js'
import fixtures from './darkFixtures.json'

const EXIT_MS = 280

export const KNOWN_IDS = new Set(fixtures.knownIds)
export const RELATED = fixtures.related

export const WORDS = fixtures.words.map(w => ({
  ...w,
  sentence: {
    ...w.sentence,
    tokens: tokenizeSentence(w.sentence.japanese, w.sentence.entries, { id: w.jmdictId, form: w.form, reading: w.reading }),
  },
}))

export function useLabDrill(initial = {}) {
  const [s, setS] = useState({ idx: 0, flipped: false, leaving: false, details: true, sentenceFurigana: 'new', sentenceTranslation: 'blur', readingPosition: 'below', auto: false, ...initial })
  const u = patch => setS(prev => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  const timer = useRef(null)
  const next = () => {
    if (timer.current) return
    u({ leaving: true })
    timer.current = setTimeout(() => {
      timer.current = null
      u(p => ({ idx: (p.idx + 1) % WORDS.length, flipped: false, leaving: false }))
    }, EXIT_MS)
  }
  useEffect(() => {
    if (!s.auto || s.leaving) return undefined
    const t = setTimeout(() => (s.flipped ? next() : u({ flipped: true })), 1700)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.auto, s.flipped, s.leaving, s.idx])
  return [s, u, next]
}

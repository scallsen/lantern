import { useEffect, useMemo, useState } from 'react'
import { kanjiCharsOf, fetchKanjiMeanings, peekKanjiMeanings } from '../utils/kanjiMeaningLookup.js'

export function useKanjiMeanings(kanjiStr, enabled) {
  const [meanings, setMeanings] = useState({})
  const chars = enabled ? kanjiCharsOf(kanjiStr) : []
  const key = chars.join('')

  useEffect(() => {
    if (!enabled || chars.length === 0) return
    let cancelled = false
    fetchKanjiMeanings(chars).then(map => {
      if (!cancelled) setMeanings(prev => ({ ...prev, ...map }))
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  // Stable between renders unless something new resolved, so callers can
  // keep memoizing on it.
  const peeked = peekKanjiMeanings(chars)
  const peekedCount = Object.keys(peeked).length
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({ ...peeked, ...meanings }), [key, peekedCount, meanings])
}

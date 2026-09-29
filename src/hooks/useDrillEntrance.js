import { useEffect, useState } from 'react'

// Holds a drill's opening screen back until its first card can arrive whole —
// the card's word, its details panel's sentence and kanji meanings — then lets
// everything in together. Without it the counts showed first, the card a
// moment later and the panel after that, three abrupt steps into a session.
// `maxWaitMs` caps the hold, so a slow network shows what it has rather than
// nothing. Once in, it stays in: later cards have their own transitions.
export function useDrillEntrance(ready, maxWaitMs = 1500) {
  const [entered, setEntered] = useState(false)
  useEffect(() => { if (ready) setEntered(true) }, [ready])
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), maxWaitMs)
    return () => clearTimeout(t)
  }, [maxWaitMs])
  return entered
}

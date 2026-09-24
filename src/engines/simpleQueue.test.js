import { describe, it, expect } from 'vitest'
import * as Q from './simpleQueue.js'

const pool = ['a', 'b', 'c'].map(id => ({ id, word: { id } }))

// Answers every current card: wrong the first time for ids in `miss`.
function playRound(state, miss = []) {
  const seen = new Set()
  let s = state
  while (s.float.length) {
    const id = s.float[0].id
    if (miss.includes(id) && !seen.has(id)) {
      seen.add(id)
      s = Q.onWrong(s)
    } else {
      s = Q.onCorrect(s)
    }
  }
  return s
}

describe('simpleQueue sessions', () => {
  it('carries session misses across rounds while each round tracks its own', () => {
    let s = playRound(Q.init(pool), ['a', 'b'])
    expect(s.troubled.map(c => c.id).sort()).toEqual(['a', 'b'])
    expect(s.round).toBe(1)

    s = Q.nextRound(s)
    expect(s.round).toBe(2)
    expect(s.float.length + s.pool.length).toBe(2)
    expect(s.mistakeCounts).toEqual({})

    s = playRound(s, ['a'])
    expect(s.troubled.map(c => c.id)).toEqual(['a'])
    expect(s.sessionMistakes).toEqual({ a: 2, b: 1 })

    s = playRound(Q.nextRound(s))
    expect(s.round).toBe(3)
    expect(s.troubled).toEqual([])
    expect(s.sessionMistakes).toEqual({ a: 2, b: 1 })
    expect(s.sessionPool).toBe(pool)
  })

  it('keeps one session id across rounds and a new one per init', () => {
    const s = playRound(Q.init(pool), ['a'])
    expect(Q.nextRound(s).sessionId).toBe(s.sessionId)
    expect(Q.init(pool).sessionId).not.toBe(s.sessionId)
  })

  it('undoes a miss from the session total too', () => {
    const s = Q.init(pool)
    const undone = Q.onUndo(Q.onWrong(s))
    expect(undone.sessionMistakes).toEqual({})
  })
})

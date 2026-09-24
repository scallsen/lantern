import { describe, it, expect } from 'vitest'
import { sessionScore, chapterScorePct, recordFirstPass, timeAgo, HISTORY_LIMIT } from './drillScore.js'

const pool = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, word: { id } }))

describe('sessionScore', () => {
  it('counts words never missed as first-try', () => {
    expect(sessionScore(pool, { b: 2, d: 1 })).toEqual({ total: 5, firstTry: 3, pct: 60 })
  })
  it('handles a clean session and an empty one', () => {
    expect(sessionScore(pool, {})).toEqual({ total: 5, firstTry: 5, pct: 100 })
    expect(sessionScore([], {})).toEqual({ total: 0, firstTry: 0, pct: 0 })
  })
})

describe('chapterScorePct', () => {
  it('ignores legacy and pre-score entries', () => {
    expect(chapterScorePct(undefined)).toBeNull()
    expect(chapterScorePct({ lastReviewed: '2026-09-01', correct: 2, total: 20 })).toBeNull()
    expect(chapterScorePct({ 'kanji-front': { lastReviewed: '2026-09-01', correct: 2, total: 20 } })).toBeNull()
  })
  it('reads the most recently drilled scored mode', () => {
    expect(chapterScorePct({
      'kanji-front': { lastReviewed: '2026-09-01T00:00:00Z', firstTry: 10, total: 20 },
      'meaning-front': { lastReviewed: '2026-09-02T00:00:00Z', firstTry: 17, total: 20 },
    })).toBe(85)
  })
})

describe('recordFirstPass', () => {
  const base = { textbook: { id: 'genki-1' } }
  const run = (progress, at, firstTry, extra = {}) =>
    recordFirstPass(progress, { listIds: ['genki-1-l3'], mode: 'kanji-front', firstTry, total: 20, at, ...extra })

  it('saves the first-try score per chapter and mode', () => {
    const { progress, previousRuns } = run(base, 't1', 14)
    expect(progress.textbook).toEqual(base.textbook)
    expect(progress.sublists['genki-1-l3']['kanji-front']).toEqual({ lastReviewed: 't1', correct: 14, total: 20, firstTry: 14 })
    expect(previousRuns).toEqual([])
  })

  it('keeps only the last runs of the same lesson, newest first', () => {
    let p = base
    let previous
    for (const [at, n] of [['t1', 7], ['t2', 11], ['t3', 14], ['t4', 16]]) ({ progress: p, previousRuns: previous } = run(p, at, n))
    expect(previous.map(r => r.at)).toEqual(['t3', 't2'])
    expect(p.recentRuns.runs.map(r => r.at)).toEqual(['t4', 't3'])
    expect(p.recentRuns.runs).toHaveLength(HISTORY_LIMIT)
  })

  it('drops the history when a different lesson or mode is drilled', () => {
    const { progress: p1 } = run(base, 't1', 7)
    const other = recordFirstPass(p1, { listIds: ['genki-1-l4'], mode: 'kanji-front', firstTry: 9, total: 20, at: 't2' })
    expect(other.previousRuns).toEqual([])
    expect(other.progress.recentRuns).toEqual({ chapterId: 'genki-1-l4', mode: 'kanji-front', runs: [{ at: 't2', firstTry: 9, total: 20 }] })
    expect(run(p1, 't3', 8, { mode: 'meaning-front' }).previousRuns).toEqual([])
  })

  it('upgrades a legacy flat entry into the per-mode shape', () => {
    const legacy = { sublists: { 'genki-1-l3': { lastReviewed: 't0', correct: 2, total: 20 } } }
    const { progress } = run(legacy, 't1', 12, { mode: 'meaning-front' })
    expect(Object.keys(progress.sublists['genki-1-l3']).sort()).toEqual(['kanji-front', 'meaning-front'])
  })

  it('keeps no history for a multi-list free drill', () => {
    const { progress, previousRuns } = recordFirstPass(base, { listIds: ['a', 'b'], mode: 'kanji-front', firstTry: 5, total: 10, at: 't1' })
    expect(progress.recentRuns).toBeUndefined()
    expect(previousRuns).toEqual([])
  })
})

describe('timeAgo', () => {
  const now = new Date('2026-09-24T12:00:00Z').getTime()
  it('reads in plain words', () => {
    expect(timeAgo('2026-09-24T11:59:30Z', now)).toBe('Just now')
    expect(timeAgo('2026-09-24T11:59:00Z', now)).toBe('1 minute ago')
    expect(timeAgo('2026-09-24T10:00:00Z', now)).toBe('2 hours ago')
    expect(timeAgo('2026-09-23T10:00:00Z', now)).toBe('Yesterday')
    expect(timeAgo('2026-09-20T10:00:00Z', now)).toBe('4 days ago')
  })
})

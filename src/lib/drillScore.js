// The drill's one score: the share of a session's words answered right the
// first time they came up. It's what the finish screen fills its bar with,
// what the home card compares against the readiness target, and the only
// score saved per chapter — later rounds over the missed words are practice,
// not a re-grade.
//
// Progress shape it writes (the `vocab-flashcard` payload):
//   sublists[chapterId][mode] = { lastReviewed, correct, total, firstTry }
//     `firstTry` marks an entry saved from a first pass. Entries without it
//     predate this and hold the *last round's* count (often a clean 2 of 20),
//     so they're never read as a score.
//   recentRuns = { chapterId, mode, runs: [{ at, firstTry, total }] }
//     One slot, newest first, capped at HISTORY_LIMIT, for the lesson being
//     drilled right now. Drilling anything else replaces it outright, so it
//     stays a few rows however long the app is used.

export const READINESS_TARGET_PCT = 80
export const HISTORY_LIMIT = 2

export const pctOf = (firstTry, total) => (total > 0 ? Math.round((firstTry / total) * 100) : 0)

// Every word that came back in a later round was missed in the first one, so
// the words never missed all session are exactly the first-try ones.
export function sessionScore(sessionPool, sessionMistakes) {
  const total = sessionPool.length
  const missed = sessionPool.filter(spec => (sessionMistakes[spec.id] ?? 0) > 0).length
  const firstTry = total - missed
  return { total, firstTry, pct: pctOf(firstTry, total) }
}

// The first-try percentage for a chapter's sublists entry, from whichever
// mode was drilled most recently — or null when nothing scored exists yet.
export function chapterScorePct(entry) {
  if (!entry || 'lastReviewed' in entry) return null
  let latest = null
  for (const mode of Object.values(entry)) {
    if (typeof mode?.firstTry !== 'number' || !mode.total) continue
    if (!latest || mode.lastReviewed > latest.lastReviewed) latest = mode
  }
  return latest ? pctOf(latest.firstTry, latest.total) : null
}

// Saves a finished first pass. Returns the updated payload, plus the runs this
// chapter had *before* it — the finish screen's "Previous sessions".
export function recordFirstPass(progress, { listIds, mode, firstTry, total, at }) {
  const sublists = { ...(progress?.sublists ?? {}) }
  for (const listId of listIds) {
    const existing = sublists[listId]
    const byMode = existing && 'lastReviewed' in existing ? { 'kanji-front': existing } : (existing ?? {})
    sublists[listId] = { ...byMode, [mode]: { lastReviewed: at, correct: firstTry, total, firstTry } }
  }

  // History only means something for one chapter drilled whole — a free
  // drill across several lists has no single lesson to compare against.
  if (listIds.length !== 1) return { progress: { ...(progress ?? {}), sublists }, previousRuns: [] }

  const slot = progress?.recentRuns
  const sameLesson = slot?.chapterId === listIds[0] && slot?.mode === mode
  const previousRuns = sameLesson ? (slot.runs ?? []).slice(0, HISTORY_LIMIT) : []
  const recentRuns = {
    chapterId: listIds[0],
    mode,
    runs: [{ at, firstTry, total }, ...previousRuns].slice(0, HISTORY_LIMIT),
  }
  return { progress: { ...(progress ?? {}), sublists, recentRuns }, previousRuns }
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function timeAgo(at, now = Date.now()) {
  const elapsed = now - new Date(at).getTime()
  if (elapsed < MINUTE) return 'Just now'
  if (elapsed < HOUR) {
    const m = Math.floor(elapsed / MINUTE)
    return `${m} minute${m === 1 ? '' : 's'} ago`
  }
  if (elapsed < DAY) {
    const h = Math.floor(elapsed / HOUR)
    return `${h} hour${h === 1 ? '' : 's'} ago`
  }
  const d = Math.floor(elapsed / DAY)
  return d === 1 ? 'Yesterday' : `${d} days ago`
}

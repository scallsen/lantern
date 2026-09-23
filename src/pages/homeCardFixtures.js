import { resolveTextbookState } from '../lib/textbookProgress.js'
import { getTextbook } from '../data/textbooks.js'

// Fabricated inputs for the real NewCard/ReviewCard, shared by their stories.
// Every chapter has words except the books that genuinely ship none yet, so
// the "no words yet" state is the real one rather than a special case.
const wordCountFor = id => (id.startsWith('genki') ? 0 : 20)

// Builds the progress payload the real resolver reads, so these states are
// resolved by production code rather than hand-shaped objects that could
// drift from it.
function textbookState(bookId, { drilledCount = 0, pointer = null } = {}) {
  const book = getTextbook(bookId)
  if (!book) throw new Error(`homeCardFixtures references unknown textbook "${bookId}"`)
  const sublists = {}
  for (const chapter of book.chapters.slice(0, drilledCount)) {
    sublists[chapter.id] = { 'kanji-front': { lastReviewed: '2026-09-01T00:00:00Z', correct: 18, total: 20 } }
  }
  return resolveTextbookState({ textbook: { id: bookId, currentChapterId: pointer }, sublists }, wordCountFor)
}

export const NEW_CARD_STATES = {
  loading: { loading: true },
  empty: { state: null },
  fresh: { state: textbookState('nsm-n3-kanji') },
  inProgress: { state: textbookState('nsm-n3-kanji', { drilledCount: 4, pointer: 'nsm-n3-kanji-w1d4' }) },
  nextUntouched: { state: textbookState('nsm-n3-kanji', { drilledCount: 5 }) },
  complete: { state: textbookState('nsm-n3-kanji', { drilledCount: 36 }) },
  noWords: { state: textbookState('genki-1') },
  long: { state: textbookState('marugoto-a1-katsudou', { drilledCount: 3, pointer: 'marugoto-a1-katsudou-t3' }) },
}

// The shape summariseSrs (DashboardPage.jsx) returns. estimatedMinutes uses
// getGlobalStats' own formula, with newAvailable = newToday + newWaiting.
function srsSummary({ due, newToday, newWaiting, totalCards, activeDecks, learned }) {
  const estimatedMinutes = Math.ceil((due + Math.min(newToday + newWaiting, 10)) * 0.25)
  return { due, newToday, newWaiting, totalCards, activeDecks, learned, estimatedMinutes, canStart: due > 0 || newToday > 0 }
}

export const REVIEW_CARD_STATES = {
  loading: { loading: true },
  signedOut: { signedOut: true },
  noCards: { summary: null },
  due: { summary: srsSummary({ due: 24, newToday: 10, newWaiting: 120, totalCards: 480, activeDecks: 2, learned: 240 }) },
  newOnly: { summary: srsSummary({ due: 0, newToday: 10, newWaiting: 340, totalCards: 480, activeDecks: 2, learned: 240 }) },
  caughtUp: { summary: srsSummary({ due: 0, newToday: 0, newWaiting: 0, totalCards: 480, activeDecks: 2, learned: 240 }) },
  big: { summary: srsSummary({ due: 148, newToday: 20, newWaiting: 1240, totalCards: 2007, activeDecks: 3, learned: 1003 }) },
}

// The two real home-page bands, plus the narrower ends of each.
export const CARD_WIDTHS = [360, 400, 480, 560]

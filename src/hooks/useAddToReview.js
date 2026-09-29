import { useToast } from '../context/ToastContext.jsx'
// Cross-module write: creates cards in the vocab-srs progress namespace, the
// same way the readers always have.
import { createCard } from '../modules/vocab-srs/srs.js'
import { ensureDeck, createDeck, deleteCards } from '../modules/vocab-srs/deckUtils.js'

const EMPTY_SRS = { decks: {}, cards: {}, lastSession: null, totalReviews: 0, newCardDay: { date: '', count: 0 } }

/**
 * Adding one word to a review deck, with the "Added to …" toast and its Undo —
 * what the Definition Popover's add step does wherever it's opened.
 *
 * Takes the caller's own `vocab-srs` progress rather than reading it here:
 * useProgress instances don't share state, so a second copy would save over
 * (or be saved over by) the page's — mid-review, the SRS module's next card
 * save would silently drop the added card.
 *
 * @param {object}   srsData  the page's `vocab-srs` progress (may be null)
 * @param {function} saveSrs  its save
 * @returns {{ decks, addToDeck(word, deckId), addToNewDeck(word, name) }}
 *   `word`: { front, meaning, kana?, jmdictId? }
 */
export function useAddToReview(srsData, saveSrs) {
  const toast = useToast()
  const decks = srsData?.decks ?? {}

  function add(word, deckId, decksForCreate) {
    const current = srsData ?? EMPTY_SRS
    const newDecks = decksForCreate ?? ensureDeck(current.decks, deckId, current.decks[deckId]?.name ?? 'Deck')
    const cardId = `${deckId}-${Date.now()}`
    const extras = {}
    if (word.kana) extras.kana = word.kana
    if (word.jmdictId) extras.jmdictId = word.jmdictId
    const card = createCard(word.front, word.meaning ?? '', cardId, deckId, extras)
    const next = { ...current, decks: newDecks, cards: { ...current.cards, [cardId]: card } }
    saveSrs(next)
    toast?.showToast({
      message: `Added to "${newDecks[deckId]?.name ?? 'Deck'}".`,
      actionLabel: 'Undo',
      onAction: () => saveSrs({ ...next, cards: deleteCards(next.cards, [cardId]) }),
    })
  }

  return {
    decks,
    addToDeck: (word, deckId) => add(word, deckId),
    addToNewDeck: (word, name) => {
      const { decks: newDecks, deckId } = createDeck((srsData ?? EMPTY_SRS).decks, name)
      add(word, deckId, newDecks)
    },
  }
}

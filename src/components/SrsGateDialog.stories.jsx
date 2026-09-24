import { fn } from 'storybook/test'
import SrsGateDialog from './SrsGateDialog.jsx'

const DECKS = {
  'imported-anime': { id: 'imported-anime', name: 'Anime words', addedAt: 1 },
  'imported-kanji': { id: 'imported-kanji', name: 'Kanji I keep missing', addedAt: 2 },
}

export default {
  title: 'Patterns/Send To Review Gate',
  component: SrsGateDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: "Asks, before the textbook tracker moves on, whether to send the lesson's words that aren't in any review deck yet. Adding asks which deck, in the same dialog, with the book's own deck suggested first.\n\n**Use when** moving past a textbook chapter whose words haven't all been added to review.\n\n**Don't use** for a plain are-you-sure (Confirm Dialog), or for adding words without moving on (Deck Picker).\n\n*Build note:* the × cancels the move entirely; Skip moves on without adding." },
      story: { inline: false, iframeHeight: 480 },
    },
  },
  args: {
    gate: { toId: 'nsm-n3-kanji-w1d4', toLabel: 'Week 1, Day 4' },
    chapterLabel: 'Week 1, Day 3',
    unsentCount: 12,
    totalCount: 15,
    decks: DECKS,
    suggestedDeck: { deckId: 'textbook-nsm-n3-kanji', deckName: 'Nihongo So-Matome N3 Kanji' },
    isMobile: false,
    onCancel: fn(),
    onSkip: fn(),
    onSend: fn(),
  },
}

export const Default = {}

export const Phone = { args: { isMobile: true } }

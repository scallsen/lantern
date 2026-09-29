import { useState } from 'react'
import { isBundledDeck } from '../modules/vocab-srs/deckUtils.js'
import Button from './Button.jsx'
import Japanese from './Japanese.jsx'
import Popover from './Popover.jsx'
import OptionPicker from './OptionPicker.jsx'
import { deckPickerItems } from './deckPickerItems.js'
import { TEXT, TEXT_MUTED, FS_BASE, FS_CAPTION, FS_ENTRY_WORD, SPACE_8, SPACE_12 } from '../data/theme.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAddToReview } from '../hooks/useAddToReview.js'

/**
 * The one word lookup: a tapped word's reading, part of speech and meaning,
 * with "Add to review deck". The news reader, Story and the drill card's
 * details panel all open this, and it does the adding itself (useAddToReview)
 * — each caller used to keep its own copy of the add / create-deck / undo code.
 *
 * @param {object}   word      { text, reading?, pos?, meaning?, front?, kana?, jmdictId? }
 *                             `text` is what's shown; `front`/`kana` what a new
 *                             card gets (default `text` / none) — a reader
 *                             shows the inflected form it was tapped in but may
 *                             add the dictionary form.
 * @param {object}   srsData   the caller's `vocab-srs` progress, and `saveSrs`
 *                             its save — see useAddToReview for why it isn't
 *                             read here
 */
export default function WordPopup({ word, anchorRect, isMobile, onClose, srsData, saveSrs, lastUsedDeckId }) {
  // The deck list is a second *view of this same surface*, not a second
  // floating layer. Previously this popup rendered a DeckComboBox, which
  // opened its own popover anchored to a button inside this one — two
  // stacked layers with competing click-outside handlers and independent
  // positioning. Swapping content in place removes that entirely.
  const [view, setView] = useState('definition')
  const { user } = useAuth()
  const { decks, addToDeck, addToNewDeck } = useAddToReview(srsData, saveSrs)
  const card = { front: word.front ?? word.text, meaning: word.meaning, kana: word.kana, jmdictId: word.jmdictId }

  function close() {
    setView('definition')
    onClose()
  }

  return (
    <Popover
      open
      onClose={close}
      anchorRect={anchorRect}
      isMobile={isMobile}
      title={view === 'deck' ? 'Add to which deck?' : <Japanese>{word.text}</Japanese>}
      bodyPadding={view === 'deck' ? 0 : undefined}
    >
      {view === 'deck' ? (
        <OptionPicker
          items={deckPickerItems(decks, { lastUsedDeckId, exclude: isBundledDeck })}
          onSelect={deckId => { addToDeck(card, deckId); close() }}
          onCreate={name => { addToNewDeck(card, name); close() }}
          placeholder="Search or create a deck"
          emptyMessage="No decks yet"
        />
      ) : (
        <div style={{ padding: `${SPACE_8}px ${SPACE_12}px`, minWidth: 160 }}>
          <Japanese as="div" style={{ fontSize: FS_ENTRY_WORD, color: TEXT, marginBottom: 2 }}>{word.text}</Japanese>
          {word.reading && word.reading !== word.text && (
            <Japanese as="div" style={{ fontSize: FS_BASE, color: TEXT_MUTED, marginBottom: (word.pos || word.meaning) ? 4 : 10 }}>{word.reading}</Japanese>
          )}
          {word.pos && (
            <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED, marginBottom: word.meaning ? 4 : 10, opacity: 0.7 }}>{word.pos}</div>
          )}
          {word.meaning && (
            <div style={{ fontSize: FS_BASE, color: TEXT, marginBottom: 10 }}>{word.meaning}</div>
          )}
          <Button variant="accent-outline" fullWidth disabled={!user} onClick={() => setView('deck')}>
            Add to review deck
          </Button>
          {!user && (
            <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED, marginTop: SPACE_8, textAlign: 'center' }}>
              Create an account to access this feature
            </div>
          )}
        </div>
      )}
    </Popover>
  )
}

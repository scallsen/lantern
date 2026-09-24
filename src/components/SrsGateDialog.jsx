import { useState } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import OptionPicker from './OptionPicker.jsx'
import { suggestedDeckItems } from './deckPickerItems.js'
import { FS_BASE, TEXT_MUTED } from '../data/theme.js'

// The "advance past this chapter?" prompt — opens when unsent words exist,
// via useTextbookAdvance's `gate`. Cancel is the Modal's own header × (aborts
// the advance entirely, tracker stays put) — distinct from the footer's Skip,
// which does advance, just without sending. Per the concept bench, that's
// the whole footer: no separate Cancel button.
//
// Adding asks which deck first, as a second view of this same dialog rather
// than a picker stacked on top of it (the same in-place switch WordPopup
// uses). The book's own deck is pinned first as the suggestion.
// `onSend({ deckId } | { newDeckName })`.
export default function SrsGateDialog({ gate, ...props }) {
  if (!gate) return null
  // Keyed so each opening starts on the question, not a picker left open.
  return <GateDialog key={gate.toId} gate={gate} {...props} />
}

function GateDialog({ gate, chapterLabel, unsentCount, totalCount, decks = {}, suggestedDeck, onCancel, onSkip, onSend, isMobile }) {
  const [view, setView] = useState('confirm')

  if (view === 'deck') {
    return (
      <Modal
        open
        onClose={onCancel}
        title={`Add ${unsentCount} to which deck?`}
        size="sm"
        isMobile={isMobile}
        bodyPadding={0}
        footer={<Button variant="neutral" onClick={() => setView('confirm')}>Back</Button>}
      >
        <OptionPicker
          items={suggestedDeckItems(decks, suggestedDeck)}
          onSelect={deckId => onSend({ deckId })}
          onCreate={name => onSend({ newDeckName: name })}
          placeholder="Search or create a deck"
          emptyMessage="No decks yet"
        />
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title={`Send ${chapterLabel} to your review deck first?`}
      size="sm"
      isMobile={isMobile}
      footer={
        <>
          <Button variant="neutral" onClick={onSkip}>Skip</Button>
          <Button onClick={() => setView('deck')}>Add {unsentCount} to review deck</Button>
        </>
      }
    >
      <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, lineHeight: 1.5 }}>
        {unsentCount} of {totalCount} words from {chapterLabel} aren&apos;t in your review queue.
        Once you move on to {gate.toLabel} they&apos;re easy to forget about.
      </div>
    </Modal>
  )
}

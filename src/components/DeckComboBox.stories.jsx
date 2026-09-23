import { useState } from 'react'
import DeckComboBox from './DeckComboBox.jsx'
import { BRAND, TEXT_MUTED, FS_CAPTION, FS_SM, SPACE_12 } from '../data/theme.js'

const SEED_DECKS = {
  'immersion-words': { id: 'immersion-words', name: 'Immersion Words', source: 'imported', addedAt: 1 },
  'story-words': { id: 'story-words', name: 'Story Words', source: 'imported', addedAt: 2 },
  'vocab-drill-words': { id: 'vocab-drill-words', name: 'Vocabulary Words', source: 'imported', addedAt: 3 },
}

export default {
  title: 'Patterns/Deck Picker',
  component: DeckComboBox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: "A button for adding something to a review deck, picking an existing deck or creating a new one in the same step.\n\n**Use when** a word or card is being sent to a deck — anywhere in the app.\n\n**Don't use** for picking from other kinds of list; put an Option Picker inside a Popover directly.\n\n*Build note:* pass `isMobile` to open it as a bottom sheet." },
      story: { inline: false, iframeHeight: 380 },
    },
  },
  args: { isMobile: false },
}

function DeckPickerStory({ isMobile }) {
  const [decks, setDecks] = useState(SEED_DECKS)
  const [log, setLog] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
      <DeckComboBox
        decks={decks}
        isMobile={isMobile}
        onAdd={id => setLog(`Added to "${decks[id].name}"`)}
        onCreateAndAdd={name => {
          const id = `deck-${Date.now()}`
          setDecks(prev => ({ ...prev, [id]: { id, name, source: 'imported', addedAt: Date.now() } }))
          setLog(`Created "${name}" and added to it`)
        }}
      />
      {log && <div style={{ fontSize: FS_CAPTION, color: BRAND }}>{log}</div>}
      <div style={{ fontSize: FS_SM, color: TEXT_MUTED, lineHeight: 1.5, maxWidth: 380 }}>
        Type a name that doesn&apos;t exist to see the create row — it really does add a deck to this story&apos;s list.
      </div>
    </div>
  )
}

export const Desktop = { render: args => <DeckPickerStory {...args} /> }

export const Mobile = { render: args => <DeckPickerStory {...args} />, args: { isMobile: true } }

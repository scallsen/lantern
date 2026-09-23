import { fn } from 'storybook/test'
import OptionPicker from './OptionPicker.jsx'

const DECKS = [
  { id: 'immersion-words', label: 'Immersion Words', meta: 'Last used' },
  { id: 'story-words', label: 'Story Words' },
  { id: 'vocab-drill-words', label: 'Vocabulary Words' },
]

export default {
  title: 'Overlays/Option Picker',
  component: OptionPicker,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A searchable list for picking one item, with an optional row for creating a new one from what was typed.\n\n**Use when** choosing from a list that can grow long, like decks.\n\n**Don't use** for a short fixed set of options (Chip Selector or Select).\n\n*Build note:* it has no positioning of its own — place it inside a Popover or Modal. Leave out `onCreate` for a pick-only list." } },
  },
  args: { items: DECKS, onSelect: fn(), onCreate: fn(), placeholder: 'Search decks', autoFocus: false },
  decorators: [Story => <div style={{ width: 280, background: '#2A2A2A', borderRadius: 8 }}><Story /></div>],
}

export const WithCreate = {}

export const PickOnly = { args: { onCreate: undefined } }

export const Empty = { args: { items: [], onCreate: undefined } }

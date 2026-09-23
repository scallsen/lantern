import { useState } from 'react'
import PinnedShelf from './PinnedShelf.jsx'
import { FONT, FS_BASE, TEXT_MUTED } from '../data/theme.js'

// Same shape TrackedAnimeSection builds: media type + Jiten difficulty badges.
const ITEMS = [
  { id: 'p1', title: "Frieren: Beyond Journey's End", coverUrl: null, badges: [{ label: 'anime', tone: 'accent' }, { label: 'Upper-Int (2.4)', tone: 'accent' }] },
  { id: 'p2', title: 'Spy × Family', coverUrl: null, badges: [{ label: 'anime', tone: 'accent' }, { label: 'Beginner (1.6)', tone: 'accent' }] },
  { id: 'p3', title: 'Bocchi the Rock!', coverUrl: null, badges: [{ label: 'anime', tone: 'accent' }, { label: 'Intermediate (2.0)', tone: 'accent' }] },
  { id: 'p4', title: 'Mushoku Tensei', coverUrl: null, badges: [{ label: 'anime', tone: 'accent' }, { label: 'Upper-Int (2.6)', tone: 'accent' }] },
]

function PinnedShelfStory(args) {
  const [items, setItems] = useState(args.items)
  return (
    <>
      <PinnedShelf items={items} onRemove={id => setItems(prev => prev.filter(i => i.id !== id))} />
      {items.length === 0 && (
        <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, fontFamily: FONT }}>Untracked everything. Reload the story to reset.</div>
      )}
    </>
  )
}

export default {
  title: 'Patterns/Pinned Shelf',
  component: PinnedShelf,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A small set of items the learner has pinned, shown as one row of covers that scrolls sideways — Anime Vocab's \"Currently studying\".\n\n**Use when** the learner explicitly adds and removes items and the set should never push the rest of the page down.\n\n**Don't use** for a history that fills itself in, like recently read articles (give that its own component), or for records to scan or select (Data List).\n\n*Build note:* each tile is a Feed Card in `image` mode; passing `onRemove` adds the remove button." } },
  },
  args: { items: ITEMS },
  decorators: [Story => <div style={{ width: 420 }}><Story /></div>],
  render: args => <PinnedShelfStory {...args} />,
}

export const Default = {}

export const Overflowing = {
  args: { items: [...ITEMS, ...ITEMS.map(i => ({ ...i, id: `${i.id}-b` }))] },
}

export const ReadOnly = {
  render: args => <PinnedShelf items={args.items} />,
}

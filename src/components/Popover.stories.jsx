import { useRef, useState } from 'react'
import Popover from './Popover.jsx'
import OptionPicker from './OptionPicker.jsx'
import Button from './Button.jsx'
import { TEXT_MUTED, FS_BASE } from '../data/theme.js'

export default {
  title: 'Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: "A small floating panel attached to whatever opened it — the account menu, a deck's menu, a word's definition.\n\n**Use when** a short, contextual choice or detail belongs to one element.\n\n**Don't use** for longer tasks (Modal).\n\n*Build note:* it handles position only; put Option Picker or your own content inside. Anchor it to an element (`anchorRef`) or a clicked spot in text (`anchorRect`). Pass `isMobile` to show it as a bottom sheet instead." },
      story: { inline: false, iframeHeight: 360 },
    },
  },
  argTypes: { align: { control: 'select', options: ['start', 'end'] } },
  args: { align: 'start', isMobile: false, title: 'Options', width: 260 },
}

function PopoverStory(args) {
  const anchorRef = useRef(null)
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button ref={anchorRef} variant="neutral" onClick={() => setOpen(v => !v)}>Open popover</Button>
      <Popover {...args} open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} bodyPadding={12}>
        <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, lineHeight: 1.5 }}>Any content — Popover knows nothing about it.</div>
      </Popover>
    </div>
  )
}

export const AnchoredToButton = { render: args => <PopoverStory {...args} /> }

export const MobileSheet = { render: args => <PopoverStory {...args} />, args: { isMobile: true } }

function WithPicker(args) {
  const anchorRef = useRef(null)
  const [open, setOpen] = useState(false)
  const items = [
    { id: 'immersion-words', label: 'Immersion Words', meta: 'Last used' },
    { id: 'story-words', label: 'Story Words' },
  ]
  return (
    <div>
      <Button ref={anchorRef} variant="accent-outline" onClick={() => setOpen(v => !v)}>Add to deck</Button>
      <Popover {...args} open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} title="Add to which deck?">
        <OptionPicker items={items} onSelect={() => setOpen(false)} onCreate={() => setOpen(false)} placeholder="Search decks" />
      </Popover>
    </div>
  )
}

export const ComposedWithOptionPicker = { render: args => <WithPicker {...args} /> }

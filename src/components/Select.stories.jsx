import { useState } from 'react'
import Select from './Select.jsx'
import TextInput from './TextInput.jsx'
import { SPACE_12 } from '../data/theme.js'

const OPTIONS = [
  { label: 'Nihongo So-Matome N3', options: [{ value: 'all', label: 'All lists' }, { value: 'w1d1', label: 'Week 1, Day 1' }] },
  { label: 'Review decks', options: [{ value: 'imported', label: 'Immersion Words' }] },
]

export default {
  title: 'Atoms/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A dropdown for choosing one value from a longer list — a word list, a story format.\n\n**Use when** there are too many options to show at once, or the choice is made rarely.\n\n**Don't use** when a few options fit on screen (Chip Selector shows them all at once) or for an on/off setting (Switch).\n\n*Build note:* `variant=\"inline\"` inside a Filter Card next to chip rows; `size=\"sm\"` in settings, `md` beside a Text Input in a form. Grouped options render as sections." } },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    variant: { control: 'select', options: ['default', 'inline'] },
  },
  args: { size: 'sm', variant: 'default', options: OPTIONS },
}

function ControlledSelect(args) {
  const [value, setValue] = useState('w1d1')
  return (
    <div style={{ width: 320 }}>
      <Select {...args} value={value} onChange={setValue} />
    </div>
  )
}

export const Playground = { render: args => <ControlledSelect {...args} /> }

export const Inline = { render: args => <ControlledSelect {...args} />, args: { variant: 'inline' } }

function BesideTextInput(args) {
  const [value, setValue] = useState('w1d1')
  return (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
      <Select {...args} value={value} onChange={setValue} />
      <TextInput value="" onChange={() => {}} placeholder={`a ${args.size} TextInput next to it`} size={args.size} />
    </div>
  )
}

export const AlignedWithTextInput = { render: args => <BesideTextInput {...args} /> }

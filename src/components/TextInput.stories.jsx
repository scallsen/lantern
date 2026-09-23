import { useState } from 'react'
import TextInput from './TextInput.jsx'

export default {
  title: 'Atoms/Text Input',
  component: TextInput,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A single line for typing free text — a search, a deck name, a word.\n\n**Use when** the answer can't be picked from a known set.\n\n**Don't use** for a bounded number (Number Field) or for choosing from known options (Select or Chip Selector).\n\n*Build note:* use `variant=\"bare\"` inside a container that already draws a border." } },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'bare'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { variant: 'default', size: 'md', disabled: false, placeholder: 'Search Jiten.moe' },
}

function ControlledInput(args) {
  const [value, setValue] = useState('')
  return (
    <div style={{ width: 340 }}>
      <TextInput {...args} value={value} onChange={setValue} />
    </div>
  )
}

export const Playground = { render: args => <ControlledInput {...args} /> }

export const Bare = { render: args => <ControlledInput {...args} />, args: { variant: 'bare' } }

export const Disabled = { render: args => <ControlledInput {...args} />, args: { disabled: true } }

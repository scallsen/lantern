import { useState } from 'react'
import NumberField from './NumberField.jsx'

export default {
  title: 'Atoms/Number Field',
  component: NumberField,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A small number with limits — cards per day, a lapse threshold.\n\n**Use when** the value is a count with a sensible minimum and maximum.\n\n**Don't use** for free text (Text Input) or for picking one of a few fixed values (Chip Selector)." } },
  },
  args: { min: 0, max: 999, disabled: false },
}

function ControlledNumberField(args) {
  const [value, setValue] = useState(10)
  return <NumberField {...args} value={value} onChange={setValue} />
}

export const Playground = { render: args => <ControlledNumberField {...args} /> }

export const Disabled = { render: args => <ControlledNumberField {...args} />, args: { disabled: true } }

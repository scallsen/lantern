import { useState } from 'react'
import Checkbox from './Checkbox.jsx'

export default {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A box with its own label for one on/off option placed right where it applies — \"Common words only\" above dictionary results, \"Include review words\" before a drill.\n\n**Use when** a single option changes what the list or action next to it includes.\n\n**Don't use** for a row in a settings panel (Switch), for choosing among several visible options (Chip Selector), or for selecting rows in a list (Data List's selection)." } },
  },
  args: { label: 'Common words only', subtext: '', disabled: false },
}

function ControlledCheckbox(args) {
  const [checked, setChecked] = useState(false)
  return <Checkbox {...args} checked={checked} onChange={() => setChecked(v => !v)} />
}

export const Playground = { render: args => <ControlledCheckbox {...args} /> }

export const WithSubtext = {
  render: args => <ControlledCheckbox {...args} />,
  args: { label: 'Include review words (12)', subtext: 'Words your class marked for review, added to this drill' },
}

export const Disabled = { render: args => <ControlledCheckbox {...args} />, args: { disabled: true } }

import { useState } from 'react'
import FileButton from './FileButton.jsx'
import { TEXT_MUTED, FS_CAPTION, SPACE_12 } from '../data/theme.js'

export default {
  title: 'Atoms/File Button',
  component: FileButton,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A button that opens the file picker — import an Anki export, photograph a textbook page.\n\n**Use when** the next step needs a file from the person's device.\n\n**Don't use** for any other action (Button).\n\n*Build note:* `accept` and `capture` pass through; `capture=\"environment\"` opens the rear camera on phones." } },
  },
  args: { accept: '.txt,.json', children: 'Choose file' },
}

function FileButtonWithName(args) {
  const [name, setName] = useState(null)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE_12 }}>
      <FileButton {...args} onFile={f => setName(f.name)} />
      <span style={{ fontSize: FS_CAPTION, color: TEXT_MUTED }}>{name ?? 'nothing picked yet'}</span>
    </div>
  )
}

export const Playground = { render: args => <FileButtonWithName {...args} /> }

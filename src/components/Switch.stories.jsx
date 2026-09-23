import { useState } from 'react'
import Switch from './Switch.jsx'
import { ModuleThemeProvider } from '../context/ModuleThemeContext.jsx'
import { FS_BASE, FS_CAPTION, SPACE_16 } from '../data/theme.js'

const ROW = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }

export default {
  title: 'Atoms/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "Turns a setting on or off, taking effect immediately. Sits at the end of a row whose label says what it controls.\n\n**Use when** a settings row is either on or off — furigana, sound effects.\n\n**Don't use** for an action whose label changes with state, like Follow / Unfollow (Toggle Button), or for an option that needs its own label and explanation beside it (Checkbox).\n\n*Build note:* give the row the `settings-row` class so hovering anywhere on the row lights the switch." } },
  },
  args: { disabled: false, label: 'Furigana' },
}

function SettingsRows(args) {
  const [checked, setChecked] = useState(true)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_16, width: '100%', maxWidth: 320 }}>
      <div style={{ fontSize: FS_CAPTION, color: 'rgba(255,255,255,0.3)' }}>A settings row — the row is the mouse hit target, the switch keeps its own keyboard focus</div>
      <div className="settings-row" style={ROW}>
        <span style={{ fontSize: FS_BASE }}>Furigana</span>
        <Switch {...args} checked={checked} onChange={() => setChecked(v => !v)} />
      </div>
      <ModuleThemeProvider accent="#E06C9F">
        <div style={ROW}>
          <span style={{ fontSize: FS_BASE }}>Inside a pink module</span>
          <Switch {...args} checked={checked} onChange={() => setChecked(v => !v)} />
        </div>
      </ModuleThemeProvider>
    </div>
  )
}

export const InSettingsRow = { render: args => <SettingsRows {...args} /> }

export const Disabled = { render: args => <SettingsRows {...args} />, args: { disabled: true } }

import { useState } from 'react'
import ToggleButton from './ToggleButton.jsx'
import { ModuleThemeProvider } from '../context/ModuleThemeContext.jsx'
import { FS_CAPTION, SPACE_8, SPACE_24 } from '../data/theme.js'

const ANIME_ACCENT = '#D46EA3'
const caption = { fontSize: FS_CAPTION, color: 'rgba(255,255,255,0.3)', marginBottom: SPACE_8 }

export default {
  title: 'Patterns/Toggle Button',
  component: ToggleButton,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A button that switches something on or off, whose label says what clicking it will do — Follow / Unfollow, deck On / Off.\n\n**Use when** one thing has two states and people flip between them directly.\n\n**Don't use** for choosing between options (Chip Selector) or for a settings row (Switch).\n\n*Build note:* set `destructiveHover` when turning it off undoes something, like Unfollow, so hovering previews that in red." } },
  },
  argTypes: { activeTone: { control: 'select', options: ['accent', 'success', 'neutral'] } },
  args: { activeTone: 'success', destructiveHover: true, disabled: false },
}

function ToggleStory({ activeTone, destructiveHover, disabled }) {
  const [followed, setFollowed] = useState(false)
  const [deckOn, setDeckOn] = useState(true)
  return (
    <ModuleThemeProvider accent={ANIME_ACCENT}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_24, alignItems: 'flex-start' }}>
        <div>
          <div style={caption}>Follow / Unfollow — anime episode (hover while active to preview undoing)</div>
          <ToggleButton active={followed} labels={{ on: 'Unfollow', off: 'Follow' }} onClick={() => setFollowed(v => !v)} size="md" activeTone={activeTone} destructiveHover={destructiveHover} disabled={disabled} />
        </div>
        <div>
          <div style={caption}>Deck On / Off — Reviews home (accent tone, non-destructive)</div>
          <ToggleButton active={deckOn} labels={{ on: 'On', off: 'Off' }} onClick={() => setDeckOn(v => !v)} activeTone="accent" />
        </div>
      </div>
    </ModuleThemeProvider>
  )
}

export const Playground = { render: args => <ToggleStory {...args} /> }

export const NeutralViewSwitch = {
  render: () => {
    function Furigana() {
      const [on, setOn] = useState(true)
      return <ToggleButton active={on} labels={{ on: 'Hide furigana', off: 'Show furigana' }} onClick={() => setOn(v => !v)} activeTone="neutral" />
    }
    return <Furigana />
  },
}

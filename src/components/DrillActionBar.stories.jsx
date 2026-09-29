import { fn } from 'storybook/test'
import DrillActionBar from './DrillActionBar.jsx'
import SpeedModeControls from './SpeedModeControls.jsx'

// Rendered in a tall frame with the bar at the bottom, the way a drill pins it.
function Frame({ isMobile, isFlipped }) {
  return (
    <div style={{ width: isMobile ? 375 : 900, height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', border: '1px solid rgba(255,255,255,0.08)' }}>
      <DrillActionBar isMobile={isMobile} correct={6} troubled={1} remaining={20}>
        <SpeedModeControls isFlipped={isFlipped} transitioning={false} onVerdict={fn()} onFlip={fn()} onUndo={fn()} canUndo />
      </DrillActionBar>
    </div>
  )
}

export default {
  title: 'Drill/Drill Action Bar',
  component: DrillActionBar,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A card drill's bottom bar: the button row (Undo, then Flip card or the verdict buttons) and the session's counts, pinned under the card so they never move while the card, its details panel and the credit line scroll above and beneath. Counts beside the buttons on desktop, under them on a phone.\n\n**Use when** a drill shows one card at a time — Vocab Drill, Reviews.\n\n**Don't use** for a screen's ordinary primary actions (Action Bar, which this is built on) or for the drill's streak and hints (Drill HUD).\n\n*Build note:* it's the Action Bar in its `inFlow` form — place it in a `position: sticky; bottom: 0` slot at the end of the drill's scroll area, and pass Drill HUD `showUndo={false} showCounts={false}`." } },
  },
  args: { isMobile: false, isFlipped: true },
}

export const Desktop = { render: args => <Frame {...args} /> }

export const DesktopBeforeFlip = { render: args => <Frame {...args} />, args: { isFlipped: false } }

export const Phone = { render: args => <Frame {...args} />, args: { isMobile: true } }

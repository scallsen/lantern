import { fn } from 'storybook/test'
import SpeedModeControls from './SpeedModeControls.jsx'

export default {
  title: 'Drill/Speed Mode Controls',
  component: SpeedModeControls,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "The ready-made Incorrect / Correct pair for fast drills, labelled with their Z and X keys. Before the flip it's a “Flip card [Space]” button the same height, and an Undo square can lead the row on both faces.\n\n**Use when** running a speed drill — Vocab Drill, Anime Vocab.\n\n**Don't use** for spaced-repetition reviews that need four grades (a row of Drill Buttons).\n\n*Build note:* the key labels are display only — the drill page listens for Z, X and Space itself. Pass `onFlip` for the flip button (without it, the older “Click to flip” text shows) and `onUndo` / `canUndo` for the Undo square; the drill then passes `showUndo={false}` to Drill HUD." } },
  },
  args: { isFlipped: true, transitioning: false, onVerdict: fn() },
  decorators: [Story => <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}><Story /></div>],
}

export const Flipped = {}

export const WithUndoAndFlip = { args: { isFlipped: false, onFlip: fn(), onUndo: fn(), canUndo: true } }

export const WithUndoFlipped = { args: { onFlip: fn(), onUndo: fn(), canUndo: true } }

export const NotFlipped = { args: { isFlipped: false } }

export const Transitioning = { args: { transitioning: true } }

import { fn } from 'storybook/test'
import SpeedModeControls from './SpeedModeControls.jsx'

export default {
  title: 'Drill/Speed Mode Controls',
  component: SpeedModeControls,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "The ready-made Incorrect / Correct pair for fast drills, labelled with their Z and X keys, with a flip prompt until the answer is showing.\n\n**Use when** running a speed drill — Vocab Drill, Anime Vocab.\n\n**Don't use** for spaced-repetition reviews that need four grades (a row of Drill Buttons).\n\n*Build note:* the key labels are display only — the drill page listens for Z and X itself." } },
  },
  args: { isFlipped: true, transitioning: false, onVerdict: fn() },
  decorators: [Story => <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}><Story /></div>],
}

export const Flipped = {}

export const NotFlipped = { args: { isFlipped: false } }

export const Transitioning = { args: { transitioning: true } }

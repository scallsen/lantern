import { fn } from 'storybook/test'
import DrillHUD from './DrillHUD.jsx'

export default {
  title: 'Drill/Drill HUD',
  component: DrillHUD,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "Live stats above a running drill — correct, missed, remaining, streak — with undo.\n\n**Use when** a drill session is in progress.\n\n**Don't use** outside a session, or for the summary after one (the done screen)." } },
  },
  argTypes: { streak: { control: { type: 'range', min: 0, max: 40 } } },
  args: {
    streak: 7, bestStreak: 22, correct: 14, troubled: 3, remaining: 28,
    canUndo: true, onUndo: fn(), showStreak: true, showVisualEffects: true,
  },
  decorators: [Story => <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}><Story /></div>],
}

export const Playground = {}

export const Wiggling = { args: { streak: 12 } }

export const Waving = { args: { streak: 24 } }

export const NoStreak = { args: { showStreak: false } }

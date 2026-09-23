import DrillButtonRow, { DrillButton } from './DrillButton.jsx'
import { DRILL_COLORS } from '../data/theme.js'

export default {
  title: 'Drill/Drill Button',
  component: DrillButton,
  subcomponents: { DrillButtonRow },
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "The grading buttons under a flashcard — Again / Hard / Good / Easy, or Incorrect / Correct.\n\n**Use when** people grade their own recall in a drill.\n\n**Don't use** for general actions (Button).\n\n*Build note:* always inside a `DrillButtonRow`, which also shows the \"flip\" prompt before the answer is revealed. `hint` only labels the key; the drill page handles the key press. Colours come from the drill palette, not the semantic colours." } },
  },
  decorators: [Story => <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}><Story /></div>],
}

export const FourWayRating = {
  render: () => (
    <DrillButtonRow>
      <DrillButton label="Again" hint="1" color={DRILL_COLORS.again} />
      <DrillButton label="Hard" hint="2" color={DRILL_COLORS.hard} />
      <DrillButton label="Good" hint="3" color={DRILL_COLORS.good} />
      <DrillButton label="Easy" hint="4" color={DRILL_COLORS.easy} />
    </DrillButtonRow>
  ),
}

export const VerdictPair = {
  render: () => (
    <DrillButtonRow>
      <DrillButton label="Incorrect" hint="Z" color={DRILL_COLORS.again} />
      <DrillButton label="Correct" hint="X" color={DRILL_COLORS.good} />
    </DrillButtonRow>
  ),
}

export const PreFlipPlaceholder = { render: () => <DrillButtonRow placeholder="Space or tap to flip" /> }

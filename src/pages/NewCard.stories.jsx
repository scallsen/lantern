import { fn } from 'storybook/test'
import { NewCard } from './homeCards.jsx'
import { NEW_CARD_STATES, CARD_WIDTHS } from './homeCardFixtures.js'

export default {
  title: 'Home/New Card',
  component: NewCard,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "The home page's \"New\" card: progress through the chosen textbook, and the button to start the next chapter.\n\nUsed on the home page only. These stories show every state it can be in, for design review — the progress is fed through the same code the app uses, so the states match what people actually see." } },
  },
  argTypes: { width: { control: 'select', options: CARD_WIDTHS } },
  args: { width: 400, onStart: fn(), onAdvance: fn(), onChangeTextbook: fn() },
  render: ({ width, ...args }) => <div style={{ width }}><NewCard {...args} /></div>,
}

export const Loading = { args: NEW_CARD_STATES.loading }
export const NoTextbookChosen = { args: NEW_CARD_STATES.empty }
export const ChosenNothingStarted = { args: NEW_CARD_STATES.fresh }
export const CurrentChapterDrilled = { args: NEW_CARD_STATES.inProgress }
export const ScoreBelowTarget = { args: NEW_CARD_STATES.belowTarget }
export const ScoreTargetReached = { args: NEW_CARD_STATES.targetReached }
export const MidBookCurrentNotDrilled = { args: NEW_CARD_STATES.nextUntouched }
export const BookComplete = { args: NEW_CARD_STATES.complete }
export const BookWithNoWords = { args: NEW_CARD_STATES.noWords }
export const LongTitleAndLabels = { args: NEW_CARD_STATES.long }

import { fn } from 'storybook/test'
import { NewCard, ReviewCard } from './homeCards.jsx'
import { NEW_CARD_STATES, REVIEW_CARD_STATES, CARD_WIDTHS } from './homeCardFixtures.js'
import { SPACE_12 } from '../data/theme.js'

// Bottom-alignment between the two cards only reads when both are on screen
// in the same row — their primary buttons should share a baseline.
export default {
  title: 'Home/Card Pairs',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "The New and Review cards side by side, as they sit on the home page.\n\nUse these to check the two cards against each other — their main buttons should line up on the same baseline." } },
  },
  argTypes: {
    width: { control: 'select', options: CARD_WIDTHS },
    newState: { table: { disable: true } },
    reviewState: { table: { disable: true } },
  },
  args: { width: 400 },
  render: ({ width, newState, reviewState }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(2, ${width}px)`, gap: SPACE_12 }}>
      <NewCard {...newState} onStart={fn()} onAdvance={fn()} onChangeTextbook={fn()} />
      <ReviewCard {...reviewState} onSignIn={fn()} />
    </div>
  ),
}

export const FirstRun = { args: { newState: NEW_CARD_STATES.empty, reviewState: REVIEW_CARD_STATES.signedOut } }
export const TypicalReturningUser = { args: { newState: NEW_CARD_STATES.belowTarget, reviewState: REVIEW_CARD_STATES.due } }
export const StudiedEverythingToday = { args: { newState: NEW_CARD_STATES.complete, reviewState: REVIEW_CARD_STATES.caughtUp } }

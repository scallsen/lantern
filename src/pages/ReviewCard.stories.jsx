import { fn } from 'storybook/test'
import { ReviewCard } from './homeCards.jsx'
import { REVIEW_CARD_STATES, CARD_WIDTHS } from './homeCardFixtures.js'

export default {
  title: 'Home/Review Card',
  component: ReviewCard,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "The home page's \"Review\" card: what's due in reviews today, and the button to start.\n\nUsed on the home page only. These stories show every state it can be in, for design review." } },
  },
  argTypes: { width: { control: 'select', options: CARD_WIDTHS } },
  args: { width: 400, onSignIn: fn() },
  render: ({ width, ...args }) => <div style={{ width }}><ReviewCard {...args} /></div>,
}

export const Loading = { args: REVIEW_CARD_STATES.loading }
export const SignedOut = { args: REVIEW_CARD_STATES.signedOut }
export const SignedInNoCards = { args: REVIEW_CARD_STATES.noCards }
export const ReviewsWaiting = { args: REVIEW_CARD_STATES.due }
export const NothingDueNewAvailable = { args: REVIEW_CARD_STATES.newOnly }
export const AllCaughtUp = { args: REVIEW_CARD_STATES.caughtUp }
export const LargeNumbers = { args: REVIEW_CARD_STATES.big }

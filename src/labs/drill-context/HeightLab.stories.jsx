import HeightLab from './HeightLab.jsx'
import { AuthProvider } from '../../context/AuthContext.jsx'

// Fitting the drill screen into a short window with the card kept at full
// size: five layouts against today's, each measured live.
export default {
  title: 'Labs/Drill Screen Height',
  decorators: [Story => <AuthProvider><Story /></AuthProvider>],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: { component: 'Design lab: keeping the drill card at 380 × 280 on short windows — credit line out, counts in the header, both, side by side, or buttons pinned to the bottom — each frame measured live for whether it scrolls.' },
    },
  },
}

export const Overview = { render: () => <HeightLab /> }

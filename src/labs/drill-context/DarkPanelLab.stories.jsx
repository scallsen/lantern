import DarkPanelLab from './DarkPanelLab.jsx'

// Dark versions of the details panel under a paper card — the real
// CardDetails with its palette swapped, fed frozen data.
export default {
  title: 'Labs/Details Panel Dark',
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: { component: 'Design lab: the drill card’s details panel in dark palettes (ink, surface, outline, well) beside today’s paper, keeping light for the card above.' },
    },
  },
}

export const Overview = { render: () => <DarkPanelLab /> }

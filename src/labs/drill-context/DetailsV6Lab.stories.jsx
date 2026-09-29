import DetailsV6Lab from './DetailsV6Lab.jsx'

// Iteration 6: the settled details panel — balanced spacing, the L1 popover,
// and a redacted front that fades to the real content on the flip.
export default {
  title: 'Labs/Details Panel v6',
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: { component: 'Design lab, iteration 6: the settled details panel under the drill card. The sentence sits above a kanji footer, and a redacted front fades to the real content in place on the flip.' },
    },
  },
}

export const Overview = { render: () => <DetailsV6Lab /> }

import DetailsV7Lab from './DetailsV7Lab.jsx'

// Iteration 7: reveal timing, rounded redaction, sentence-only / kanji-only,
// one popover at a time, and the card's reading position.
export default {
  title: 'Labs/Details Panel v7',
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: { component: 'Design lab, iteration 7: the details panel with its reveal timed to the flip, sentence-only and kanji-only states behind an "at least one" rule, and the card’s reading placed below the word by default.' },
    },
  },
}

export const Overview = { render: () => <DetailsV7Lab /> }

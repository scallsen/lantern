import DetailsV4Lab from './DetailsV4Lab.jsx'

// Iteration 4: no tabs, and holding the panel's space so the card never moves.
export default {
  title: 'Labs/Details Panel v4',
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: { component: 'Design lab, iteration 4: four layouts that show the sentence and the kanji meanings at once (related words one tap away), and four ways to reserve the panel’s space before the flip.' },
    },
  },
}

export const Overview = { render: () => <DetailsV4Lab /> }

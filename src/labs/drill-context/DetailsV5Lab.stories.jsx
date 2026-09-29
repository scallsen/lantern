import DetailsV5Lab from './DetailsV5Lab.jsx'

// Iteration 5: the locked sentence + kanji-footer panel, popover lists, and the front.
export default {
  title: 'Labs/Details Panel v5',
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: { component: 'Design lab, iteration 5: the locked details panel (sentence above, kanji footer), four cleaner related-word lists for the popover, and five ways to show the panel before the flip.' },
    },
  },
}

export const Overview = { render: () => <DetailsV5Lab /> }

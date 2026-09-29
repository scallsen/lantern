import DetailsLab from './DetailsLab.jsx'

// Iteration 3 of the context band, now the Details panel.
export default {
  title: 'Labs/Details Panel v3',
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: { component: 'Design lab, iteration 3: four designs for the tab/hide bar, a single-sentence pane with a muted replay icon, and the panel renamed to Details on the page and in the settings drawer.' },
    },
  },
}

export const Overview = { render: () => <DetailsLab /> }

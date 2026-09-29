import ContextBandLab from './ContextBandLab.jsx'

// Iteration 2 of concept C (Context band) from the Drill Card Context lab.
export default {
  title: 'Labs/Context Band v2',
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: { component: 'Design lab, iteration 2 of the context band: two tabs, a sentence-first pane, three lighter kanji views, and show/hide on the page kept in sync with the settings drawer.' },
    },
  },
}

export const Overview = { render: () => <ContextBandLab /> }

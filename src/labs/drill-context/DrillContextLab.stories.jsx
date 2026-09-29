import DrillContextLab, { ConceptPlayground } from './DrillContextLab.jsx'
import { CONCEPTS } from './conceptList.js'

// Exploration, not a component: directions for giving the drill card's
// example sentence and kanji real room. Frozen fixtures (fixtures.json) so
// every frame is reproducible offline.
export default {
  title: 'Labs/Drill Card Context',
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 900 },
      description: { component: 'Design lab: seven directions for the vocab drill card, each shown live on a desktop and a phone frame, with notes for feedback. **Overview** is the whole lab; the other stories show one concept at 1:1.' },
    },
  },
}

export const Overview = { render: () => <DrillContextLab /> }

const playground = id => ({
  render: args => <ConceptPlayground key={`${id}-${args.device}`} conceptId={id} device={args.device} />,
  args: { device: 'desktop' },
  argTypes: { device: { control: 'inline-radio', options: ['desktop', 'phone'] } },
  name: (() => { const c = CONCEPTS.find(x => x.id === id); return `${c.tag} · ${c.name}` })(),
})

export const Today = playground('today')
export const SentenceTape = playground('tape')
export const KanjiFamily = playground('kanji')
export const ContextBand = playground('band')
export const SentenceFront = playground('front')
export const SentenceFirst = playground('stage')
export const WordSheet = playground('sheet')

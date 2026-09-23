import DistributionBar from './DistributionBar.jsx'

const DECK_SEGMENTS = [
  { key: 'new', label: 'Unlearned', count: 412, description: 'Never reviewed — waiting for its first study session' },
  { key: 'learning', label: 'Learning', count: 38, description: 'Answered correctly once, not yet graduated' },
  { key: 'young', label: 'Young', count: 156, description: 'Graduated, interval under 21 days — still fragile' },
  { key: 'mature', label: 'Mature', count: 890, description: 'Graduated with a 21+ day interval' },
  { key: 'relearning', label: 'Relearning', count: 11, description: 'Was graduated, just answered wrong' },
]

export default {
  title: 'Patterns/Distribution Bar',
  component: DistributionBar,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "Shows how a collection splits across states — a deck's cards across unlearned, learning, young, mature and relearning.\n\n**Use when** the proportions matter more than exact numbers.\n\n**Don't use** for progress toward a single finish line (Top Progress Bar) or for comparing unrelated numbers.\n\n*Build note:* the default colours are the card-state ramp, chosen to stay distinguishable with colour blindness — don't swap them." } },
  },
  args: { segments: DECK_SEGMENTS, showLegend: true },
  decorators: [Story => <div style={{ width: 420 }}><Story /></div>],
}

export const WithLegend = {}

export const BarOnly = { args: { showLegend: false } }

import Badge from './Badge.jsx'

export default {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A small label that classifies an item — JLPT level, part of speech, review status.\n\n**Use when** an item carries a short category or status that people scan for.\n\n**Don't use** for anything clickable (Chip Selector) or for numbers and stats.\n\n*Build note:* `tone` carries the meaning (accent, success, warning, danger, neutral); `dimmed` marks an approximate value, like an estimated JLPT level." } },
  },
  argTypes: {
    tone: { control: 'select', options: ['accent', 'success', 'warning', 'danger', 'neutral'] },
    variant: { control: 'select', options: ['fill', 'text'] },
  },
  args: {
    tone: 'accent',
    variant: 'fill',
    dimmed: false,
    children: 'common',
  },
}

export const Playground = {}

export const AllTones = {
  render: args => (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {['accent', 'success', 'warning', 'danger', 'neutral'].map(tone => (
        <Badge key={tone} tone={tone} variant={args.variant}>{tone}</Badge>
      ))}
    </div>
  ),
}

export const Dimmed = {
  args: { dimmed: true, children: '~N3' },
}

import Card from './Card.jsx'
import { TEXT, TEXT_MUTED, FS_BASE, FS_CAPTION, SPACE_4, SPACE_16 } from '../data/theme.js'

export default {
  title: 'Atoms/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A raised surface that groups related content into one block — a dictionary definition, a kanji breakdown, an example sentence, the home page's two main cards.\n\n**Use when** a piece of content belongs together and should read as one unit.\n\n**Don't use** for rows of similar records (Data List) or for an item in a feed that people open (Feed Card)." } },
  },
  argTypes: { padding: { control: { type: 'number', min: 0, max: 48 } } },
  args: { padding: SPACE_16 },
}

export const Playground = {
  render: args => (
    <Card {...args} style={{ width: 320 }}>
      <div style={{ fontSize: FS_BASE, color: TEXT, marginBottom: SPACE_4 }}>Immersion Words</div>
      <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED }}>142 cards · imported deck</div>
    </Card>
  ),
}

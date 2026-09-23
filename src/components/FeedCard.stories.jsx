import FeedCard from './FeedCard.jsx'
import { SPACE_12 } from '../data/theme.js'

export default {
  title: 'Patterns/Feed Card',
  component: FeedCard,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "One item in a feed that people browse and open — an article, a story.\n\n**Use when** each item is something to read, with a title, labels and a date.\n\n**Don't use** for records to scan or select (Data List).\n\n*Build note:* `read` adds a ✓ to items already opened; `image` adds an optional cover." } },
  },
  args: {
    badges: [{ label: 'NHK Easy', tone: 'accent' }, { label: 'N4', tone: 'neutral' }],
    title: '日本の桜が今年は早く咲きました',
    subtitle: "Japan's cherry blossoms bloomed early this year",
    meta: 'Aug 28, 2026',
    read: false,
    disabled: false,
  },
  decorators: [Story => <div style={{ width: 420 }}><Story /></div>],
}

export const Article = {}

export const Read = { args: { read: true } }

export const NoSubtitle = {
  args: { badges: [{ label: 'Dialogue', tone: 'neutral' }], title: 'コンビニでの会話', subtitle: undefined, meta: 'Aug 27, 2026' },
}

export const Feed = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
      <FeedCard badges={[{ label: 'NHK Easy', tone: 'accent' }, { label: 'N4', tone: 'neutral' }]} title="日本の桜が今年は早く咲きました" subtitle="Japan's cherry blossoms bloomed early this year" meta="Aug 28, 2026" />
      <FeedCard badges={[{ label: 'Dialogue', tone: 'neutral' }]} title="コンビニでの会話" meta="Aug 27, 2026" read />
    </div>
  ),
}

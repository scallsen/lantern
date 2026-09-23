import SectionHeader from './SectionHeader.jsx'
import Button from './Button.jsx'
import { TEXT_MUTED, FS_CAPTION, SPACE_16 } from '../data/theme.js'

export default {
  title: 'Layout/Section Header',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "Labels a group of content within a screen — \"Kanji\", \"Words\", a settings group.\n\n**Use when** a screen holds more than one distinct group and people need to tell them apart.\n\n**Don't use** as the page title (Page Header), or when there's only one group to label.\n\n*Build note:* `action` puts a button on the right; `marginTop` spaces stacked groups apart." } },
  },
  args: { title: 'Review words' },
}

export const Playground = {}

export const StackedGroups = {
  render: () => (
    <div style={{ width: 360 }}>
      <SectionHeader title="Review words" action={<Button variant="accent-outline" size="sm">Add 2 to review deck</Button>} />
      <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED, marginBottom: SPACE_16 }}>…section content…</div>
      <SectionHeader title="Kanji" marginTop={28} />
      <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED }}>…the next group…</div>
    </div>
  ),
}

export const WithClearAll = {
  args: { title: 'Card back', hasSelections: true, onClearAll: () => {} },
}

import { useState } from 'react'
import ChipSelector, { Chip } from './Chip.jsx'
import { ModuleThemeProvider } from '../context/ModuleThemeContext.jsx'
import { BRAND, TEXT_MUTED, FS_SM, SPACE_12 } from '../data/theme.js'

const MULTI_OPTIONS = [
  { value: 'anime', label: 'Anime' }, { value: 'drama', label: 'Drama' },
  { value: 'movie', label: 'Movie' }, { value: 'manga', label: 'Manga' },
]
const JLPT_OPTIONS = ['N5', 'N4', 'N3', 'N2', 'N1'].map(v => ({ value: v, label: v }))
const TAB_OPTIONS = [{ value: 'text', label: 'Paste text' }, { value: 'image', label: 'Image (OCR)' }]
// A per-instance override still exists on Chip; this only shows it's wired up.
// Not a second app accent — see brand/BRAND.md's Don'ts.
const ANIME_ACCENT = '#D46EA3'

export default {
  title: 'Selection/Chip Selector',
  component: ChipSelector,
  subcomponents: { Chip },
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A row of visible options for picking one, several, or a minimum level.\n\n**Use when** there are a few options (roughly two to seven) and seeing them all at once helps — media type, import method, minimum JLPT level.\n\n**Don't use** for long lists (Select) or a single on/off (Switch or Toggle Button).\n\n*Build note:* `mode` is `multi`, `single` or `threshold` (\"N3 and above\" lights N3, N2 and N1). The colour comes from the surrounding module theme, not a prop." } },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    accent: { control: 'select', options: [BRAND, ANIME_ACCENT], description: 'Set on the surrounding ModuleThemeProvider, not the chips' },
  },
  args: { size: 'sm', accent: BRAND },
}

function ChipStory({ mode, options, initial, caption, size, accent, thresholdDirection }) {
  const [value, setValue] = useState(initial)
  return (
    <ModuleThemeProvider accent={accent}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12, width: '100%' }}>
        <ChipSelector options={options} value={value} onChange={setValue} mode={mode} thresholdDirection={thresholdDirection} size={size} />
        <div style={{ fontSize: FS_SM, color: TEXT_MUTED, lineHeight: 1.5 }}>{caption}</div>
      </div>
    </ModuleThemeProvider>
  )
}

export const Multi = {
  render: args => <ChipStory {...args} mode="multi" options={MULTI_OPTIONS} initial={new Set(['anime'])} caption="Media-type filter — independent toggles." />,
}

export const Single = {
  render: args => <ChipStory {...args} mode="single" options={TAB_OPTIONS} initial="text" caption="Import tabs — exactly one active." />,
  args: { size: 'md' },
}

export const Threshold = {
  render: args => <ChipStory {...args} mode="threshold" thresholdDirection="forward" options={JLPT_OPTIONS} initial="N3" caption="Minimum JLPT level — picking N3 means N3 and above, so N2 and N1 light up too." />,
}

export const ThresholdBackward = {
  render: args => <ChipStory {...args} mode="threshold" thresholdDirection="backward" options={JLPT_OPTIONS} initial="N3" caption={'Same row, filling the other way — for options ordered so that "and above" runs toward the start of the list.'} />,
}

export const InAnotherModule = { ...Multi, args: { accent: ANIME_ACCENT } }

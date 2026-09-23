import { useState } from 'react'
import FilterCard, { FilterRow } from './FilterCard.jsx'
import ChipSelector from './Chip.jsx'
import Select from './Select.jsx'

const JLPT_OPTIONS = ['N5', 'N4', 'N3', 'N2', 'N1'].map(v => ({ value: v, label: v }))
const FILTER_OPTIONS = [
  { value: 'hide-known', label: 'Hide known' },
  { value: 'common', label: 'Common only' },
]
const FORMAT_OPTIONS = [
  { value: 'story', label: 'Story' },
  { value: 'news', label: 'News article' },
  { value: 'dialogue', label: 'Dialogue' },
]

export default {
  title: 'Layout/Filter Card',
  component: FilterCard,
  subcomponents: { FilterRow },
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "Groups the controls that narrow down or configure what a screen shows, one labelled row per control.\n\n**Use when** several filters or options sit above a list, or above a button that uses them (Story's generator form).\n\n**Don't use** for a single control — place it directly — or for settings changed while a drill is running (Settings Sidebar).\n\n*Build note:* one `FilterRow` per control; a Select inside uses `variant=\"inline\"`." } },
  },
}

function EpisodeFilters() {
  const [levels, setLevels] = useState(() => new Set(['N4', 'N3']))
  const [filters, setFilters] = useState(() => new Set(['hide-known']))
  const [format, setFormat] = useState('story')
  return (
    <div style={{ width: 520 }}>
      <FilterCard>
        <FilterRow label="JLPT level">
          <ChipSelector mode="multi" options={JLPT_OPTIONS} value={levels} onChange={setLevels} />
        </FilterRow>
        <FilterRow label="Filter">
          <ChipSelector mode="multi" options={FILTER_OPTIONS} value={filters} onChange={setFilters} />
        </FilterRow>
        <FilterRow label="Format">
          <Select variant="inline" value={format} onChange={setFormat} options={FORMAT_OPTIONS} />
        </FilterRow>
      </FilterCard>
    </div>
  )
}

export const ChipsAndInlineSelect = { render: () => <EpisodeFilters /> }

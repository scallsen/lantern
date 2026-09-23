import { useState } from 'react'
import DataList from './DataList.jsx'
import Badge from './Badge.jsx'
import Button from './Button.jsx'
import { BRAND, KANJI_FONT, TEXT_MUTED, FS_CAPTION, SPACE_8 } from '../data/theme.js'

const WORD_COLUMNS = [
  { key: 'kanji', width: 90, fontFamily: KANJI_FONT, lang: 'ja', render: r => r.kanji },
  { key: 'reading', width: 72, tone: 'muted', fontFamily: KANJI_FONT, lang: 'ja', render: r => r.reading },
  { key: 'gloss', flex: '1 1 0', tone: 'muted', render: r => r.gloss },
  { key: 'jlpt', width: 40, render: r => r.jlpt && <Badge tone="accent">{r.jlpt}</Badge> },
  { key: 'status', width: 90, render: r => r.status && <Badge tone={r.statusTone}>{r.status}</Badge> },
]

const WORD_SEED = [
  { id: 'w1', kanji: '世界', reading: 'せかい', gloss: 'world', jlpt: 'N4', status: 'Learning', statusTone: 'warning' },
  { id: 'w2', kanji: '先生', reading: 'せんせい', gloss: 'teacher', jlpt: 'N5', status: 'Mature', statusTone: 'success' },
  { id: 'w3', kanji: '刺激', reading: 'しげき', gloss: 'stimulus', jlpt: '~N3', status: 'Relearning', statusTone: 'danger' },
  { id: 'w4', kanji: '部屋', reading: 'へや', gloss: 'room', jlpt: null, status: null },
]

export default {
  title: 'Selection/Data List',
  component: DataList,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "Rows of records — words, cards, decks, episodes — that can be selected, searched, expanded or clicked through.\n\n**Use when** people scan, compare or pick from many similar items.\n\n**Don't use** for items meant to be opened and read, like articles (Feed Card), or for one grouped block of content (Card).\n\n*Build note:* selection, search, expansion, row click and footer are independent options. Use `navigate.href` for a real link to another page and `onClick` for an in-page action; mark a Japanese-only column with `lang: 'ja'`." } },
  },
  argTypes: {
    rowClick: { control: 'select', options: ['none', 'navigate', 'expand'] },
  },
  args: { selectable: true, rowClick: 'none', showSearch: false, showFooter: true, editable: false },
}

function toggleIn(setFn) {
  return id => setFn(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
}

function DataListStory({ selectable, rowClick, showSearch, showFooter, editable }) {
  const [rows, setRows] = useState(WORD_SEED)
  const [selected, setSelected] = useState(new Set())
  const [expanded, setExpanded] = useState(new Set())
  const [query, setQuery] = useState('')
  const [navLog, setNavLog] = useState(null)

  const displayed = query.trim()
    ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(query.trim().toLowerCase()))
    : rows

  return (
    <div style={{ width: '100%' }}>
      <DataList
        columns={WORD_COLUMNS}
        rows={displayed}
        maxWidth={480}
        selection={selectable ? { selected, onToggle: toggleIn(setSelected), bulkHeader: true } : undefined}
        navigate={rowClick === 'navigate' ? { onClick: row => setNavLog(`Would open "${row.kanji}"`) } : undefined}
        expand={rowClick === 'expand' ? {
          expanded, onToggle: toggleIn(setExpanded),
          render: row => <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED }}>Kanji breakdown for {row.kanji} would render here.</div>,
        } : undefined}
        editableFields={editable ? ['kanji', 'reading', 'gloss'] : undefined}
        onFieldChange={(row, key, value) => setRows(prev => prev.map(r => (r.id === row.id ? { ...r, [key]: value } : r)))}
        search={showSearch ? { value: query, onChange: setQuery, placeholder: 'Search rows' } : undefined}
        footer={showFooter ? <Button variant="primary" size="lg" disabled={selectable && selected.size === 0}>{selectable ? `Start Drill (${selected.size})` : 'Continue'}</Button> : undefined}
      />
      {navLog && <div style={{ marginTop: SPACE_8, fontSize: FS_CAPTION, color: BRAND }}>{navLog}</div>}
    </div>
  )
}

export const Playground = { render: args => <DataListStory {...args} /> }

export const ReadOnly = { ...Playground, args: { selectable: false, showFooter: false } }

export const SelectAndNavigate = { ...Playground, args: { rowClick: 'navigate' } }

export const Expandable = { ...Playground, args: { selectable: false, rowClick: 'expand', showFooter: false } }

export const WithSearch = { ...Playground, args: { showSearch: true } }

export const Editable = { ...Playground, args: { selectable: false, editable: true, showFooter: false } }

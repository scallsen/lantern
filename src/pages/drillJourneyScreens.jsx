import { useMemo, useState } from 'react'
import { fn } from 'storybook/test'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import Card from '../components/Card.jsx'
import DataList from '../components/DataList.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import DeckComboBox from '../components/DeckComboBox.jsx'
import DrillHUD from '../components/DrillHUD.jsx'
import Select from '../components/Select.jsx'
import Japanese from '../components/Japanese.jsx'
import { PrimaryCard, TextbookCover, SegmentedPrimary, ActionsRow } from './homeCards.jsx'
import {
  FONT, TEXT, TEXT_MUTED, BRAND, BRAND_TEXT, BRAND_TINT, KANJI_FONT, SUCCESS, WARNING,
  FS_BASE, FS_BADGE, FS_CAPTION, FS_ENTRY_WORD, FS_STAT_VALUE, FS_DISPLAY_HEADING, FS_CONTENT_HEADING,
  SPACE_4, SPACE_8, SPACE_12, SPACE_16, SPACE_24, SPACE_32,
} from '../data/theme.js'
import {
  TEXTBOOK, CHAPTER, NEXT_CHAPTER, CHAPTERS_DONE_BEFORE, WORDS, SESSION, ROUNDS, LAST_RUN_PCT, LAST_RUN,
  CHRONIC, PAST_SESSIONS, DECKS, READINESS_TARGET_PCT, FSRS_EASY_FIRST_INTERVAL_DAYS,
} from './drillJourneyFixtures.js'

const HAIRLINE = 'rgba(255,255,255,0.08)'
const MISS_TONE = n => (n >= 2 ? 'danger' : n === 1 ? 'warning' : 'success')

// ── Shared pieces ────────────────────────────────────────────────────────────

function WordCell({ word }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
      <Japanese style={{ fontSize: FS_ENTRY_WORD, color: TEXT, fontFamily: KANJI_FONT, letterSpacing: 0, lineHeight: 1.2 }}>{word.kanji}</Japanese>
      <Japanese style={{ fontSize: FS_BADGE, color: TEXT_MUTED, fontFamily: KANJI_FONT, letterSpacing: 0, lineHeight: 1.2 }}>{word.kana}</Japanese>
    </span>
  )
}

function wordColumns(countKey = 'misses', suffix = '×') {
  return [
    { key: 'word', width: 100, render: row => <WordCell word={row} /> },
    { key: 'gloss', tone: 'muted', wrap: true, render: row => row.english },
    {
      key: 'count', width: 44, align: 'right',
      render: row => row[countKey] > 0 ? <Badge variant="text" tone={MISS_TONE(row[countKey])}>{row[countKey]}{suffix}</Badge> : null,
    },
  ]
}

function WordList({ rows, countKey, suffix, selection }) {
  const columns = useMemo(() => wordColumns(countKey, suffix), [countKey, suffix])
  return <DataList columns={columns} rows={rows} selection={selection} maxWidth="100%" />
}

function Stat({ label, value, tone, note }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ color: tone ?? 'rgba(255,255,255,0.4)', fontSize: FS_CAPTION, marginBottom: SPACE_4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: tone ?? TEXT, fontSize: FS_STAT_VALUE }}>{value}</div>
      {note && <div style={{ color: TEXT_MUTED, fontSize: FS_BADGE, marginTop: SPACE_4 }}>{note}</div>}
    </div>
  )
}

function Screen({ children, align = 'center' }) {
  return (
    <div style={{ fontFamily: FONT, textAlign: align, padding: `${SPACE_32}px ${SPACE_16}px`, display: 'flex', flexDirection: 'column', gap: SPACE_16 }}>
      {children}
    </div>
  )
}

function Row({ children, justify = 'center' }) {
  return <div style={{ display: 'flex', gap: SPACE_8, justifyContent: justify, flexWrap: 'wrap' }}>{children}</div>
}

function Note({ children, tone = TEXT_MUTED }) {
  return <div style={{ fontSize: FS_BASE, color: tone, lineHeight: 1.45 }}>{children}</div>
}

function ProgressBar({ value, color = BRAND }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: HAIRLINE, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.round(value * 100)}%`, background: color }} />
    </div>
  )
}

const cover = <TextbookCover icon={TEXTBOOK.icon} accent={BRAND} onChangeTextbook={fn()} />
const chapterCount = TEXTBOOK.chapters.length

// ── Stage 1 · Choosing what to drill (home card) ─────────────────────────────

export function StartToday() {
  return (
    <PrimaryCard
      accent={BRAND}
      title={TEXTBOOK.title}
      subtitle={`${CHAPTERS_DONE_BEFORE + 1} of ${chapterCount} chapters`}
      cover={cover}
      actions={(
        <ActionsRow>
          <SegmentedPrimary label={`Redo ${CHAPTER.label}`} onClick={fn()} menuItems={[{ id: 'next', label: 'Next chapter', onClick: fn() }]} />
          <Button variant="quiet" size="lg">View all</Button>
        </ActionsRow>
      )}
    />
  )
}

export function StartExplicit() {
  return (
    <PrimaryCard
      accent={BRAND}
      title={TEXTBOOK.title}
      subtitle={`${CHAPTERS_DONE_BEFORE + 1} of ${chapterCount} chapters`}
      cover={cover}
      actions={(
        <ActionsRow>
          <SegmentedPrimary label={`Start ${NEXT_CHAPTER.label}`} onClick={fn()} menuItems={[{ id: 'redo', label: `Redo ${CHAPTER.label}`, onClick: fn() }]} />
          <Button variant="quiet" size="lg">View all</Button>
        </ActionsRow>
      )}
    >
      <Note>{CHAPTER.label} cleared · {SESSION.total} words in Reviews</Note>
    </PrimaryCard>
  )
}

export function StartReadiness({ pct = SESSION.firstTryPct }) {
  const ready = pct >= READINESS_TARGET_PCT
  return (
    <PrimaryCard
      accent={BRAND}
      title={TEXTBOOK.title}
      subtitle={`${CHAPTERS_DONE_BEFORE + 1} of ${chapterCount} chapters`}
      cover={cover}
      actions={(
        <ActionsRow>
          {ready
            ? <SegmentedPrimary label={`Start ${NEXT_CHAPTER.label}`} onClick={fn()} menuItems={[{ id: 'redo', label: `Drill ${CHAPTER.label} again`, onClick: fn() }]} />
            : <SegmentedPrimary label={`Drill ${CHAPTER.label} again`} onClick={fn()} menuItems={[{ id: 'next', label: `Start ${NEXT_CHAPTER.label} anyway`, onClick: fn() }]} />}
          <Button variant="quiet" size="lg">View all</Button>
        </ActionsRow>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: FS_BASE }}>
          <span style={{ color: TEXT }}>{CHAPTER.label} · {pct}% first try</span>
          <span style={{ color: ready ? SUCCESS : TEXT_MUTED }}>{ready ? 'Ready to move on' : `Aim for ${READINESS_TARGET_PCT}%`}</span>
        </div>
        <TargetBar pct={pct} />
      </div>
    </PrimaryCard>
  )
}

function TargetBar({ pct }) {
  const ready = pct >= READINESS_TARGET_PCT
  return (
    <div style={{ position: 'relative', height: 6, borderRadius: 3, background: HAIRLINE }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: ready ? SUCCESS : BRAND }} />
      <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${READINESS_TARGET_PCT}%`, width: 2, background: TEXT_MUTED }} />
    </div>
  )
}

// ── Stage 2 · End of a round with words left ─────────────────────────────────

const round1Rows = Object.entries(ROUNDS[0].misses)
  .sort((a, b) => b[1] - a[1])
  .map(([id, misses]) => ({ ...WORDS.find(w => w.id === id), misses }))
const round1Left = round1Rows.length
const round1Clean = ROUNDS[0].size - round1Left

function TodayDoneScreen({ correct, troubled, rows, preselected }) {
  const [selected, setSelected] = useState(() => new Set(preselected))
  const toggle = id => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  return (
    <Screen>
      <div style={{ color: '#fff', fontSize: FS_DISPLAY_HEADING }}>Session complete</div>
      <Row>
        <Stat label="Correct" value={correct} />
        <Stat label="Troubled" value={troubled} tone={troubled > 0 ? WARNING : undefined} />
      </Row>
      <Row>
        {troubled > 0 && <Button variant="warning-outline" size="lg">Redo Troubled ({troubled})</Button>}
        <Button variant="neutral" size="lg">Restart</Button>
        <Button variant="neutral" size="lg">End review</Button>
      </Row>
      <div style={{ textAlign: 'left', marginTop: SPACE_16 }}>
        <SectionHeader
          title="Review words"
          action={<DeckComboBox decks={DECKS} disabled={selected.size === 0} buttonLabel={`Add ${selected.size} to review deck`} onAdd={fn()} onCreateAndAdd={fn()} />}
        />
        <WordList rows={rows} selection={{ selected, onToggle: toggle, bulkHeader: { selectFirst: true } }} />
      </div>
    </Screen>
  )
}

export function RoundToday() {
  const rows = [...round1Rows, ...WORDS.filter(w => !ROUNDS[0].misses[w.id]).map(w => ({ ...w, misses: 0 }))]
  return <TodayDoneScreen correct={round1Clean} troubled={round1Left} rows={rows} preselected={round1Rows.map(r => r.id)} />
}

export function RoundCheckpoint() {
  return (
    <Screen>
      <div>
        <div style={{ color: TEXT_MUTED, fontSize: FS_BASE, textTransform: 'uppercase' }}>Round 1 done</div>
        <div style={{ color: '#fff', fontSize: FS_DISPLAY_HEADING, marginTop: SPACE_8 }}>{round1Left} to go</div>
      </div>
      <ProgressBar value={round1Clean / ROUNDS[0].size} color={SUCCESS} />
      <Note>{round1Clean} of {ROUNDS[0].size} right first time. These come back until you get each one right.</Note>
      <div style={{ textAlign: 'left' }}>
        <WordList rows={round1Rows} />
      </div>
      <Row>
        <Button size="xl">Drill the {round1Left} again</Button>
      </Row>
      <Row><Button variant="ghost-muted" size="sm">Stop for now</Button></Row>
    </Screen>
  )
}

export function RoundAuto() {
  return (
    <div style={{ padding: `${SPACE_24}px ${SPACE_12}px`, display: 'flex', justifyContent: 'center' }}>
      <DrillHUD streak={0} bestStreak={9} correct={round1Clean} troubled={round1Left} remaining={round1Left} canUndo={false} onUndo={fn()} showStreak={false}>
        <Card padding={SPACE_24} style={{ width: 'min(380px, calc(100vw - 32px))', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
          <div style={{ color: TEXT, fontSize: FS_CONTENT_HEADING }}>Round 1 done</div>
          <Note>{round1Left} words coming back · next round in 3…</Note>
          <Row><Button variant="neutral" size="sm">Pause</Button></Row>
        </Card>
      </DrillHUD>
    </div>
  )
}

// ── Stage 3 · Lesson cleared ─────────────────────────────────────────────────

export function ClearedToday() {
  const rows = WORDS.map(w => ({ ...w, misses: SESSION.lastRoundOnly.mistakeCounts[w.id] ?? 0 }))
  return <TodayDoneScreen correct={SESSION.lastRoundOnly.correct} troubled={SESSION.lastRoundOnly.troubled} rows={rows} preselected={[]} />
}

function RoundTrail() {
  const sizes = [...ROUNDS.map(r => r.size), 0]
  return (
    <Row>
      {sizes.map((n, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE_8, fontSize: FS_BASE, color: n === 0 ? SUCCESS : TEXT_MUTED }}>
          {i > 0 && <span style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>}
          {n === 0 ? 'cleared' : `${n} words`}
        </span>
      ))}
    </Row>
  )
}

export function ClearedReport() {
  const delta = SESSION.firstTryPct - LAST_RUN_PCT
  return (
    <Screen>
      <div>
        <div style={{ color: BRAND_TEXT, fontSize: FS_BASE, textTransform: 'uppercase' }}>{TEXTBOOK.title}</div>
        <div style={{ color: '#fff', fontSize: FS_DISPLAY_HEADING, marginTop: SPACE_8 }}>{CHAPTER.label} cleared</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: SPACE_12 }}>
        <Stat label="First try" value={`${SESSION.firstTryPct}%`} note={`${delta >= 0 ? '+' : ''}${delta} vs ${LAST_RUN.whenLabel}`} />
        <Stat label="Rounds" value={SESSION.rounds} />
        <Stat label="Best streak" value={SESSION.bestStreak} />
      </div>
      <RoundTrail />
      <div style={{ textAlign: 'left' }}>
        <SectionHeader title={`You struggled with ${SESSION.struggled.length}`} />
        <WordList rows={SESSION.struggled} />
      </div>
    </Screen>
  )
}

export function ClearedMoment() {
  return (
    <Screen>
      <div style={{ margin: '0 auto', width: 96, height: 96, borderRadius: '50%', background: BRAND_TINT, border: `2px solid ${BRAND}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND_TEXT, fontSize: FS_DISPLAY_HEADING }}>
        {SESSION.total}
      </div>
      <div style={{ color: '#fff', fontSize: FS_DISPLAY_HEADING }}>All {SESSION.total} words cleared</div>
      <Note>{SESSION.firstTry} right first time. The rest took a few goes:</Note>
      <Row>
        {SESSION.struggled.map(w => (
          <span key={w.id} style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE_4, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: `1px solid ${HAIRLINE}` }}>
            <Japanese style={{ fontFamily: KANJI_FONT, letterSpacing: 0, color: TEXT, fontSize: FS_BASE }}>{w.kanji}</Japanese>
            <Badge variant="text" tone={MISS_TONE(w.misses)}>{w.misses}×</Badge>
          </span>
        ))}
      </Row>
    </Screen>
  )
}

// ── Stage 4 · Sending to Reviews ─────────────────────────────────────────────

function useSelection(initial) {
  const [selected, setSelected] = useState(() => new Set(initial))
  const onToggle = id => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  return { selected, onToggle, bulkHeader: { selectFirst: true } }
}

function allWordsByMisses() {
  return WORDS
    .map(w => ({ ...w, misses: SESSION.cumulative[w.id] ?? 0 }))
    .sort((a, b) => b.misses - a.misses)
}

export function SendToday() {
  const selection = useSelection([])
  const rows = WORDS.map(w => ({ ...w, misses: 0 }))
  return (
    <Screen align="left">
      <SectionHeader
        title="Review words"
        action={<DeckComboBox decks={DECKS} disabled={selection.selected.size === 0} buttonLabel={`Add ${selection.selected.size} to review deck`} onAdd={fn()} onCreateAndAdd={fn()} />}
      />
      <WordList rows={rows} selection={selection} />
    </Screen>
  )
}

export function SendPick() {
  const selection = useSelection(SESSION.struggled.map(w => w.id))
  return (
    <Screen align="left">
      <SectionHeader
        title="Add to Reviews"
        action={<DeckComboBox decks={DECKS} lastUsedDeckId="textbook-genki-1" disabled={selection.selected.size === 0} buttonLabel={`Add ${selection.selected.size} to ${TEXTBOOK.title}`} onAdd={fn()} onCreateAndAdd={fn()} />}
      />
      <Note>Words you missed at any point this session are ticked.</Note>
      <WordList rows={allWordsByMisses()} selection={selection} />
    </Screen>
  )
}

export function SendChapter() {
  return (
    <Screen align="left">
      <Card padding={SPACE_16} style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
        <div style={{ color: TEXT, fontSize: FS_CONTENT_HEADING }}>Keep {CHAPTER.label} for good</div>
        <Note>Adds all {SESSION.total} words to your {TEXTBOOK.title} review deck, so they come back before you forget them.</Note>
        <Button size="lg" fullWidth>Add {SESSION.total} words to Reviews</Button>
      </Card>
      <SectionHeader title="In this lesson" />
      <WordList rows={allWordsByMisses()} />
    </Screen>
  )
}

function Bucket({ count, title, when, tone, words }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr)', gap: SPACE_12, alignItems: 'start', padding: `${SPACE_12}px 0`, borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ fontSize: FS_STAT_VALUE, color: tone }}>{count}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: TEXT, fontSize: FS_BASE }}>{title}</div>
        <div style={{ color: TEXT_MUTED, fontSize: FS_BASE, marginTop: 2 }}>{when}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE_8, marginTop: SPACE_8 }}>
          {words.map(w => <Japanese key={w.id} style={{ fontFamily: KANJI_FONT, letterSpacing: 0, color: TEXT, fontSize: FS_BASE }}>{w.kanji}</Japanese>)}
        </div>
      </div>
    </div>
  )
}

export function SendHeadStart() {
  const clean = WORDS.filter(w => !SESSION.cumulative[w.id])
  return (
    <Screen align="left">
      <Card padding={SPACE_16} style={{ display: 'flex', flexDirection: 'column', gap: SPACE_4 }}>
        <div style={{ color: TEXT, fontSize: FS_CONTENT_HEADING, marginBottom: SPACE_8 }}>Add {CHAPTER.label} to Reviews</div>
        <Bucket
          count={clean.length}
          tone={SUCCESS}
          title="Right first time — head start"
          when={`Counted as reviewed today. First review in ${FSRS_EASY_FIRST_INTERVAL_DAYS} days.`}
          words={clean}
        />
        <Bucket
          count={SESSION.struggled.length}
          tone={WARNING}
          title="You struggled with these"
          when="Start as new cards — up first in your next review."
          words={SESSION.struggled}
        />
        <div style={{ marginTop: SPACE_12 }}><Button size="lg" fullWidth>Add {SESSION.total} words to Reviews</Button></div>
      </Card>
    </Screen>
  )
}

const HISTORY_OPTIONS = [
  { value: 'session', label: 'This session' },
  { value: 'history', label: `Last ${PAST_SESSIONS.length + 1} sessions` },
]

const CLEAN_BUT_CHRONIC = CHRONIC.find(w => !SESSION.cumulative[w.id])

export function SendHistory() {
  const [scope, setScope] = useState('history')
  return <SendHistoryList key={scope} scope={scope} onScope={setScope} />
}

function SendHistoryList({ scope, onScope }) {
  const rows = scope === 'history'
    ? [...CHRONIC, ...WORDS.filter(w => !CHRONIC.some(c => c.id === w.id)).map(w => ({ ...w, runsMissed: 0 }))]
    : allWordsByMisses()
  const initial = scope === 'history' ? CHRONIC.map(w => w.id) : SESSION.struggled.map(w => w.id)
  const selection = useSelection(initial)
  return (
    <Screen align="left">
      <SectionHeader
        title="Your hardest words"
        action={<DeckComboBox decks={DECKS} lastUsedDeckId="textbook-genki-1" disabled={selection.selected.size === 0} buttonLabel={`Add ${selection.selected.size} to ${TEXTBOOK.title}`} onAdd={fn()} onCreateAndAdd={fn()} />}
      />
      <div style={{ width: 200 }}>
        <Select value={scope} onChange={onScope} options={HISTORY_OPTIONS} />
      </div>
      <Note>
        {scope === 'history'
          ? `Missed in at least 2 of your last ${PAST_SESSIONS.length + 1} runs of this lesson. `
          : 'Missed at least once this session. '}
        {scope === 'history' && CLEAN_BUT_CHRONIC && (
          <>
            <Japanese style={{ fontFamily: KANJI_FONT, letterSpacing: 0 }}>{CLEAN_BUT_CHRONIC.kanji}</Japanese> was clean today but missed in both earlier runs.
          </>
        )}
      </Note>
      <WordList rows={rows} countKey={scope === 'history' ? 'runsMissed' : 'misses'} suffix={scope === 'history' ? ' runs' : '×'} selection={selection} />
    </Screen>
  )
}

// ── Stage 5 · What next ──────────────────────────────────────────────────────

export function NextToday() {
  return (
    <Screen align="left">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACE_12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: FS_CONTENT_HEADING, color: TEXT }}>{TEXTBOOK.title}</div>
          <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, marginTop: SPACE_4 }}>{CHAPTERS_DONE_BEFORE + 1} of {chapterCount} chapters</div>
        </div>
        <SegmentedPrimary label={`Redo ${CHAPTER.label}`} onClick={fn()} menuItems={[{ id: 'next', label: 'Next chapter', onClick: fn() }]} />
      </div>
      <Note>After End review you land on the chapter list. The next lesson is in the dropdown.</Note>
    </Screen>
  )
}

function Added() {
  return <Note tone={SUCCESS}>✓ {SESSION.total} words added to {TEXTBOOK.title}</Note>
}

export function NextButton() {
  return (
    <Screen>
      <Added />
      <Row><Button size="xl">Start {NEXT_CHAPTER.label}</Button></Row>
      <Row>
        <Button variant="neutral" size="lg">Drill {CHAPTER.label} again</Button>
        <Button variant="ghost-muted" size="lg">Home</Button>
      </Row>
    </Screen>
  )
}

export function NextReadiness({ pct = SESSION.firstTryPct }) {
  const ready = pct >= READINESS_TARGET_PCT
  return (
    <Screen>
      <Added />
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: SPACE_8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: FS_BASE }}>
          <span style={{ color: TEXT }}>{pct}% first try</span>
          <span style={{ color: ready ? SUCCESS : TEXT_MUTED }}>{ready ? 'Ready for the next lesson' : `Aim for ${READINESS_TARGET_PCT}% before moving on`}</span>
        </div>
        <TargetBar pct={pct} />
      </div>
      {ready ? (
        <>
          <Row><Button size="xl">Start {NEXT_CHAPTER.label}</Button></Row>
          <Row><Button variant="neutral" size="lg">Drill {CHAPTER.label} again</Button></Row>
        </>
      ) : (
        <>
          <Row><Button size="xl">Drill {CHAPTER.label} again</Button></Row>
          <Row><Button variant="neutral" size="lg">Start {NEXT_CHAPTER.label} anyway</Button></Row>
        </>
      )}
    </Screen>
  )
}

export function NextFocus() {
  return (
    <Screen>
      <Added />
      <Row><Button size="xl">Start {NEXT_CHAPTER.label}</Button></Row>
      <Card padding={SPACE_16} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE_12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: TEXT, fontSize: FS_BASE }}>Quick focus round</div>
          <Note>Just the {SESSION.struggled.length} you struggled with, about a minute.</Note>
        </div>
        <Button variant="warning-outline">Drill {SESSION.struggled.length}</Button>
      </Card>
      <Row><Button variant="ghost-muted" size="lg">Home</Button></Row>
    </Screen>
  )
}

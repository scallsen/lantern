import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fn } from 'storybook/test'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import Card from '../components/Card.jsx'
import DataList from '../components/DataList.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import DeckComboBox from '../components/DeckComboBox.jsx'
import DrillHUD from '../components/DrillHUD.jsx'
import Popover from '../components/Popover.jsx'
import Menu from '../components/Menu.jsx'
import Japanese from '../components/Japanese.jsx'
import ActionBar from '../components/ActionBar.jsx'
import { PrimaryCard, TextbookCover, SegmentedPrimary, ActionsRow } from './homeCards.jsx'
import {
  FONT, TRACKING, TEXT, TEXT_MUTED, BRAND, KANJI_FONT, SUCCESS, WARNING,
  FS_BASE, FS_BADGE, FS_CAPTION, FS_ENTRY_WORD, FS_STAT_VALUE, FS_DISPLAY_HEADING, FS_CONTENT_HEADING,
  SPACE_4, SPACE_8, SPACE_12, SPACE_16, SPACE_24, SPACE_32,
} from '../data/theme.js'
import {
  TEXTBOOK, CHAPTER, NEXT_CHAPTER, CHAPTERS_DONE_BEFORE, WORDS, SESSION, ROUNDS,
  PREVIOUS_RUNS, READINESS_TARGET_PCT,
} from './drillJourneyFixtures.js'

const HAIRLINE = 'rgba(255,255,255,0.08)'
// The rest of the lesson in every score bar: a visible grey, not the faint
// hairline track, since it stands for real words, not empty space.
const REST_GREY = '#4A4A4A'
const SCORE_COLORS = { correct: BRAND, rest: REST_GREY }
// Previous runs are context for today's bar, so they carry the same
// encoding, dimmed, rather than a second hue: ACCENT_SECONDARY's ramp
// already means SRS card stages, and borrowing it would read as a
// different kind of data.
const HISTORY_COLORS = { correct: '#7A1F3A', rest: '#333333' }
const MISS_TONE = n => (n >= 2 ? 'danger' : n === 1 ? 'warning' : 'success')

const DECKS = {
  'textbook-genki-1': { id: 'textbook-genki-1', name: 'Genki 1', active: true, source: 'imported', addedAt: 0 },
  'immersion-words': { id: 'immersion-words', name: 'Immersion Words', active: true, source: 'imported', addedAt: 0 },
}

// ── Shared pieces ────────────────────────────────────────────────────────────

function WordCell({ word }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
      <Japanese style={{ fontSize: FS_ENTRY_WORD, color: TEXT, fontFamily: KANJI_FONT, letterSpacing: 0, lineHeight: 1.2 }}>{word.kanji}</Japanese>
      <Japanese style={{ fontSize: FS_BADGE, color: TEXT_MUTED, fontFamily: KANJI_FONT, letterSpacing: 0, lineHeight: 1.2 }}>{word.kana}</Japanese>
    </span>
  )
}

const WORD_COLUMNS = [
  { key: 'word', width: 100, render: row => <WordCell word={row} /> },
  { key: 'gloss', tone: 'muted', wrap: true, render: row => row.english },
  {
    key: 'count', width: 44, align: 'right',
    render: row => row.misses > 0 ? <Badge variant="text" tone={MISS_TONE(row.misses)}>{row.misses}×</Badge> : null,
  },
]

function WordList({ rows, selection }) {
  return <DataList columns={WORD_COLUMNS} rows={rows} selection={selection} maxWidth="100%" />
}

function Stat({ label, value, tone }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ color: tone ?? 'rgba(255,255,255,0.4)', fontSize: FS_CAPTION, marginBottom: SPACE_4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: tone ?? TEXT, fontSize: FS_STAT_VALUE }}>{value}</div>
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

// Right-first-time share of the lesson: red for the words answered right
// first time, grey for the rest. Two segments with the 2px surface gap
// between them rather than a fill over a track, since both halves are words.
function ScoreBar({ pct, height = 12, colors = SCORE_COLORS }) {
  const radius = height >= 10 ? 4 : 3
  return (
    <div style={{ display: 'flex', gap: pct > 0 && pct < 100 ? 2 : 0, height }}>
      {pct > 0 && <div style={{ flex: `${pct} 0 0`, background: colors.correct, borderRadius: pct < 100 ? `${radius}px 0 0 ${radius}px` : radius }} />}
      {pct < 100 && <div style={{ flex: `${100 - pct} 0 0`, background: colors.rest, borderRadius: pct > 0 ? `0 ${radius}px ${radius}px 0` : radius }} />}
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
    <Screen align="left">
      <div>
        <div style={{ color: TEXT, fontSize: FS_DISPLAY_HEADING }}>Round 1 done</div>
        <Note>{round1Left} words to go. They come back until you get each one right.</Note>
      </div>
      <ScoreBar pct={(round1Clean / ROUNDS[0].size) * 100} height={8} />
      <WordList rows={round1Rows} />
      <ActionBar>
        <Button variant="quiet" size="xl">Stop for now</Button>
        <Button size="xl">Drill the {round1Left} again</Button>
      </ActionBar>
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

// ── Stage 3 · End of the lesson ──────────────────────────────────────────────

export function EndToday() {
  const rows = WORDS.map(w => ({ ...w, misses: SESSION.lastRoundOnly.mistakeCounts[w.id] ?? 0 }))
  return <TodayDoneScreen correct={SESSION.lastRoundOnly.correct} troubled={SESSION.lastRoundOnly.troubled} rows={rows} preselected={[]} />
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Eases 0 → target once on mount. The bar width and the number both read
// this one value, so the count lands exactly as the bar stops.
function useFillIn(target, duration = 1200) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf
    let start
    const tick = now => {
      start ??= now
      const p = Math.min(1, (now - start) / duration)
      setValue(target * (1 - (1 - p) ** 3))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}


const pctOf = firstTry => Math.round((firstTry / SESSION.total) * 100)

function TargetTick() {
  return <div style={{ position: 'absolute', top: -4, bottom: -4, left: `${READINESS_TARGET_PCT}%`, width: 2, background: TEXT, opacity: 0.6 }} />
}

function LessonSummary({ firstTry, history }) {
  const pct = pctOf(firstTry)
  const value = useFillIn(pct)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_32, textAlign: 'left' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
        <div style={{ fontSize: FS_DISPLAY_HEADING, color: TEXT }}>Lesson cleared</div>
        <div style={{ fontSize: FS_DISPLAY_HEADING, lineHeight: 1, color: TEXT, fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}%</div>
        <div style={{ position: 'relative' }}>
          <ScoreBar pct={value} />
          <TargetTick />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACE_12, fontSize: FS_BASE, color: TEXT_MUTED }}>
          <span>{firstTry} of {SESSION.total} correct first time</span>
          <span>target {READINESS_TARGET_PCT}%</span>
        </div>
      </div>
      {/* Only this lesson's earlier runs, and none on a first run — the
          history is dropped when a different lesson is drilled. */}
      {history.length > 0 && (
        <div>
          <SectionHeader title="Previous sessions" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
            {history.map(run => (
              <div key={run.whenLabel} style={{ display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr) 44px', gap: SPACE_12, alignItems: 'center' }}>
                <span style={{ fontSize: FS_BASE, color: TEXT_MUTED }}>{run.whenLabel}</span>
                <ScoreBar pct={pctOf(run.firstTry)} height={6} colors={HISTORY_COLORS} />
                <span style={{ fontSize: FS_BASE, color: TEXT_MUTED, textAlign: 'right' }}>{pctOf(run.firstTry)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// SegmentedPrimary's split-button shape with a tone, since here the add
// action is only primary when the score has reached the target. Lab-local:
// if this direction is built, it's a `tone` prop on SegmentedPrimary (and
// probably a promotion out of homeCards.jsx into src/components/).
const SPLIT_TONES = {
  primary: { className: 'btn btn-tint btn-primary', background: BRAND, color: '#fff', border: 'none', divider: 'rgba(255,255,255,0.25)' },
  neutral: { className: 'btn btn-neutral', background: 'rgba(255,255,255,0.06)', color: TEXT, border: '1px solid rgba(255,255,255,0.15)', divider: 'rgba(255,255,255,0.15)' },
}
const SPLIT_HEIGHT = 10 * 2 + FS_BASE

function SplitButton({ tone, label, onClick, menuItems }) {
  const [open, setOpen] = useState(false)
  const chevronRef = useRef(null)
  const t = SPLIT_TONES[tone]
  const segment = {
    background: t.background, color: t.color, border: 'none', boxSizing: 'border-box', height: SPLIT_HEIGHT,
    fontFamily: FONT, letterSpacing: TRACKING, lineHeight: 1, cursor: 'pointer',
  }
  return (
    <div style={{ display: 'flex', width: '100%', borderRadius: 6, overflow: 'hidden', border: t.border, boxSizing: 'border-box' }}>
      <button type="button" className={t.className} onClick={onClick} style={{ ...segment, flex: '1 1 auto', padding: `0 ${SPACE_16}px`, fontSize: FS_BASE, whiteSpace: 'nowrap' }}>
        {label}
      </button>
      <button
        ref={chevronRef}
        type="button"
        className={t.className}
        onClick={() => setOpen(o => !o)}
        aria-label="More ways to add"
        style={{ ...segment, flexShrink: 0, width: SPLIT_HEIGHT, padding: 0, borderLeft: `1px solid ${t.divider}`, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ display: 'block', transform: 'translateY(-2px)' }}>▾</span>
      </button>
      {/* Portalled only because the lab's phone frame is transformed (to pin
          the Action Bar), which would make Popover's position: fixed
          relative to the frame and clip it. The app has no such ancestor. */}
      {createPortal(
        <Popover open={open} onClose={() => setOpen(false)} anchorRef={chevronRef} align="end" width={240} bodyPadding={0}>
          <Menu items={menuItems} onSelect={id => { setOpen(false); menuItems.find(i => i.id === id)?.onClick() }} />
        </Popover>,
        document.body,
      )}
    </div>
  )
}

const troubledCount = SESSION.struggled.length

// `priority: 'score'` puts the add action first once the target is reached
// and Drill again first below it; 'add' always leads with the add action.
function EndActions({ pct, priority }) {
  const [added, setAdded] = useState(null)
  const addFirst = priority === 'add' || pct >= READINESS_TARGET_PCT

  const add = added ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: SPLIT_HEIGHT, gap: SPACE_8 }}>
      <Note tone={SUCCESS}>✓ Added {added} to review</Note>
      <Button variant="ghost-muted" size="sm" onClick={() => setAdded(null)}>Undo</Button>
    </div>
  ) : (
    <SplitButton
      tone={addFirst ? 'primary' : 'neutral'}
      label={`Add all ${SESSION.total} to review`}
      onClick={() => setAdded(SESSION.total)}
      menuItems={[{ id: 'troubled', label: `Just add ${troubledCount} troubled to review`, onClick: () => setAdded(troubledCount) }]}
    />
  )
  const again = <Button variant={addFirst ? 'quiet' : 'primary'} size="lg" fullWidth>Drill again</Button>
  // Once the words are in, the add slot is only a confirmation, so the lead
  // passes to finishing — otherwise the screen would be left with no primary.
  const end = <Button variant={added && addFirst ? 'primary' : 'quiet'} size="lg" fullWidth>End drill</Button>

  // The leading action takes the full first row; the other two share the
  // second. Grouped through ActionBar's full-width `leading` slot, since
  // ActionBar only right-aligns its children.
  return (
    <ActionBar leading={addFirst ? (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE_8 }}>
        <div style={{ gridColumn: '1 / -1' }}>{add}</div>
        {again}
        {end}
      </div>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: SPACE_8 }}>
        <div style={{ gridColumn: '1 / -1' }}>{again}</div>
        {add}
        {end}
      </div>
    )} />
  )
}

export function EndLesson({ firstTry = SESSION.firstTry, priority = 'score', history = PREVIOUS_RUNS }) {
  return (
    <Screen align="left">
      <LessonSummary firstTry={firstTry} history={history} />
      <EndActions pct={pctOf(firstTry)} priority={priority} />
    </Screen>
  )
}

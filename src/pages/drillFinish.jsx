import { useState, useEffect, useMemo, useRef } from 'react'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import DataList from '../components/DataList.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ActionBar from '../components/ActionBar.jsx'
import ScoreBar from '../components/ScoreBar.jsx'
import Popover from '../components/Popover.jsx'
import OptionPicker from '../components/OptionPicker.jsx'
import { suggestedDeckItems } from '../components/deckPickerItems.js'
import { SegmentedPrimary } from './homeCards.jsx'
import { useDictionaryEntries, useSenseGlosses } from '../hooks/useDictionaryEntries.js'
import { cardGloss } from '../utils/dictionaryEntryLookup.js'
import { resolveWordDisplay } from '../utils/wordDisplay.js'
import { READINESS_TARGET_PCT, pctOf, timeAgo } from '../lib/drillScore.js'
import {
  FONT, TEXT, TEXT_MUTED, SUCCESS, WARNING, KANJI_FONT, LANTERN_ON, LANTERN_SIZES,
  FS_BASE, FS_BADGE, FS_ENTRY_WORD, FS_DISPLAY_HEADING, FS_CONTENT_HEADING,
  SPACE_8, SPACE_12, SPACE_16, SPACE_24, SPACE_32, CONTENT_STANDARD,
} from '../data/theme.js'

// The vocab drill's two finishing screens: the beat between rounds while
// missed words are still left, and the lesson's end once every word has been
// answered right. Explored as the "Drill Journey" Storybook lab (branch
// worktree-drill-journey-lab) before being built.

// ── Between rounds ───────────────────────────────────────────────────────────

const ROUND_HEADLINES = [
  'Some cards need to be drilled again',
  "You're almost there",
  'Just a few cards left',
]

// Matches .drill-round-countdown in global.css: a 400ms fade-in, then the
// 2.5s line. The next round starts when the line is full.
export const ROUND_BREAK_MS = 2900

// Not a review screen: missed words come back without their answers shown
// first, so this only says where the session is, then carries on by itself.
// Counts are for the whole session so far, not just the round that ended.
export function RoundBreak({ round, correct, troubled, onContinue, onEnd }) {
  useEffect(() => {
    const t = setTimeout(onContinue, ROUND_BREAK_MS)
    return () => clearTimeout(t)
  }, [onContinue])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACE_24, fontFamily: FONT, textAlign: 'center', padding: SPACE_16 }}>
      <div className="drill-round-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE_12 }}>
        {/* The loading state's lantern (CenteredLoadingMessage), same size and glow. */}
        <img className="lantern-pulse" src={LANTERN_ON} alt="" width={LANTERN_SIZES.nav} height={LANTERN_SIZES.nav} style={{ display: 'block', imageRendering: 'pixelated' }} />
        <div role="status" style={{ fontSize: FS_CONTENT_HEADING, color: TEXT }}>
          {ROUND_HEADLINES[Math.min(round, ROUND_HEADLINES.length) - 1]}
        </div>
        {/* DrillHUD's stat line, minus Remaining — the headline covers it. */}
        <div style={{ display: 'flex', gap: SPACE_8, fontSize: FS_BASE, alignItems: 'center' }}>
          <span style={{ color: correct > 0 ? SUCCESS : 'rgba(255,255,255,0.5)' }}>{correct} Correct</span>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
          <span style={{ color: troubled > 0 ? WARNING : 'rgba(255,255,255,0.5)' }}>{troubled} Troubled</span>
        </div>
      </div>
      <div style={{ width: 160, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div className="drill-round-countdown" style={{ height: '100%', background: TEXT_MUTED }} />
      </div>
      <Button variant="ghost-muted" size="sm" onClick={onEnd}>End drill</Button>
    </div>
  )
}

// ── End of the lesson ────────────────────────────────────────────────────────

const MISS_TONE = n => (n >= 2 ? 'danger' : 'warning')

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Eases 0 → target once on mount. The bar and the number both read this one
// value, so the count lands exactly as the bar stops.
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

// Reports the fixed Action Bar's rendered height (it's two rows here, not
// ACTION_BAR_HEIGHT's one), so the page can pad its scroller to clear it.
function useFixedChildHeight(onHeight) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current?.firstElementChild
    if (!el || !onHeight) return
    const ro = new ResizeObserver(() => onHeight(el.offsetHeight))
    ro.observe(el)
    return () => { ro.disconnect(); onHeight(0) }
  }, [onHeight])
  return ref
}

function useWordColumns(rows) {
  const jmdictIds = useMemo(() => rows.map(r => r.word.jmdictId).filter(Boolean), [rows])
  const { entries: dictEntries } = useDictionaryEntries(jmdictIds, true)
  const senseGlosses = useSenseGlosses(useMemo(() => rows.map(r => r.word), [rows]))
  return useMemo(() => [
    {
      key: 'word', width: 100, lang: 'ja',
      render: row => {
        const dictEntry = row.word.jmdictId ? dictEntries[row.word.jmdictId] : null
        const { displayForm, reading } = resolveWordDisplay(row.word, dictEntry)
        return (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', overflow: 'hidden' }}>
            <span style={{ fontSize: FS_ENTRY_WORD, color: TEXT, fontFamily: KANJI_FONT, letterSpacing: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayForm}
            </span>
            {reading && (
              <span style={{ fontSize: FS_BADGE, color: TEXT_MUTED, fontFamily: KANJI_FONT, letterSpacing: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {reading}
              </span>
            )}
          </span>
        )
      },
    },
    {
      key: 'gloss', tone: 'muted', wrap: true,
      render: row => {
        const dictEntry = row.word.jmdictId ? dictEntries[row.word.jmdictId] : null
        return (
          <span style={{ lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {row.word.english ?? cardGloss(row.word, dictEntry, senseGlosses)}
          </span>
        )
      },
    },
    {
      key: 'misses', width: 44, align: 'right',
      render: row => row.misses > 0 ? <Badge variant="text" tone={MISS_TONE(row.misses)}>{row.misses}×</Badge> : null,
    },
  ], [dictEntries, senseGlosses])
}

// `rows`: [{ id, word, misses }] for every word in the session, misses summed
// across all its rounds. `previousRuns`: this lesson's earlier first passes,
// newest first — empty on a first run, or when a different lesson was
// drilled in between. `onAddToReview(words, { deckId } | { newDeckName })`
// returns `{ count, cardIds, deckName }`.
//
// The score picks the lead action. At or above the readiness target, adding
// the words to review; below it, drilling again. Neither is hidden — the
// screen nudges, it doesn't block. Moving on to the next lesson is the home
// card's job, not this screen's.
//
// `practice`: the session was a subset of the lesson (its troubled words),
// not the whole of it. Nothing about it is saved, and a score on a handful
// of words says nothing about the lesson, so the screen drops the score and
// the target and leads with drilling the full lesson — the run that counts.
export function LessonCleared({
  rows, previousRuns = [], practice = false, isMobile, decks = {}, suggestedDeck,
  onAddToReview, onUndoAdd, onDrillAgain, onDrillTroubled, onEnd, onBarHeight,
}) {
  const total = rows.length
  const troubledRows = useMemo(() => rows.filter(r => r.misses > 0), [rows])
  const firstTry = total - troubledRows.length
  const pct = pctOf(firstTry, total)
  const value = useFillIn(pct)
  const columns = useWordColumns(rows)
  const [added, setAdded] = useState(null) // { count, cardIds, deckName }
  const [picking, setPicking] = useState(null) // the words waiting on a deck
  const addRef = useRef(null)
  const barRef = useFixedChildHeight(onBarHeight)

  const addFirst = !practice && pct >= READINESS_TARGET_PCT
  const missed = practice ? 'missed' : 'troubled'
  const partial = troubledRows.length > 0 && troubledRows.length < total
  const size = isMobile ? 'lg' : 'xl'
  const fullWidth = isMobile

  function add(target) {
    const result = onAddToReview(picking, target)
    setPicking(null)
    if (result) setAdded({ count: result.count, cardIds: result.cardIds, deckName: result.deckName })
  }

  function undo() {
    if (added?.cardIds?.length) onUndoAdd(added.cardIds)
    setAdded(null)
  }

  const confirmation = added && (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-start', gap: SPACE_8, minHeight: '100%', minWidth: 0 }}>
      <span style={{ fontSize: FS_BASE, color: SUCCESS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {added.count > 0 ? `✓ Added ${added.count} to ${added.deckName}` : `✓ Already in ${added.deckName}`}
      </span>
      {added.count > 0 && <Button variant="ghost-muted" size="sm" onClick={undo}>Undo</Button>}
    </div>
  )
  const addAction = added ? confirmation : (
    <div ref={addRef}>
      <SegmentedPrimary
        size={size}
        fullWidth={fullWidth}
        tone={addFirst ? 'primary' : 'neutral'}
        label={`Add all ${total} to review`}
        menuLabel="More ways to add to review"
        onClick={() => setPicking(rows.map(r => r.word))}
        menuItems={partial
          ? [{ id: 'troubled', label: `Just add ${troubledRows.length} ${missed} to review`, onClick: () => setPicking(troubledRows.map(r => r.word)) }]
          : []}
      />
    </div>
  )
  const againAction = (
    <SegmentedPrimary
      size={size}
      fullWidth={fullWidth}
      tone={addFirst ? 'quiet' : 'primary'}
      label={practice ? 'Drill full lesson' : 'Drill again'}
      menuLabel="More ways to drill again"
      onClick={onDrillAgain}
      menuItems={(practice ? troubledRows.length > 0 : partial)
        ? [{ id: 'troubled', label: `Drill ${troubledRows.length} ${missed} again`, onClick: () => onDrillTroubled(troubledRows.map(r => r.id)) }]
        : []}
    />
  )
  // Once the words are in, the add slot is only a confirmation, so the lead
  // passes to finishing — otherwise the screen would be left with no primary.
  const endIsPrimary = Boolean(added) && addFirst
  const endAction = <Button variant={endIsPrimary ? 'primary' : 'quiet'} size={size} fullWidth={fullWidth} onClick={onEnd}>End drill</Button>
  const [lead, other] = addFirst ? [addAction, againAction] : [againAction, addAction]

  const bar = isMobile ? (
    // The leading action takes the first row; the other two share the
    // second. Grouped through ActionBar's full-width `leading` slot, since
    // ActionBar only right-aligns its children.
    <ActionBar leading={(
      <div style={{ display: 'grid', gridTemplateColumns: addFirst ? '1fr 1fr' : 'minmax(0, 1fr) auto', gap: SPACE_8, alignItems: 'stretch' }}>
        <div style={{ gridColumn: '1 / -1' }}>{lead}</div>
        {other}
        {endAction}
      </div>
    )} />
  ) : (
    // One row, primary last. After adding, the confirmation moves to the
    // left-hand status slot. The screen is CONTENT_STANDARD wide (not the
    // narrow done-screen width) because three xl buttons don't fit on one row
    // any narrower, and the bar matches it so the buttons line up with the list.
    <ActionBar maxWidth={CONTENT_STANDARD} leading={confirmation || null}>
      {added
        ? (endIsPrimary ? <>{againAction}{endAction}</> : <>{endAction}{againAction}</>)
        : <>{endAction}{other}{lead}</>}
    </ActionBar>
  )

  return (
    <div style={{ width: '100%', maxWidth: CONTENT_STANDARD + SPACE_24 * 2, padding: `${SPACE_32 + SPACE_16}px ${SPACE_24}px`, fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: SPACE_32 }}>
      {practice ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
          <div style={{ fontSize: FS_DISPLAY_HEADING, color: TEXT }}>Troubled words cleared</div>
          <div style={{ fontSize: FS_BASE, color: TEXT_MUTED }}>
            {total} word{total === 1 ? '' : 's'} · {troubledRows.length > 0 ? `${troubledRows.length} missed again` : 'all right first time'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: SPACE_12, fontSize: FS_DISPLAY_HEADING, color: TEXT }}>
            <span>Lesson cleared</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}%</span>
          </div>
          <ScoreBar pct={value} target={READINESS_TARGET_PCT} caption={`${firstTry} of ${total} correct first time`} />
        </div>
      )}

      {!practice && previousRuns.length > 0 && (
        <div>
          <SectionHeader title="Previous sessions" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
            {previousRuns.map(run => {
              const runPct = pctOf(run.firstTry, run.total)
              return (
                <div key={run.at} style={{ display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr) 44px', gap: SPACE_12, alignItems: 'center' }}>
                  <span style={{ fontSize: FS_BASE, color: TEXT_MUTED }}>{timeAgo(run.at)}</span>
                  <ScoreBar pct={runPct} height={6} tone="history" />
                  <span style={{ fontSize: FS_BASE, color: TEXT_MUTED, textAlign: 'right' }}>{runPct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Words" />
        <DataList columns={columns} rows={rows} maxWidth="100%" />
      </div>

      <div ref={barRef}>{bar}</div>

      {/* DeckComboBox's picker, opened from the split button rather than its
          own trigger so the bar keeps a single add control. */}
      <Popover
        open={Boolean(picking)}
        onClose={() => setPicking(null)}
        anchorRef={addRef}
        isMobile={isMobile}
        align="end"
        title={`Add ${picking?.length ?? 0} to which deck?`}
      >
        <OptionPicker
          items={suggestedDeckItems(decks, suggestedDeck)}
          onSelect={deckId => add({ deckId })}
          onCreate={name => add({ newDeckName: name })}
          placeholder="Search or create a deck"
          emptyMessage="No decks yet"
        />
      </Popover>
    </div>
  )
}

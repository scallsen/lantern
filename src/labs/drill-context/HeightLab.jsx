import { useState, useRef, useLayoutEffect } from 'react'
import { FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND, FS_BASE, FS_CAPTION, DRILL_COLORS, DRILL_ROW_HEIGHT } from '../../data/theme.js'
import FlipCard from '../../FlipCard.jsx'
import Japanese from '../../components/Japanese.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import DrillHUD from '../../components/DrillHUD.jsx'
import SpeedModeControls from '../../components/SpeedModeControls.jsx'
import AttributionFooter from '../../components/AttributionFooter.jsx'
import ActionBar from '../../components/ActionBar.jsx'
import CardDetails from '../../components/CardDetails.jsx'
import CardWord from '../../components/CardWord.jsx'
import { DrillButton } from '../../components/DrillButton.jsx'
import DrillSettingsPanel from '../../components/DrillSettingsPanel.jsx'
import { DRILL_SETTINGS_DEFAULTS } from '../../hooks/useDrillSettings.js'
import { ATTRIBUTIONS } from '../../data/attributions.js'
import { renderAttributionSegments } from '../../utils/attributionSegments.jsx'
import { Frame, VerdictRow } from './parts.jsx'
import { Seg, Bullets } from './labChrome.jsx'
import { Section, Notes, Principle } from './ContextBandLab.jsx'
import { readFeedback, writeFeedback } from './labData.js'
import { WORDS, KNOWN_IDS, RELATED, useLabDrill } from './labDrill.js'
import './lab.css'

// Drill screen height: the card stays 380 × 280 (a shrinking card was tried
// and rejected), so what else can give when a short window can't hold the
// card, the details panel, the buttons, the counts and the credit line?
//
// Every frame is built from the real components at their real sizes — the
// page header, DrillHUD, SpeedModeControls, AttributionFooter, ActionBar and
// the shipped CardDetails — so the "fits / scrolls" badge on each frame is a
// measurement, not an estimate.

const FEEDBACK_KEY = 'lab:drill-context:height:feedback'
const P = { margin: 0, lineHeight: 1.6, fontSize: 15, maxWidth: 900 }
const JA_FONT = 'system-ui, sans-serif'
const CREDITS = ['dictionary', 'tanaka-corpus', 'voicevox']
const COUNTS = { correct: 7, troubled: 2, remaining: 17 }

const DESKTOP_SIZES = [[745, '1440 × 745 (your window)'], [680, '1280 × 680'], [900, '1440 × 900']]
const PHONE_SIZES = [[667, '375 × 667 (small phone)'], [844, '390 × 844']]

const CONCEPTS = [
  {
    id: 'today',
    name: 'Today',
    summary: 'What ships now, for reference: the card, the panel, the buttons, Undo and the counts, then the credit line, all in one centred column. At 745px tall it’s about 50px too tall, so the page scrolls on arrival.',
  },
  {
    id: 'credit',
    name: 'Credit line out of the drill',
    summary: 'The dictionary / Tanaka / Voicevox credit moves off the drill screen, into the settings drawer’s foot (where the Voicevox credit already sits) — it stays one tap away, the licences only ask for a discoverable credit. Saves the credit’s ~50px, which on its own is almost exactly the overflow at 745px.',
  },
  {
    id: 'header',
    name: 'Counts and Undo in the header',
    summary: 'Correct · Troubled · Remaining and Undo move up into the page header’s right-hand side, next to the account badge. The column under the card is only the buttons. Saves the Undo row and the counts line, ~90px, and puts the session’s state where a page’s state usually lives.',
  },
  {
    id: 'compact',
    name: 'Both: header counts, no credit line',
    summary: 'The two above together: ~140px back, the card and panel get real breathing room at 745px, and even a 680px laptop fits. The drill screen is then card, panel, buttons — nothing else.',
  },
  {
    id: 'side',
    name: 'Side by side (wide screens)',
    summary: 'On a wide-but-short window the panel moves beside the card instead of under it: card with its buttons on the left, sentence and kanji on the right. The height is just the card and its buttons, so it fits anything a laptop can be. A phone keeps the stacked layout (shown here as “Both”).',
  },
  {
    id: 'undoIcon',
    name: 'Undo as an icon in the button row',
    summary: 'Undo becomes a square icon button at the start of the verdict row — the same height as Incorrect and Correct, so the row stays one row. The Undo line under the buttons goes (~40px). The credit line stays at the foot of the page, but the stage no longer counts it: it sits just below the fold, a scroll away, which is what EDRDG’s licence asks of a website (see “The credit” above). Counts stay under the buttons. Before the flip the row is Undo and one “Flip card [Space]” button, the same height, so nothing shifts when the card turns. The credit shows short — just the sources’ names, still linked — with “Credits” to open the full wording (the Credit control in the bar switches back to the full line).',
    creditBelowFold: true,
  },
  {
    id: 'undoIconSidebar',
    name: 'Undo icon, credit at the foot of the sidebar',
    summary: 'The same row, with the credit moved to the bottom of the settings sidebar instead of the page. Tidy — but not enough on its own: the sidebar can be collapsed, and on a phone it’s a hidden overlay, so the dictionary credit wouldn’t be on the screen showing the dictionary’s words. Fine as a second home for the Voicevox and Tanaka credits.',
    sidebar: true,
  },
  {
    id: 'pinnedIcons',
    name: 'Undo icon row, pinned',
    summary: 'The undo-icon row pinned to the bottom in the Action Bar, with the counts beside it on desktop and above it on a phone. The buttons never leave the screen at any height; the card and panel have the whole rest of it. Credit at the page foot, below the fold.',
    pinned: true,
    creditBelowFold: true,
  },
  {
    id: 'pinned',
    name: 'Buttons pinned to the bottom',
    summary: 'The verdict buttons, Undo and the counts live in the sticky bottom bar every other screen already uses for its main actions (Action Bar). The card and panel sit above it; on a very short window they scroll under the bar while the buttons never leave the screen.',
  },
]

function Face({ word, back, readingPosition }) {
  return (
    <div style={{ background: '#E8E4DE', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5cqw', padding: '0 16px', boxSizing: 'border-box' }}>
      <CardWord form={word.form} reading={word.reading} showReading={back} readingPosition={readingPosition} jaFont={JA_FONT} />
      {back && <div style={{ fontFamily: FONT, fontSize: '5.26cqw', letterSpacing: '0.04em', color: '#555', textAlign: 'center' }}>{word.gloss}</div>}
    </div>
  )
}

function Counts({ compact }) {
  return (
    <span style={{ display: 'flex', gap: compact ? 6 : 8, fontSize: compact ? 13 : FS_BASE, fontFamily: FONT, alignItems: 'center', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#4ade80' }}>{COUNTS.correct}{compact ? '' : ' Correct'}</span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
      <span style={{ color: '#fbbf24' }}>{COUNTS.troubled}{compact ? '' : ' Troubled'}</span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{COUNTS.remaining}{compact ? ' left' : ' Remaining'}</span>
    </span>
  )
}

function UndoLink() {
  return (
    <button type="button" className="undo-btn" style={{ background: 'none', border: 'none', padding: '6px 8px', borderRadius: 6, color: 'rgba(255,255,255,0.55)', fontSize: FS_BASE, fontFamily: 'inherit', letterSpacing: '0.05em', cursor: 'pointer' }}>
      Undo
    </button>
  )
}

function UndoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M7.5 5 L3.5 9 L7.5 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9 H12 A4.5 4.5 0 0 1 12 18 H9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// Undo as a square the height of the verdict buttons, leading the row.
function UndoSquare() {
  return (
    <button type="button" title="Undo" aria-label="Undo" className="lab-ctl" style={{
      width: DRILL_ROW_HEIGHT, height: DRILL_ROW_HEIGHT, flexShrink: 0, borderRadius: 8, padding: 0,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    }}>
      <UndoIcon />
    </button>
  )
}

function IconRow({ flipped, width, mobile, onVerdict, onFlip }) {
  return (
    <div style={{ width, height: DRILL_ROW_HEIGHT, display: 'flex', gap: 8, alignItems: 'center' }}>
      <UndoSquare />
      {flipped ? (
        <>
          <DrillButton label="Incorrect" hint={mobile ? null : 'Z'} color={DRILL_COLORS.again} onClick={() => onVerdict(false)} />
          <DrillButton label="Correct" hint={mobile ? null : 'X'} color={DRILL_COLORS.good} onClick={() => onVerdict(true)} />
        </>
      ) : (
        // Before the flip the row is one button, the same height as the two
        // verdict buttons that replace it, so nothing shifts on the flip.
        <DrillButton label="Flip card" hint={mobile ? null : 'Space'} color="rgba(255,255,255,0.1)" onClick={onFlip} />
      )}
    </div>
  )
}

// The credit, short: each source's name — the linked words of its full
// credit in ATTRIBUTIONS, so there's still one copy of the text — and a
// toggle that opens the full wording in place. The names stay links to each
// project, which EDRDG's licence accepts as the acknowledgement itself.
function CompactCredit({ sources }) {
  const [open, setOpen] = useState(false)
  const credits = sources.map(id => ATTRIBUTIONS[id]).filter(Boolean)
  return (
    <div style={{ width: '100%', textAlign: 'center', padding: '14px 16px 6px', boxSizing: 'border-box', fontSize: 12, color: TEXT_MUTED, fontFamily: FONT, letterSpacing: TRACKING, lineHeight: 1.6, flexShrink: 0 }}>
      <span style={{ opacity: 0.7 }}>
        Sources:{' '}
        {credits.flatMap(seg => seg.filter(x => x.href)).map((x, i) => (
          <span key={x.text + i}>{i > 0 && ' · '}<a href={x.href} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{x.text}</a></span>
        ))}
      </span>
      {' '}
      <button type="button" className="lab-ctl" aria-expanded={open} onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', padding: '0 4px', color: TEXT_MUTED, fontFamily: FONT, fontSize: 12, letterSpacing: TRACKING, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, opacity: 0.8 }}>
        {open ? 'Less' : 'Credits'}
      </button>
      {open && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.7 }}>
          {credits.map((seg, i) => <div key={i}>{renderAttributionSegments(seg)}</div>)}
        </div>
      )}
    </div>
  )
}

function SidebarCredits() {
  return (
    <div style={{ fontSize: FS_CAPTION, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {['dictionary', 'tanaka-corpus', 'voicevox-11'].map(id => <div key={id}>{renderAttributionSegments(ATTRIBUTIONS[id])}</div>)}
    </div>
  )
}

// Measures the frame's scroll area and says whether the screen fits.
// With the credit placed below the fold, what has to fit is the stage alone.
function FitBadge({ scrollerRef, stageRef, stageOnly, deps }) {
  const [over, setOver] = useState(0)
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return undefined
    const measure = () => {
      if (stageOnly && stageRef.current) {
        const pad = parseFloat(getComputedStyle(el).paddingBottom) || 0
        setOver(Math.max(0, Math.round(stageRef.current.getBoundingClientRect().height - (el.clientHeight - pad))))
      } else setOver(Math.max(0, el.scrollHeight - el.clientHeight))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  const fits = over <= 1
  return (
    <span style={{
      position: 'absolute', top: 64, right: 12, zIndex: 40, padding: '4px 10px', borderRadius: 999, fontSize: 13, fontFamily: FONT,
      background: fits ? 'rgba(74,222,128,0.16)' : 'rgba(251,191,36,0.18)', color: fits ? '#4ade80' : '#fbbf24',
      border: `1px solid ${fits ? 'rgba(74,222,128,0.4)' : 'rgba(251,191,36,0.45)'}`, pointerEvents: 'none',
    }}>
      {fits ? (stageOnly ? 'Fits · credit below' : 'Fits') : `Scrolls ${over}px`}
    </span>
  )
}

function Screen({ concept, mobile, frameW, s, u, next }) {
  const scrollerRef = useRef(null)
  const stageRef = useRef(null)
  const def = CONCEPTS.find(c => c.id === concept)
  const word = WORDS[s.idx]
  // A phone has no room beside the card; it gets the stacked compact layout.
  const layout = concept === 'side' && mobile ? 'compact' : concept
  const headerCounts = layout === 'header' || layout === 'compact' || layout === 'side'
  const credit = layout === 'today' || layout === 'header' || def.creditBelowFold
  const sidebar = def.sidebar && !mobile
  const pinned = layout === 'pinned' || layout === 'pinnedIcons'
  const settings = { ...DRILL_SETTINGS_DEFAULTS, sentenceFurigana: s.sentenceFurigana, sentenceTranslation: s.sentenceTranslation, readingPosition: s.readingPosition }

  const card = (
    <div key={word.id} className={s.leaving ? 'card-exit-up' : 'card-entering'} style={{ width: mobile ? '100cqw' : 380, aspectRatio: '380 / 280', containerType: 'size' }}>
      <FlipCard
        front={<Face word={word} readingPosition={s.readingPosition} />}
        back={<Face word={word} back readingPosition={s.readingPosition} />}
        width="100%" height="100%"
        className={mobile ? '' : 'fc-rounded'}
        flipped={s.flipped}
        onFlip={() => u(p => ({ flipped: !p.flipped }))}
      />
    </div>
  )
  const panel = (
    <CardDetails
      cardKey={word.id}
      word={{ form: word.form, reading: word.reading }}
      sentence={word.sentence}
      settings={settings}
      knownIds={KNOWN_IDS}
      related={RELATED}
      revealed={s.flipped}
      leaving={s.leaving}
      mobile={mobile}
      jaFont={JA_FONT}
      kanjiMeanings={word.meanings}
      onChangeSetting={() => {}}
    />
  )
  // The real row sizes itself from the window (100vw), which in a phone frame
  // on a desktop is the desktop's width; the lab's copy takes the frame's.
  const buttons = mobile
    ? <VerdictRow flipped={s.flipped} width={frameW - 32} mobile onVerdict={() => next()} />
    : <SpeedModeControls isFlipped={s.flipped} transitioning={s.leaving} onVerdict={() => next()} />

  const rowW = mobile ? frameW - 32 : 380
  const icons = <IconRow flipped={s.flipped} width={rowW} mobile={mobile} onVerdict={() => next()} onFlip={() => u({ flipped: true })} />

  let stage
  if (layout === 'undoIcon' || layout === 'undoIconSidebar') {
    stage = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
        {card}{panel}{icons}
        <Counts compact={mobile} />
      </div>
    )
  } else if (layout === 'pinnedIcons') {
    stage = <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>{card}{panel}</div>
  } else if (layout === 'today' || layout === 'credit') {
    stage = (
      <DrillHUD streak={0} bestStreak={0} {...COUNTS} canUndo onUndo={() => {}} showStreak={false}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>{card}{panel}{buttons}</div>
      </DrillHUD>
    )
  } else if (layout === 'side') {
    stage = (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>{card}{buttons}</div>
        {/* The panel measures its width against its container (cqw). */}
        <div style={{ width: 452, containerType: 'inline-size', display: 'flex', justifyContent: 'center' }}>{panel}</div>
      </div>
    )
  } else if (layout === 'pinned') {
    stage = <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>{card}{panel}</div>
  } else {
    stage = <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>{card}{panel}{buttons}</div>
  }

  const main = (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#1E1E1E' }}>
      <PageHeader
        crumbs={mobile ? [{ label: 'Reviewing' }] : [{ label: 'Lantern', href: '#' }, { label: 'Vocabulary', href: '#' }, { label: 'Reviewing' }]}
        rightSlot={headerCounts ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: mobile ? 4 : 12 }}>
            <Counts compact={mobile} />
            <UndoLink />
          </span>
        ) : null}
      />
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: '30%', background: BRAND }} />
      </div>
      <div ref={scrollerRef} style={{
        flex: 1, minHeight: 0, overflowY: 'auto', scrollbarGutter: 'stable both-edges',
        display: 'flex', flexDirection: 'column', alignItems: 'center', containerType: 'inline-size',
        // Room for the pinned bar, so the stage's region ends at its top edge
        // and the credit line starts behind it, never peeking over it.
        paddingBottom: pinned ? (mobile ? (layout === 'pinnedIcons' ? 93 : 118) : 69) : 0, boxSizing: 'border-box',
      }}>
        {/* Credit below the fold: the stage's region fills the visible area,
            so the credit line always starts just under it. */}
        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'safe center', justifyContent: 'center', minHeight: def.creditBelowFold ? '100%' : 'min-content', flexShrink: 0 }}>
          <div ref={stageRef}>{stage}</div>
        </div>
        {credit && (s.creditStyle === 'compact' && def.creditBelowFold ? <CompactCredit sources={CREDITS} /> : <AttributionFooter sources={CREDITS} />)}
      </div>
      {layout === 'pinnedIcons' && (mobile ? (
        <ActionBar>
          <div style={{ width: frameW - 48, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Counts compact /></div>
            <IconRow flipped={s.flipped} width={frameW - 48} mobile onVerdict={() => next()} onFlip={() => u({ flipped: true })} />
          </div>
        </ActionBar>
      ) : (
        <ActionBar maxWidth={1100} leading={<Counts />}>
          <IconRow flipped={s.flipped} width={380} onVerdict={() => next()} onFlip={() => u({ flipped: true })} />
        </ActionBar>
      ))}
      {layout === 'pinned' && (mobile ? (
        // A phone's bar has two rows: the session's state, then the buttons
        // at full width.
        <ActionBar>
          <div style={{ width: frameW - 48, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Counts compact /><UndoLink /></div>
            {buttons}
          </div>
        </ActionBar>
      ) : (
        <ActionBar maxWidth={1100} leading={<Counts />}>
          <UndoLink />
          {buttons}
        </ActionBar>
      ))}
      <FitBadge scrollerRef={scrollerRef} stageRef={stageRef} stageOnly={!!def.creditBelowFold} deps={[layout, s.idx, s.flipped, mobile]} />
    </div>
  )

  if (!sidebar) return <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>{main}</div>
  // The settings sidebar, open, with the credit at its foot.
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {main}
      <aside style={{ width: 420, flexShrink: 0, borderLeft: `1px solid ${BORDER}`, background: '#1E1E1E', overflowY: 'auto', padding: '16px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <DrillSettingsPanel settings={DRILL_SETTINGS_DEFAULTS} onChange={() => {}} />
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${BORDER}` }}><SidebarCredits /></div>
      </aside>
    </div>
  )
}

function ConceptSection({ concept, index, desktopH, phoneH, s, u, next, notes, setNotes }) {
  return (
    <Section id={concept.id} tag={String(index)} title={concept.name}>
      <p style={P}>{concept.summary}</p>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame size={{ w: desktopH === 680 ? 1280 : 1440, h: desktopH, label: `Desktop · ${desktopH === 680 ? 1280 : 1440}×${desktopH}` }} scale={0.5}>
          <Screen concept={concept.id} mobile={false} frameW={desktopH === 680 ? 1280 : 1440} s={s} u={u} next={next} />
        </Frame>
        <Frame size={{ w: phoneH === 667 ? 375 : 390, h: phoneH, label: `Phone · ${phoneH === 667 ? 375 : 390}×${phoneH}` }} scale={0.62}>
          <Screen concept={concept.id} mobile frameW={phoneH === 667 ? 375 : 390} s={s} u={u} next={next} />
        </Frame>
      </div>
      <Notes id={concept.id} label={concept.name} notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function feedbackMarkdown(notes) {
  const titles = { ...Object.fromEntries(CONCEPTS.map((c, i) => [c.id, `${i} · ${c.name}`])), general: 'General' }
  const parts = Object.entries(titles).filter(([id]) => notes[id]?.trim()).map(([id, t]) => `## ${t}\n${notes[id].trim()}`)
  return `# Drill screen height feedback\n\n${parts.join('\n\n')}\n`
}

export default function HeightLab() {
  const [s, u, next] = useLabDrill({ flipped: true, creditStyle: 'compact' })
  const [desktopH, setDesktopH] = useState(745)
  const [phoneH, setPhoneH] = useState(667)
  const [notes, setNotesState] = useState(() => readFeedback(FEEDBACK_KEY))
  const [copied, setCopied] = useState(false)
  const setNotes = n => { setNotesState(n); writeFeedback(FEEDBACK_KEY, n) }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedbackMarkdown(notes))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard blocked — the notes stay on the page */ }
  }

  return (
    <div style={{ padding: '40px 40px 120px', display: 'flex', flexDirection: 'column', gap: 28, fontFamily: FONT, letterSpacing: TRACKING, color: TEXT }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 900 }}>
        <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design lab · drill screen height</span>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400 }}>Fitting a short window, card at full size</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>The card stays 380 × 280 and the details panel keeps its reserved room, so its buttons hold still from card to card. Something else has to give on a short window. Eight ways, each against today — 6 to 8 are the newest: Undo as an icon in the button row, the credit in the sidebar, and the icon row pinned.</p>
        <Bullets items={[
          'Every frame is the real header, HUD, buttons, credit line, Action Bar and details panel — the badge on each is a live measurement of whether it scrolls.',
          'Frames start flipped, on the tallest state (answer showing, buttons out). Flip, answer, or use the bar to change word and screen size; all frames follow.',
          'A card that shrinks to fit was tried in the product and ruled out. It’s gone again.',
        ]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 4 }}>
          <Principle title="The budget at 745px">Header 66 + progress 3 leaves ~676 for the page. Card 280, panel 225, buttons 50, Undo 40, counts 20, three gaps of 15, credit ~50 — about 710. Roughly 50px over.</Principle>
          <Principle title="The credit — where it may go">EDRDG’s licence (JMdict, KANJIDIC) for a website: “the acknowledgement must be made on each screen display, e.g. in the form of a message at the foot of the screen or page.” So the foot of the page is fine even below the fold, but the settings sidebar alone isn’t — it can be closed, and on a phone it’s hidden. Voicevox only asks for a credit that shows Voicevox was used, anywhere; Tanaka (CC BY) a reasonable credit. Both could live in the sidebar.</Principle>
          <Principle title="What can give">Not the card and not the panel’s reserve (that’s what keeps the buttons still). That leaves the credit line (~50), the Undo row and counts (~90 together), the vertical stacking itself, or where the buttons live.</Principle>
        </div>
      </header>

      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(30,30,30,0.94)', padding: '10px 0', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` }}>
        <Seg label="Word" value={s.idx} options={WORDS.map((w, i) => [i, <Japanese key={w.id}>{w.form}</Japanese>])} onChange={idx => u({ idx })} />
        <Seg label="Side" value={s.flipped} options={[[false, 'Front'], [true, 'Back']]} onChange={flipped => u({ flipped })} />
        <Seg label="Desktop" value={desktopH} options={DESKTOP_SIZES} onChange={setDesktopH} />
        <Seg label="Phone" value={phoneH} options={PHONE_SIZES} onChange={setPhoneH} />
        <Seg label="Credit (5, 7)" value={s.creditStyle} options={[['compact', 'Short'], ['full', 'Full']]} onChange={v => u({ creditStyle: v })} />
        <span style={{ flex: 1 }} />
        <button type="button" className="lab-ctl" onClick={copy} style={{ border: `1px solid ${BRAND}`, background: 'transparent', color: TEXT, borderRadius: 6, padding: '6px 12px', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING }}>
          {copied ? 'Copied' : 'Copy all notes as Markdown'}
        </button>
      </div>

      {CONCEPTS.map((c, i) => (
        <ConceptSection key={c.id} concept={c} index={i} desktopH={desktopH} phoneH={phoneH} s={s} u={u} next={next} notes={notes} setNotes={setNotes} />
      ))}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40, borderTop: `1px solid ${BORDER}`, maxWidth: 1180 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Overall</h2>
        <Notes id="general" label="the direction overall" notes={notes} setNotes={setNotes} />
      </section>
    </div>
  )
}

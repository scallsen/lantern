import { useState, useEffect } from 'react'
import { FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND, BRAND_TEXT } from '../../data/theme.js'
import { Frame } from './parts.jsx'
import { StageV4 } from './detailsV4.jsx'
import { Seg, Controls, WordPicker, Bullets } from './labChrome.jsx'
import { Section, Notes, Principle } from './ContextBandLab.jsx'
import { WORDS, useConceptState, readFeedback, writeFeedback } from './labData.js'
import './lab.css'

const FEEDBACK_KEY = 'lab:drill-context:details-v4:feedback'
const P = { margin: 0, lineHeight: 1.6, fontSize: 15, maxWidth: 900 }

const BASE = {
  flipped: true, layout: 'footer', reserve: 'ghost', open: null, kTok: null, tok: null,
  furigana: 'new', english: 'hide', auto: false,
}

const LAYOUTS = [
  { id: 'footer', tag: 'M5', name: 'Kanji footer', note: 'Your direction: the card\u2019s kanji bar, moved into the sentence card as its footer. Evenly divided tiles, kanji over meaning, so the meanings are skimmable in one glance under the sentence. The small number is how many other words share that kanji. Tap a tile and they open upward, over the sentence, never over the buttons. Replay sits top right on the first line.', risks: 'A long word divides the footer into narrow tiles (賞味期限 on a phone is four ~88px tiles). Meanings truncate there.' },
  { id: 'stack', tag: 'M1', name: 'Stacked', note: 'The sentence, then one quiet line of kanji meanings under it: 期 period · 間 interval. The small number is how many other words use that kanji. Tap one and its words open on a line right below, one kanji at a time. Everything is visible in one glance, and there are no tabs.', risks: 'An opened kanji grows the panel, which moves the buttons unless the layout is pinned (see section 2).' },
  { id: 'split', tag: 'M2', name: 'Side by side', note: 'On desktop, the kanji meanings get a narrow column to the right of the sentence, and a word list opens as a popover, so the panel never changes height. On a phone there\'s no room for a column, so it falls back to M1.', risks: 'Two different layouts to maintain, and the sentence loses ~200px of width on desktop.' },
  { id: 'card', tag: 'M3', name: 'Meanings on the card', note: 'A rethink. The kanji meanings describe the word, so they go back on the card as today\'s tile bar. The panel becomes the sentence alone, since the sentence is about usage. Tap a tile and its words open in a popover just under the card.', risks: 'The card gets one row busier again, though it\'s only the one row it had before.' },
  { id: 'inline', tag: 'M4', name: 'In the sentence', note: 'The meanings sit under each kanji of the word, right where it\'s used in the sentence: 期 over "period", 間 over "interval". Tap the word for the related words. It\'s the most compact, because card and panel both stay minimal.', risks: 'Only works when the sentence contains the word as written. 温かい falls back to M1. Long words get cramped under-glosses.' },
]

const RESERVES = [
  { id: 'none', name: 'None (today\'s behaviour)', note: 'Nothing is held. The panel appears on flip and pushes the buttons down. Here for comparison: turn on auto-flip and watch the buttons jump.' },
  { id: 'ghost', name: 'Face-down panel', note: 'Before the flip, the panel\'s space is a dimmed, hatched paper, like the back of a second card waiting to be turned. It flips over with the card. Nothing moves, and the empty space reads as part of the object rather than a gap.' },
  { id: 'preview', name: 'Masked preview', note: 'The front shows the panel already: the sentence with the word blanked out, and the kanji with their meanings hidden. Flipping only fills in the answer. It\'s the calmest option, because nothing appears, but it gives a context hint before you answer, so it could replace the separate "sentence on the front" mode.' },
  { id: 'pinned', name: 'Pinned buttons', note: 'The card is anchored near the top, and the verdict buttons are pinned to the bottom, like other screens\' action bars. The panel grows into the space between. The only option that absorbs any height, even an opened kanji, but on desktop the buttons end up far from the card.' },
]

// ── Sections ──────────────────────────────────────────────────────────────

function GlanceFrame({ layout, idx }) {
  const [s, u] = useConceptState({ ...BASE, idx, layout })
  const meta = LAYOUTS.find(l => l.id === layout)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 14 }}><span style={{ color: BRAND_TEXT }}>{meta.tag}</span> {meta.name}</span>
      <Frame device="desktop" scale={0.42}><StageV4 mobile={false} s={s} u={u} /></Frame>
    </div>
  )
}

function LayoutsSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState(BASE)
  const meta = LAYOUTS.find(l => l.id === s.layout)
  return (
    <Section id="layouts" tag="1" title="Sentence and meanings together">
      <p style={P}>Rethinking the tabs: they put two different kinds of thing side by side. The sentence is usage. The kanji meanings are the word’s parts: short, and useful at a glance every time. The related words are the occasional deeper dive. So the middle ground has two levels. <b>Sentence and meanings are always visible; related words are one tap away.</b> Four ways to lay that out:</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, maxWidth: 1180 }}>
        {LAYOUTS.map(l => (
          <button key={l.id} type="button" className="lab-ctl" onClick={() => u({ layout: l.id, open: null })} style={{
            textAlign: 'left', cursor: 'pointer', background: l.id === s.layout ? '#2c2c2c' : '#252525', color: TEXT,
            border: `1px solid ${l.id === s.layout ? 'rgba(255,255,255,0.4)' : BORDER}`, borderRadius: 8, padding: 14,
            display: 'flex', flexDirection: 'column', gap: 6, fontFamily: FONT, letterSpacing: TRACKING,
          }}>
            <span style={{ fontSize: 15 }}><span style={{ color: BRAND_TEXT }}>{l.tag}</span> {l.name}</span>
            <span style={{ fontSize: 13, lineHeight: 1.55 }}>{l.note}</span>
            <span style={{ fontSize: 12, lineHeight: 1.5, color: TEXT_MUTED }}>{l.risks}</span>
          </button>
        ))}
      </div>
      <Controls
        concept={{ controls: [
          { key: 'layout', label: 'Layout', options: LAYOUTS.map(l => [l.id, `${l.tag} ${l.name}`]) },
          { key: 'english', label: 'Translation', options: [['show', 'Always'], ['hide', 'Off']] },
        ] }}
        s={s}
        u={u}
      />
      <div style={{ fontSize: 13, color: TEXT_MUTED }}>Showing <span style={{ color: BRAND_TEXT }}>{meta.tag}</span> {meta.name}. {s.layout === 'card' ? 'Tap a kanji tile on the card.' : s.layout === 'inline' ? 'Tap the marked word in the sentence.' : 'Tap a kanji under the sentence.'}</div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><StageV4 mobile={false} s={s} u={u} /></Frame>
        <Frame device="phone" scale={0.8}><StageV4 mobile s={s} u={u} /></Frame>
      </div>
      <GlanceGrid />
      <Notes id="layouts" label="1 · Sentence and meanings together" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function GlanceGrid() {
  const [idx, setIdx] = useState(2)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15 }}>All four at a glance</span>
        <WordPicker s={{ idx }} u={p => setIdx(p.idx)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, max-content)', gap: 20 }}>
        {LAYOUTS.map(l => <GlanceFrame key={`${l.id}-${idx}`} layout={l.id} idx={idx} />)}
      </div>
    </div>
  )
}

function StillSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState({ ...BASE, flipped: false })
  // Auto-flip: front → back → next word, so any movement shows up by itself.
  useEffect(() => {
    if (!s.auto) return undefined
    const t = setTimeout(() => u(p => (p.flipped
      ? { flipped: false, idx: (p.idx + 1) % WORDS.length, open: null, tok: null }
      : { flipped: true })), 1300)
    return () => clearTimeout(t)
  }, [s.auto, s.flipped, u])
  const meta = RESERVES.find(r => r.id === s.reserve)
  return (
    <Section id="still" tag="2" title="Keeping the card still">
      <p style={P}>The card and buttons should sit in the same place on the front, on the back, and from one card to the next. Four ways to hold the panel’s space before the flip. Turn on <b>Auto-flip</b> to cycle front → back → next word and watch for movement.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, maxWidth: 1180 }}>
        {RESERVES.map(r => (
          <Principle key={r.id} title={r.name}>{r.note}</Principle>
        ))}
      </div>
      <Controls
        concept={{ controls: [
          { key: 'reserve', label: 'Space', options: RESERVES.map(r => [r.id, r.name.replace(" (today's behaviour)", '')]) },
          { key: 'layout', label: 'Layout', options: LAYOUTS.map(l => [l.id, l.tag]) },
          { key: 'auto', label: 'Auto-flip', options: [[false, 'Off'], [true, 'On']] },
        ] }}
        s={s}
        u={u}
      />
      <div style={{ fontSize: 13, color: TEXT_MUTED }}>Showing: {meta.name}</div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><StageV4 mobile={false} s={s} u={u} /></Frame>
        <Frame device="phone" scale={0.8}><StageV4 mobile s={s} u={u} /></Frame>
      </div>
      <Notes id="still" label="2 · Keeping the card still" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function feedbackMarkdown(notes) {
  const titles = { layouts: '1 · Sentence and meanings together', still: '2 · Keeping the card still', general: 'General' }
  const parts = Object.entries(titles).filter(([id]) => notes[id]?.trim()).map(([id, t]) => `## ${t}\n${notes[id].trim()}`)
  return `# Details panel v4 feedback\n\n${parts.join('\n\n')}\n`
}

export default function DetailsV4Lab() {
  const [scale, setScale] = useState(0.6)
  const [notes, setNotesState] = useState(() => readFeedback(FEEDBACK_KEY))
  const [copied, setCopied] = useState(false)
  const setNotes = next => { setNotesState(next); writeFeedback(FEEDBACK_KEY, next) }
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
        <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design lab · iteration 4</span>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400 }}>Details panel, without tabs</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>From your v3 notes:</p>
        <Bullets items={[
          'The settings approach and the Details naming stand. The drawer is unchanged from v3.',
          'Tabs make you choose between the sentence and the meanings. Four layouts show both at once, with the related words one tap away.',
          'The card mustn’t move during a drill. Four ways to hold the panel’s space before the flip, with an auto-flip to check.',
        ]} />
      </header>

      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(30,30,30,0.94)', padding: '10px 0', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` }}>
        <Seg label="Desktop frame" value={scale} options={[[0.5, '50%'], [0.6, '60%'], [0.8, '80%'], [1, '100%']]} onChange={setScale} />
        <span style={{ flex: 1 }} />
        <button type="button" className="lab-ctl" onClick={copy} style={{ border: `1px solid ${BRAND}`, background: 'transparent', color: TEXT, borderRadius: 6, padding: '6px 12px', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING }}>
          {copied ? 'Copied' : 'Copy all notes as Markdown'}
        </button>
      </div>

      <LayoutsSection scale={scale} notes={notes} setNotes={setNotes} />
      <StillSection scale={scale} notes={notes} setNotes={setNotes} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40, borderTop: `1px solid ${BORDER}`, maxWidth: 1180 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Overall</h2>
        <Notes id="general" label="the direction overall" notes={notes} setNotes={setNotes} />
      </section>
    </div>
  )
}

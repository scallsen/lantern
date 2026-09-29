import { useState, useEffect } from 'react'
import Japanese from '../../components/Japanese.jsx'
import { FONT, KANJI_FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND, BRAND_TEXT } from '../../data/theme.js'
import { Frame } from './parts.jsx'
import { StageV4, PopoverSample } from './detailsV4.jsx'
import { Seg, Controls, WordPicker, Bullets } from './labChrome.jsx'
import { Section, Notes, Principle } from './ContextBandLab.jsx'
import { WORDS, kanjiOf, useConceptState, readFeedback, writeFeedback } from './labData.js'
import './lab.css'

const FEEDBACK_KEY = 'lab:drill-context:details-v5:feedback'
const P = { margin: 0, lineHeight: 1.6, fontSize: 15, maxWidth: 900 }

const BASE = {
  flipped: true, layout: 'footer', reserve: 'sentence', popStyle: 'grouped', open: null, kTok: null, tok: null,
  furigana: 'new', english: 'hide', auto: false,
}

const POPOVERS = [
  { id: 'grouped', tag: 'L1', name: 'Grouped', note: 'Two labelled groups, "You know" and "This lesson", each a plain word + meaning list capped at three. The group label replaces the per-row tags. The header adds what the tile doesn’t have: the kanji’s readings.' },
  { id: 'table', tag: 'L2', name: 'Table', note: 'Word, reading and meaning in aligned columns, so you scan down one column at a time. Groups are split by a rule instead of a label; bright means known, dim means this lesson.' },
  { id: 'flow', tag: 'L3', name: 'Words only', note: 'The leanest: one line of words per group, no meanings (hover for reading and meaning). It treats the popover as recognition ("I know 来学期") rather than a glossary.' },
  { id: 'ruby', tag: 'L4', name: 'Word grid', note: 'A small grid of words, each with furigana over the word and the meaning under it. The most "study" of the four: readings are right there, and it doubles as a mini vocab review.' },
  { id: 'v4', tag: 'v4', name: 'Current (v4)', note: 'The v4 list for comparison: one run of rows, known and lesson mixed, with a yellow "this lesson" tag on each lesson row.' },
]

const FRONTS = [
  { id: 'sentence', name: 'Sentence always up', note: 'The front shows the sentence in full: the word highlighted but without its furigana, and the kanji tiles with their meanings held back. Flipping adds the reading and the meanings. The panel is never empty, and it’s identical on both sides, so nothing can move. It does make the drill "recognise the word in context", which is easier, and it would make the separate "sentence on the front" setting redundant.' },
  { id: 'redact', name: 'Redacted', note: 'The whole panel is laid out, but every word of the sentence and every meaning is a grey bar its own width, like a redacted document. You see the shape of what’s coming but none of it. It’s the same content on both sides, so nothing moves.' },
  { id: 'blur', name: 'Blurred', note: 'The same idea with a blur instead of bars: the sentence and meanings are there but unreadable until the flip. Softer than redaction, but a blur can read as "still loading".' },
  { id: 'empty', name: 'Empty state', note: 'An outlined area saying "Flip the card to see the sentence and kanji". It’s honest and explains itself to a new user, but it repeats on every card, and its height is fixed, so a longer-than-usual sentence still pushes the buttons on the flip.' },
  { id: 'preview', name: 'Word blanked (v4)', note: 'From v4: the sentence with only the drilled word blanked out, meanings hidden. It sits between "Sentence always up" and "Redacted".' },
  { id: 'none', name: 'Nothing (today)', note: 'For comparison: the panel appears on the flip and pushes the buttons down.' },
]

// ── Sections ──────────────────────────────────────────────────────────────

function LockedSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState(BASE)
  return (
    <Section id="locked" tag="1" title="Locked: sentence above, kanji footer">
      <p style={P}>The layout from v4 M5, now the direction. Two changes: replay sits in the panel’s top-right corner, and the vertical spacing is balanced against the kanji rather than the furigana. The furigana was what made the phone look top-heavy. The eye measures a line’s edge from the kanji, so the space above the first line’s kanji now equals the space below the last line’s (20px on a phone, 24px on desktop). The furigana sits inside that top space, the way ascenders do in Latin type, and a line with or without furigana lays out identically.</p>
      <Controls
        concept={{ controls: [
          { key: 'popStyle', label: 'Popover', options: POPOVERS.map(p => [p.id, p.tag === 'v4' ? 'v4' : `${p.tag} ${p.name}`]) },
          { key: 'reserve', label: 'Before flip', options: FRONTS.map(f => [f.id, f.name.replace(' (today)', '').replace(' (v4)', '')]) },
          { key: 'english', label: 'Translation', options: [['show', 'Always'], ['hide', 'Off']] },
        ] }}
        s={s}
        u={u}
      />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><StageV4 mobile={false} s={s} u={u} /></Frame>
        <Frame device="phone" scale={0.8}><StageV4 mobile s={s} u={u} /></Frame>
      </div>
      <Notes id="locked" label="1 · The locked design" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function PopoverSection({ notes, setNotes }) {
  const [idx, setIdx] = useState(2)
  const word = WORDS[idx]
  const chars = kanjiOf(word.form)
  const [pick, setPick] = useState(null)
  const ch = chars.includes(pick) ? pick : chars[0]
  return (
    <Section id="popover" tag="2" title="The popover lists">
      <p style={P}>What opens when you tap a kanji tile. All four new versions share a header (the kanji, its meanings and its readings, which are the one thing the tile doesn’t show) and cap each group at three with a “+N more”. They differ in how the words themselves are set. Pick a word and one of its kanji. 期 has both groups, 気 (in 気温) has seven words you know, 賞 has only lesson words.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 8 }}>
        <WordPicker s={{ idx }} u={p => { setIdx(p.idx); setPick(null) }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>Kanji</span>
          {chars.map(c => (
            <button key={c} type="button" className="lab-ctl" onClick={() => setPick(c)} style={{
              border: `1px solid ${c === ch ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.14)'}`, borderRadius: 6, padding: '2px 10px',
              background: c === ch ? 'rgba(255,255,255,0.1)' : 'transparent', color: TEXT, fontFamily: KANJI_FONT, fontSize: 15,
            }}>
              <Japanese>{c}</Japanese>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {POPOVERS.map(p => (
          <div key={p.id} style={{ width: p.id === 'table' || p.id === 'ruby' ? 300 : 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 14 }}><span style={{ color: p.tag === 'v4' ? TEXT_MUTED : BRAND_TEXT }}>{p.tag}</span> {p.name}</span>
            <PopoverSample ch={ch} word={word} variant={p.id} />
            <span style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.55 }}>{p.note}</span>
          </div>
        ))}
      </div>
      <Notes id="popover" label="2 · The popover lists" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function FrontGlance({ reserve, idx }) {
  const [s, u] = useConceptState({ ...BASE, idx, reserve, flipped: false })
  const meta = FRONTS.find(f => f.id === reserve)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13 }}>{meta.name}</span>
      <Frame device="phone" scale={0.56}><StageV4 mobile s={s} u={u} /></Frame>
    </div>
  )
}

function FrontSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState({ ...BASE, flipped: false })
  const [glanceIdx, setGlanceIdx] = useState(1)
  useEffect(() => {
    if (!s.auto) return undefined
    const t = setTimeout(() => u(p => (p.flipped
      ? { flipped: false, idx: (p.idx + 1) % WORDS.length, open: null, tok: null }
      : { flipped: true })), 1400)
    return () => clearTimeout(t)
  }, [s.auto, s.flipped, u])
  return (
    <Section id="front" tag="3" title="Before the flip">
      <p style={P}>The panel is on, so before the flip it shouldn’t look like a hole. It should look like the panel, just not answered yet. The first three below keep the real panel on the front, so the two sides are the same size by construction and nothing moves, however long the sentence. The empty state is the one that can still move, because its height is a guess.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, maxWidth: 1180 }}>
        {FRONTS.map(f => <Principle key={f.id} title={f.name}>{f.note}</Principle>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15 }}>All fronts side by side</span>
          <WordPicker s={{ idx: glanceIdx }} u={p => setGlanceIdx(p.idx)} />
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {FRONTS.filter(f => f.id !== 'none').map(f => <FrontGlance key={`${f.id}-${glanceIdx}`} reserve={f.id} idx={glanceIdx} />)}
        </div>
      </div>
      <Controls
        concept={{ controls: [
          { key: 'reserve', label: 'Before flip', options: FRONTS.map(f => [f.id, f.name.replace(' (today)', '').replace(' (v4)', '')]) },
          { key: 'auto', label: 'Auto-flip', options: [[false, 'Off'], [true, 'On']] },
        ] }}
        s={s}
        u={u}
      />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><StageV4 mobile={false} s={s} u={u} /></Frame>
        <Frame device="phone" scale={0.8}><StageV4 mobile s={s} u={u} /></Frame>
      </div>
      <Notes id="front" label="3 · Before the flip" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function feedbackMarkdown(notes) {
  const titles = { locked: '1 · Locked design', popover: '2 · Popover lists', front: '3 · Before the flip', general: 'General' }
  const parts = Object.entries(titles).filter(([id]) => notes[id]?.trim()).map(([id, t]) => `## ${t}\n${notes[id].trim()}`)
  return `# Details panel v5 feedback\n\n${parts.join('\n\n')}\n`
}

export default function DetailsV5Lab() {
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
        <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design lab · iteration 5</span>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400 }}>Details panel</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>From your v4 notes:</p>
        <Bullets items={[
          'Locked: sentence above, kanji footer below. Replay moves to the top-right corner, and the spacing is balanced so the phone isn’t top-heavy.',
          'Four cleaner ways to set the popover’s word lists.',
          'The hatched face-down panel is out. Five alternatives for the front, leaning towards "the panel is always there".',
        ]} />
      </header>

      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(30,30,30,0.94)', padding: '10px 0', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` }}>
        <Seg label="Desktop frame" value={scale} options={[[0.5, '50%'], [0.6, '60%'], [0.8, '80%'], [1, '100%']]} onChange={setScale} />
        <span style={{ flex: 1 }} />
        <button type="button" className="lab-ctl" onClick={copy} style={{ border: `1px solid ${BRAND}`, background: 'transparent', color: TEXT, borderRadius: 6, padding: '6px 12px', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING }}>
          {copied ? 'Copied' : 'Copy all notes as Markdown'}
        </button>
      </div>

      <LockedSection scale={scale} notes={notes} setNotes={setNotes} />
      <PopoverSection notes={notes} setNotes={setNotes} />
      <FrontSection scale={scale} notes={notes} setNotes={setNotes} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40, borderTop: `1px solid ${BORDER}`, maxWidth: 1180 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Overall</h2>
        <Notes id="general" label="the direction overall" notes={notes} setNotes={setNotes} />
      </section>
    </div>
  )
}

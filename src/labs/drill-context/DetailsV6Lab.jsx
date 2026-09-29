import { useState, useEffect } from 'react'
import { FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND } from '../../data/theme.js'
import { Frame } from './parts.jsx'
import { StageV4 } from './detailsV4.jsx'
import { Seg, Controls, Bullets } from './labChrome.jsx'
import { Section, Notes, Principle } from './ContextBandLab.jsx'
import { WORDS, useConceptState, readFeedback, writeFeedback } from './labData.js'
import './lab.css'

const FEEDBACK_KEY = 'lab:drill-context:details-v6:feedback'
const P = { margin: 0, lineHeight: 1.6, fontSize: 15, maxWidth: 900 }

const BASE = {
  flipped: false, layout: 'footer', reserve: 'reveal', open: null, kTok: null, tok: null,
  furigana: 'new', english: 'hide', auto: false,
}

function PanelSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState(BASE)
  useEffect(() => {
    if (!s.auto) return undefined
    const t = setTimeout(() => u(p => (p.flipped
      ? { flipped: false, idx: (p.idx + 1) % WORDS.length, open: null, tok: null }
      : { flipped: true })), 1800)
    return () => clearTimeout(t)
  }, [s.auto, s.flipped, u])
  return (
    <Section id="panel" tag="1" title="The details panel">
      <p style={P}>Flip the card (click it, or use the Side control) and watch the panel. It’s the same panel on both faces: redacted on the front, and on the flip the bars fade out as the words fade in, in place, timed to land with the card. Tap a kanji tile for its words.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, maxWidth: 1180 }}>
        <Principle title="Spacing">One inset on all four sides of the sentence: 16px on a phone, 24px on desktop, measured to the kanji. The furigana sits inside the top inset. The panel hugs its content: no slack between the sentence and the footer.</Principle>
        <Principle title="Holding still">The panel sits at the top of a fixed slot (room for two lines on desktop, three on a phone), so the card and the buttons don’t move between faces or between cards. Only the panel’s own height varies, below the card.</Principle>
        <Principle title="The reveal">The redacted sentence is the real sentence drawn as bars: same tokens, same widths, same line breaks. Only opacity changes, so nothing reflows. The fade is 380ms, starting 140ms into the 450ms flip.</Principle>
        <Principle title="Popover">L1 without the header: “You know” and “This lesson”, three each, the word on the left and its meaning right-aligned. The tile the user tapped already shows the kanji and its meaning.</Principle>
      </div>
      <Controls
        concept={{ controls: [
          { key: 'english', label: 'Translation', options: [['show', 'Always'], ['hide', 'Off']] },
          { key: 'auto', label: 'Auto-flip', options: [[false, 'Off'], [true, 'On']] },
        ] }}
        s={s}
        u={u}
      />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><StageV4 mobile={false} s={s} u={u} /></Frame>
        <Frame device="phone" scale={0.8}><StageV4 mobile s={s} u={u} /></Frame>
      </div>
      <Notes id="panel" label="the details panel" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function feedbackMarkdown(notes) {
  const titles = { panel: 'The details panel', general: 'General' }
  const parts = Object.entries(titles).filter(([id]) => notes[id]?.trim()).map(([id, t]) => `## ${t}\n${notes[id].trim()}`)
  return `# Details panel v6 feedback\n\n${parts.join('\n\n')}\n`
}

export default function DetailsV6Lab() {
  const [scale, setScale] = useState(0.8)
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
        <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design lab · iteration 6</span>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400 }}>Details panel</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>From your v5 notes:</p>
        <Bullets items={[
          'Phone spacing: one inset on all sides, and no slack between the sentence and the footer.',
          'Popover: L1, without the header, with the meanings right-aligned.',
          'Before the flip: redacted, with the bars fading to the real content in place, with no flash or reload.',
        ]} />
      </header>

      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(30,30,30,0.94)', padding: '10px 0', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` }}>
        <Seg label="Desktop frame" value={scale} options={[[0.5, '50%'], [0.6, '60%'], [0.8, '80%'], [1, '100%']]} onChange={setScale} />
        <span style={{ flex: 1 }} />
        <button type="button" className="lab-ctl" onClick={copy} style={{ border: `1px solid ${BRAND}`, background: 'transparent', color: TEXT, borderRadius: 6, padding: '6px 12px', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING }}>
          {copied ? 'Copied' : 'Copy all notes as Markdown'}
        </button>
      </div>

      <PanelSection scale={scale} notes={notes} setNotes={setNotes} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40, borderTop: `1px solid ${BORDER}`, maxWidth: 1180 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Overall</h2>
        <Notes id="general" label="the direction overall" notes={notes} setNotes={setNotes} />
      </section>
    </div>
  )
}

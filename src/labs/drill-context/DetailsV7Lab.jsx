import { useState, useEffect } from 'react'
import { FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND } from '../../data/theme.js'
import { Frame } from './parts.jsx'
import { StageV4 } from './detailsV4.jsx'
import { Seg, Controls, WordPicker, Bullets } from './labChrome.jsx'
import { Section, Notes, Principle } from './ContextBandLab.jsx'
import { WORDS, useConceptState, readFeedback, writeFeedback } from './labData.js'
import './lab.css'

const FEEDBACK_KEY = 'lab:drill-context:details-v7:feedback'
const P = { margin: 0, lineHeight: 1.6, fontSize: 15, maxWidth: 900 }

const BASE = {
  flipped: false, layout: 'footer', reserve: 'reveal', v7: true, readingPos: 'below',
  shown: true, showSentence: true, showKanji: true,
  open: null, kTok: null, tok: null, furigana: 'new', english: 'blur', enShown: false, sentenceAudio: true, auto: false,
}

const CONFIGS = [
  { id: 'both', label: 'Sentence + kanji', patch: { showSentence: true, showKanji: true } },
  { id: 'sentence', label: 'Sentence only', patch: { showSentence: true, showKanji: false } },
  { id: 'kanji', label: 'Kanji only', patch: { showSentence: false, showKanji: true } },
]
const configOf = s => (s.showSentence === false ? 'kanji' : s.showKanji === false ? 'sentence' : 'both')

function useAutoFlip(s, u) {
  useEffect(() => {
    if (!s.auto) return undefined
    const t = setTimeout(() => u(p => (p.flipped
      ? { flipped: false, idx: (p.idx + 1) % WORDS.length, open: null, tok: null, enShown: false }
      : { flipped: true })), 1600)
    return () => clearTimeout(t)
  }, [s.auto, s.flipped, u])
}

function PanelSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState(BASE)
  useAutoFlip(s, u)
  return (
    <Section id="panel" tag="1" title="The details panel">
      <p style={P}>The drawer on the right is the real settings components, wired to the frames. Try turning Sentence or Kanji off: whichever is left can’t be switched off, and the sentence-only rows disappear with the sentence. Flip with the card or the Side control and watch the reveal. It now starts on the tap and finishes just after the card lands, and runs backwards when you flip back.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, maxWidth: 1180 }}>
        <Principle title="v7 round 2">The open kanji tile loses its red top line (a light tint is all that marks it). The drilled word in the sentence is simply bold. A word’s popover drops its “new to you” line. Translation is Off / Blurred / On, with <b>Blurred</b> the default: it sits under the sentence blurred and comes into focus when tapped, once per card. The card and panel share 6px corners on desktop; on a phone both run edge to edge, square.</Principle>
        <Principle title="Reveal timing">500ms, starting with the flip (450ms), so the words are fully in just as the card settles. The same transition runs in reverse when the flip is undone.</Principle>
        <Principle title="Redaction">Every bar is rounded on all four corners. They’re drawn as rounded rectangles that keep a 3px radius at any width and on every wrapped line.</Principle>
        <Principle title="One popover">Opening a kanji’s words closes a word’s popover in the sentence, and the other way round.</Principle>
        <Principle title="Reading position">No drop shadow on the word or its reading. “Reading: Below” (the default) puts the card’s reading under the word <i>and</i> the sentence’s furigana under its kanji. “Above” puts both back on top. Either way the furigana sits in the line’s spare leading, so switching never moves the layout.</Principle>
        <Principle title="Hide from the panel">An × in the panel’s top-right corner, beside replay and in the same style, hides the details. That’s the same setting as the drawer’s “Show under card”, and “Show details” brings it back. In kanji-only it sits over the last tile, so every tile’s count moves to its top-left corner there.</Principle>
        <Principle title="The drawer">Every group uses the standard dividers between rows. A <b>Sentence</b> card appears while the sentence is on: Show translation (a switch) and Furigana (Off / New / All chips, like Reading). <b>Play sentence</b> moved to Audio, and it’s disabled rather than hidden whenever there’s no sentence showing.</Principle>
      </div>
      <Controls
        concept={{ controls: [
          { key: 'readingPos', label: 'Reading', options: [['below', 'Below'], ['above', 'Above']] },
          { key: 'english', label: 'Translation', options: [['hide', 'Off'], ['blur', 'Blurred'], ['show', 'On']] },
          { key: 'auto', label: 'Auto-flip', options: [[false, 'Off'], [true, 'On']] },
        ] }}
        s={s}
        u={u}
      />
      <Seg label="Details" value={configOf(s)} options={CONFIGS.map(c => [c.id, c.label])} onChange={id => u({ ...CONFIGS.find(c => c.id === id).patch, open: null, tok: null })} />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><StageV4 mobile={false} s={s} u={u} sidebar /></Frame>
        <Frame device="phone" scale={0.8}><StageV4 mobile s={s} u={u} /></Frame>
      </div>
      <Notes id="panel" label="1 · The details panel" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function ConfigFrame({ patch, label, idx, flipped, readingPos }) {
  const [s, u] = useConceptState({ ...BASE, ...patch, idx, flipped, readingPos })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <Frame device="phone" scale={0.6}><StageV4 mobile s={s} u={u} /></Frame>
    </div>
  )
}

function ConfigsSection({ notes, setNotes }) {
  const [idx, setIdx] = useState(1)
  const [flipped, setFlipped] = useState(true)
  return (
    <Section id="configs" tag="2" title="Sentence only, kanji only">
      <p style={P}>The three things the Details settings can leave under the card. <b>Sentence only</b> is the sentence card without its footer. <b>Kanji only</b> turns the footer into the whole panel: the tiles get all four corners and a little more height, and their words still open upward on a tap. Each keeps its own reserved height, so nothing moves in any of them. And the reading-position setting, side by side.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <WordPicker s={{ idx }} u={p => setIdx(p.idx)} />
        <Seg label="Side" value={flipped} options={[[false, 'Front'], [true, 'Back']]} onChange={setFlipped} />
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {CONFIGS.map(c => <ConfigFrame key={`${c.id}-${idx}-${flipped}`} patch={c.patch} label={c.label} idx={idx} flipped={flipped} readingPos="below" />)}
        <ConfigFrame key={`above-${idx}-${flipped}`} patch={{}} label="Reading above (furigana)" idx={idx} flipped={flipped} readingPos="above" />
      </div>
      <Notes id="configs" label="2 · Sentence only, kanji only" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function feedbackMarkdown(notes) {
  const titles = { panel: '1 · The details panel', configs: '2 · Sentence only, kanji only', general: 'General' }
  const parts = Object.entries(titles).filter(([id]) => notes[id]?.trim()).map(([id, t]) => `## ${t}\n${notes[id].trim()}`)
  return `# Details panel v7 feedback\n\n${parts.join('\n\n')}\n`
}

export default function DetailsV7Lab() {
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
        <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design lab · iteration 7</span>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400 }}>Details panel</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>From your v6 notes:</p>
        <Bullets items={[
          'The reveal starts on the tap and ends just after the flip, both ways.',
          'Redaction bars are rounded on every corner.',
          'Sentence-only and kanji-only states, with the “at least one” rule in the drawer.',
          'Only one popover open at a time.',
          'The card: no drop shadow, and the reading under the word by default, with a setting to put it back above.',
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
      <ConfigsSection notes={notes} setNotes={setNotes} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40, borderTop: `1px solid ${BORDER}`, maxWidth: 1180 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Overall</h2>
        <Notes id="general" label="the direction overall" notes={notes} setNotes={setNotes} />
      </section>
    </div>
  )
}

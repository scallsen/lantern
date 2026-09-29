import { useState } from 'react'
import { FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND, BRAND_TEXT, FS_BASE } from '../../data/theme.js'
import { Frame } from './parts.jsx'
import { BandScreen, BandSample } from './bandV2.jsx'
import { Seg, Controls, WordPicker, Bullets } from './labChrome.jsx'
import './lab.css'
import { useConceptState, readFeedback, writeFeedback } from './labData.js'

const FEEDBACK_KEY = 'lab:drill-context:band-v2:feedback'

const BASE = {
  flipped: true, shown: true, tab: 'sentence', sentencePane: 'quiet', kanjiPane: 'lines',
  furigana: 'new', english: 'tap', sentenceAudio: true, kTok: null,
}

const SENTENCE_VARIANTS = [
  { id: 'quiet', tag: 'S1', name: 'Quiet row', note: 'The sentence, then one row of actions (audio, translation, example dots) at 45% until you point at the band. On a phone there is no hover, so they stay at 45%: visible, but they don\'t compete.' },
  { id: 'bare', tag: 'S2', name: 'Bare', note: 'Only the sentence. Audio plays by itself if that setting is on, and the translation is a setting (Always / Off), not a button. The only thing left to tap is the words themselves and the example dots.' },
]

const KANJI_VARIANTS = [
  { id: 'lines', tag: 'K1', name: 'Lines', note: 'One line per kanji: character, meaning, then the words it lives in as plain text. Words you know in ink, this lesson\'s in grey, capped at 3 + 3 with a count. Tap a word for its reading and meaning. No chips, no headings, no readings shown by default.' },
  { id: 'anatomy', tag: 'K2', name: 'Anatomy', note: 'The word taken apart: one column per kanji, sitting in the same order as the word on the card, each with up to three words it appears in. Reads as a breakdown of this word, not a reference list.' },
  { id: 'anchor', tag: 'K3', name: 'Anchor', note: 'One word per kanji, "期 period, as in 来学期". The anchor is the most familiar word you already know with it (earliest learned), or a word from this lesson for a new kanji. Everything else is only counted. The lightest of the three: one hook per kanji.' },
]

const DRILL_CONCEPT = {
  controls: [
    { key: 'tab', label: 'Tab', options: [['sentence', 'Sentence'], ['kanji', 'Kanji']] },
    { key: 'sentencePane', label: 'Sentence', options: SENTENCE_VARIANTS.map(v => [v.id, `${v.tag} ${v.name}`]) },
    { key: 'kanjiPane', label: 'Kanji', options: KANJI_VARIANTS.map(v => [v.id, `${v.tag} ${v.name}`]) },
    { key: 'shown', label: 'Band', options: [[true, 'Shown'], [false, 'Hidden']] },
  ],
}

const SETTINGS_CONCEPT = {
  controls: [{ key: 'shown', label: 'Band', options: [[true, 'Shown'], [false, 'Hidden']] }],
}

// ── Sections ──────────────────────────────────────────────────────────────

export function Section({ id, tag, title, children }) {
  return (
    <section id={id} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 40, borderTop: `1px solid ${BORDER}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 28, color: BRAND_TEXT }}>{tag}</span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function Notes({ id, label, notes, setNotes }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 1180 }}>
      <span style={{ fontSize: 12, color: TEXT_MUTED }}>Your notes on {label}</span>
      <textarea
        className="lab-feedback"
        value={notes[id] ?? ''}
        onChange={e => setNotes({ ...notes, [id]: e.target.value })}
        placeholder="Keep / drop / change…"
        rows={3}
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: '#252525', color: TEXT, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: '10px 12px', fontFamily: FONT, fontSize: 14, letterSpacing: TRACKING, lineHeight: 1.5 }}
      />
    </label>
  )
}

const P = { margin: 0, lineHeight: 1.6, fontSize: FS_BASE, maxWidth: 900 }

function DrillSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState(BASE)
  return (
    <Section id="band" tag="1" title="Band v2 in the drill">
      <p style={P}>Two tabs, Sentence and Kanji, as plain text tabs above the band. The card back is back to word, reading and meaning: the kanji tiles moved into the Kanji tab. <b>Hide [S]</b> sits at the band’s right edge; hidden, the band leaves a single dashed “Show sentence and kanji” line so it can always be brought back from the page. The band reserves its height while shown, so moving between cards never moves the buttons. Hiding and showing does, but only because you asked.</p>
      <Controls concept={DRILL_CONCEPT} s={s} u={u} />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><BandScreen mobile={false} s={s} u={u} /></Frame>
        <Frame device="phone" scale={0.8}><BandScreen mobile s={s} u={u} /></Frame>
      </div>
      <Notes id="band" label="1 · Band v2" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function VariantRows({ variants, kind, s, u }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {variants.map(v => (
        <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '240px auto auto', gap: 20, alignItems: 'start', justifyContent: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span><span style={{ color: BRAND_TEXT }}>{v.tag}</span> {v.name}</span>
            <span style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.55 }}>{v.note}</span>
          </div>
          <BandSample s={s} u={u} pane={{ kind, id: v.id }} />
          <BandSample s={s} u={u} pane={{ kind, id: v.id }} mobile />
        </div>
      ))}
    </div>
  )
}

function PaneSection({ id, tag, title, intro, variants, kind, notes, setNotes, defaults }) {
  const [s, u] = useConceptState({ ...BASE, ...defaults })
  const extra = kind === 'sentence'
    ? [{ key: 'english', label: 'Translation', options: [['tap', 'On tap'], ['show', 'Always'], ['hide', 'Off']] }, { key: 'furigana', label: 'Furigana', options: [['new', 'New words only'], ['all', 'All'], ['off', 'Off']] }]
    : []
  return (
    <Section id={id} tag={tag} title={title}>
      <p style={P}>{intro}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 8 }}>
        <WordPicker s={s} u={u} />
        {extra.length > 0 && (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {extra.map(c => <Seg key={c.key} label={c.label} value={s[c.key]} options={c.options} onChange={v => u({ [c.key]: v, enShown: false })} />)}
          </div>
        )}
      </div>
      <VariantRows variants={variants} kind={kind} s={s} u={u} />
      <Notes id={id} label={`${tag} · ${title}`} notes={notes} setNotes={setNotes} />
    </Section>
  )
}

export function Principle({ title, children }) {
  return (
    <div style={{ background: '#252525', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: TEXT }}>{children}</div>
    </div>
  )
}

function SettingsSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState(BASE)
  return (
    <Section id="settings" tag="4" title="Show/hide on the page, and the settings drawer">
      <p style={P}>The in-page toggle and the drawer should be one setting, not two. Here is how that plays out, including for things like sentence audio that only matter while the band is visible. The drawer on the right is built from the real settings components. Flip either toggle and watch the other.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, maxWidth: 1180 }}>
        <Principle title="One setting, two handles">Hide/Show under the card <i>is</i> the drawer’s “Show under card” switch. Either one updates both, and it’s remembered like every other drill setting. There is no session-only state to explain.</Principle>
        <Principle title="The tab you leave is where it opens">Switching tabs on the page sets “Open on”. A kanji person stays on Kanji across cards and sessions without visiting the drawer.</Principle>
        <Principle title="Dependent settings follow the drawer's existing rule">The drawer already hides a row that doesn’t apply (no Voice row without recordings) rather than disabling it or explaining it. So while the band is hidden, Furigana, Translation and Play after the word disappear. They come back with their old values.</Principle>
        <Principle title="Hidden means silent">If the band is hidden, the sentence isn’t part of the drill, so its audio doesn’t play either. What you see is what you hear. If listening-only practice turns out to be wanted, it should be its own explicit option, not a side effect of hiding the band.</Principle>
        <Principle title="The card back loses two switches">“Sentence” and “Kanji breakdown” under Card back go away: the band replaces both. “Meaning” and the word “Audio” stay, because they are about the card.</Principle>
        <Principle title="Keyboard and first run">S shows and hides, like Z/X for the verdicts. The band starts shown on the Sentence tab, since sentences are the point. Hiding it is one tap for anyone who wants a pure speed drill.</Principle>
      </div>
      <Controls concept={SETTINGS_CONCEPT} s={s} u={u} />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><BandScreen mobile={false} s={s} u={u} sidebar /></Frame>
        <Frame device="phone" scale={0.8}><BandScreen mobile s={s} u={u} /></Frame>
      </div>
      <Notes id="settings" label="4 · Show/hide and settings" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function feedbackMarkdown(notes) {
  const titles = { band: '1 · Band v2', sentence: '2 · Sentence tab', kanji: '3 · Kanji tab', settings: '4 · Show/hide and settings', general: 'General' }
  const parts = Object.entries(titles).filter(([id]) => notes[id]?.trim()).map(([id, t]) => `## ${t}\n${notes[id].trim()}`)
  return `# Context band v2 feedback\n\n${parts.join('\n\n')}\n`
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ContextBandLab() {
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
        <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design lab · iteration 2</span>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400 }}>Context band</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>Concept C from the first lab, reworked from your notes:</p>
        <Bullets items={[
          'Two tabs only: Sentence and Kanji.',
          'The sentence comes first and largest. Everything else is muted (S1) or gone (S2).',
          'The kanji panel\'s chip wall is replaced by three lighter views to compare (K1–K3).',
          'The band shows and hides on the page, and section 4 works through what that means for the settings drawer.',
        ]} />
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {[['band', '1 Band v2'], ['sentence', '2 Sentence tab'], ['kanji', '3 Kanji tab'], ['settings', '4 Show/hide and settings']].map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }} className="lab-ctl" style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 6, padding: '4px 10px', color: TEXT, textDecoration: 'none', fontSize: 13 }}>{label}</a>
          ))}
        </nav>
      </header>

      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(30,30,30,0.94)', padding: '10px 0', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` }}>
        <Seg label="Desktop frame" value={scale} options={[[0.5, '50%'], [0.6, '60%'], [0.8, '80%'], [1, '100%']]} onChange={setScale} />
        <span style={{ fontSize: 12, color: TEXT_MUTED }}>Sections 2 and 3 show the band at 1:1.</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="lab-ctl" onClick={copy} style={{ border: `1px solid ${BRAND}`, background: 'transparent', color: TEXT, borderRadius: 6, padding: '6px 12px', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING }}>
          {copied ? 'Copied' : 'Copy all notes as Markdown'}
        </button>
      </div>

      <DrillSection scale={scale} notes={notes} setNotes={setNotes} />
      <PaneSection
        id="sentence" tag="2" title="Sentence tab: how quiet?" kind="sentence" variants={SENTENCE_VARIANTS} notes={notes} setNotes={setNotes}
        intro="The sentence is set at 27px (21px on a phone), larger than any other text on the screen except the word itself. Words stay tappable in both, since that's the one interaction that's about the sentence itself."
      />
      <PaneSection
        id="kanji" tag="3" title="Kanji tab: three lighter views" kind="kanji" variants={KANJI_VARIANTS} notes={notes} setNotes={setNotes} defaults={{ idx: 2 }}
        intro="The v1 panel showed everything at once: big glyph, readings, three chip groups. All three of these drop the chips and the readings (tap a word to get its reading) and differ in how much they show. Try 期間 (a new kanji rich in this lesson), 気温 (an old kanji you know many words for) and 賞味期限 (four kanji)."
      />
      <SettingsSection scale={scale} notes={notes} setNotes={setNotes} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40, borderTop: `1px solid ${BORDER}`, maxWidth: 1180 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Overall</h2>
        <Notes id="general" label="the direction overall" notes={notes} setNotes={setNotes} />
      </section>
    </div>
  )
}

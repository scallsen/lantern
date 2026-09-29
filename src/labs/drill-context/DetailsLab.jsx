import { useState } from 'react'
import { FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND, BRAND_TEXT } from '../../data/theme.js'
import { Frame } from './parts.jsx'
import { BandScreen, BandSample } from './bandV2.jsx'
import { Seg, Controls, WordPicker, Bullets } from './labChrome.jsx'
import { Section, Notes, Principle } from './ContextBandLab.jsx'

const P = { margin: 0, lineHeight: 1.6, fontSize: 15, maxWidth: 900 }
import './lab.css'
import { useConceptState, readFeedback, writeFeedback } from './labData.js'

const FEEDBACK_KEY = 'lab:drill-context:details-v3:feedback'

const BASE = {
  flipped: true, shown: true, tab: 'sentence', sentencePane: 'single', kanjiPane: 'lines',
  bar: 'inset', label: 'details', furigana: 'new', english: 'hide', sentenceAudio: true, kTok: null,
}

const BARS = [
  { id: 'underline', tag: 'B1', name: 'Underline (v2)', note: 'Text tabs above the paper with an accent underline, Hide on the right. For reference: this is the one you weren\'t sold on.' },
  { id: 'segmented', tag: 'B2', name: 'Segmented', note: 'A compact two-way switch. The active half is paper-coloured, so it reads as "this is what\'s on the paper below". It\'s the most obviously a control of the four.' },
  { id: 'inset', tag: 'B3', name: 'Inset header', note: 'The bar moves onto the paper as its header, so there\'s one object instead of a label row plus a card. Hide becomes a chevron in the corner, and the dark gap above the panel disappears.' },
  { id: 'footer', tag: 'B4', name: 'Footer', note: 'Sentence first, literally: the paper opens with the sentence, and the tabs and chevron sit along the bottom edge, nearest the verdict buttons. The quietest, and the easiest to miss.' },
]

const LABEL = { key: 'label', label: 'Name', options: [['details', 'Details'], ['more', 'More']] }

const DRILL_CONCEPT = {
  controls: [
    { key: 'bar', label: 'Bar', options: BARS.map(b => [b.id, `${b.tag} ${b.name.replace(' (v2)', '')}`]) },
    { key: 'tab', label: 'Tab', options: [['sentence', 'Sentence'], ['kanji', 'Kanji']] },
    { key: 'kanjiPane', label: 'Kanji', options: [['lines', 'K1 Lines'], ['anatomy', 'K2 Anatomy'], ['anchor', 'K3 Anchor']] },
    { key: 'english', label: 'Translation', options: [['show', 'Always'], ['hide', 'Off']] },
    { key: 'shown', label: 'Details', options: [[true, 'Shown'], [false, 'Hidden']] },
  ],
}

const SETTINGS_CONCEPT = {
  controls: [LABEL, { key: 'shown', label: 'Details', options: [[true, 'Shown'], [false, 'Hidden']] }],
}

function BarSection({ notes, setNotes }) {
  const [s, u] = useConceptState(BASE)
  return (
    <Section id="bar" tag="1" title="The bar: four ways">
      <p style={P}>Each option keeps one bar holding both tabs and the hide action, and differs in where the bar sits and how much it looks like a control. The sentence pane is the new single-sentence one throughout. Switch the tab to see each bar over the Kanji view.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 8 }}>
        <WordPicker s={s} u={u} />
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Seg label="Tab" value={s.tab} options={[['sentence', 'Sentence'], ['kanji', 'Kanji']]} onChange={v => u({ tab: v })} />
          <Seg label="Translation" value={s.english} options={[['show', 'Always'], ['hide', 'Off']]} onChange={v => u({ english: v })} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {BARS.map(b => (
          <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '240px auto auto', gap: 20, alignItems: 'start', justifyContent: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span><span style={{ color: BRAND_TEXT }}>{b.tag}</span> {b.name}</span>
              <span style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.55 }}>{b.note}</span>
            </div>
            <BandSample s={s} u={u} override={{ bar: b.id }} />
            <BandSample s={s} u={u} override={{ bar: b.id }} mobile />
          </div>
        ))}
      </div>
      <Notes id="bar" label="1 · The bar" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function DrillSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState(BASE)
  return (
    <Section id="drill" tag="2" title="In the drill">
      <p style={P}>The same panel under the card, with everything switchable. The sentence is one sentence with one muted speaker: the pager is gone, and so is the translation button (translation is now a setting, Always or Off, starting Off). The kanji view stays switchable, since there were no notes on it yet. K1 is the default.</p>
      <Controls concept={DRILL_CONCEPT} s={s} u={u} />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><BandScreen mobile={false} s={s} u={u} /></Frame>
        <Frame device="phone" scale={0.8}><BandScreen mobile s={s} u={u} /></Frame>
      </div>
      <Notes id="drill" label="2 · In the drill" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function SettingsSection({ scale, notes, setNotes }) {
  const [s, u] = useConceptState(BASE)
  return (
    <Section id="settings" tag="3" title="Details, in the page and the drawer">
      <p style={P}>Renamed from “sentence and kanji” to something that can grow: the collapsed control reads <b>Show details</b>, and the drawer group is <b>Details</b>. The rules from v2 stand: one setting with two handles, the rows under it disappear while details are hidden, and hidden means the sentence audio doesn’t play. Switch “Name” to compare it with “Show more”.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, maxWidth: 1180 }}>
        <Principle title={"Why \"details\" over \"more\""}>“Show more” suggests a longer version of the same thing, like more of the card. “Details” says it’s extra information about this card, which is what the panel is. It also still fits if a third tab lands later (grammar, audio).</Principle>
        <Principle title="The tab names stay specific">Only the container is general. Inside it, Sentence and Kanji keep their own names, and the drawer’s rows say what they change (“Play sentence after word”), not “details audio”.</Principle>
      </div>
      <Controls concept={SETTINGS_CONCEPT} s={s} u={u} />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><BandScreen mobile={false} s={s} u={u} sidebar /></Frame>
        <Frame device="phone" scale={0.8}><BandScreen mobile s={s} u={u} /></Frame>
      </div>
      <Notes id="settings" label="3 · Details, in the page and the drawer" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function feedbackMarkdown(notes) {
  const titles = { bar: '1 · The bar', drill: '2 · In the drill', settings: '3 · Details naming and drawer', general: 'General' }
  const parts = Object.entries(titles).filter(([id]) => notes[id]?.trim()).map(([id, t]) => `## ${t}\n${notes[id].trim()}`)
  return `# Details panel v3 feedback\n\n${parts.join('\n\n')}\n`
}

export default function DetailsLab() {
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
        <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design lab · iteration 3</span>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400 }}>Details panel</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>The context band, from your v2 notes:</p>
        <Bullets items={[
          'Four designs for the one bar that holds the tabs and the hide action (B1–B4).',
          'Sentence: one sentence, one muted speaker icon to replay it. No pager, no translation button.',
          'Renamed to Details: "Show details" on the page, a Details group in the drawer.',
        ]} />
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {[['bar', '1 The bar'], ['drill', '2 In the drill'], ['settings', '3 Details and the drawer']].map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }} className="lab-ctl" style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 6, padding: '4px 10px', color: TEXT, textDecoration: 'none', fontSize: 13 }}>{label}</a>
          ))}
        </nav>
      </header>

      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(30,30,30,0.94)', padding: '10px 0', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` }}>
        <Seg label="Desktop frame" value={scale} options={[[0.5, '50%'], [0.6, '60%'], [0.8, '80%'], [1, '100%']]} onChange={setScale} />
        <span style={{ flex: 1 }} />
        <button type="button" className="lab-ctl" onClick={copy} style={{ border: `1px solid ${BRAND}`, background: 'transparent', color: TEXT, borderRadius: 6, padding: '6px 12px', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING }}>
          {copied ? 'Copied' : 'Copy all notes as Markdown'}
        </button>
      </div>

      <BarSection notes={notes} setNotes={setNotes} />
      <DrillSection scale={scale} notes={notes} setNotes={setNotes} />
      <SettingsSection scale={scale} notes={notes} setNotes={setNotes} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40, borderTop: `1px solid ${BORDER}`, maxWidth: 1180 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Overall</h2>
        <Notes id="general" label="the direction overall" notes={notes} setNotes={setNotes} />
      </section>
    </div>
  )
}

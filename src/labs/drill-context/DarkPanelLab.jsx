import { useState } from 'react'
import { FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND } from '../../data/theme.js'
import FlipCard from '../../FlipCard.jsx'
import Japanese from '../../components/Japanese.jsx'
import CardDetails from '../../components/CardDetails.jsx'
import CardWord from '../../components/CardWord.jsx'
import { DRILL_SETTINGS_DEFAULTS } from '../../hooks/useDrillSettings.js'
import { Frame, DrillScreen, VerdictRow } from './parts.jsx'
import { DrillStack } from './concepts.jsx'
import { Seg, Bullets } from './labChrome.jsx'
import { Section, Notes, Principle } from './ContextBandLab.jsx'
import { readFeedback, writeFeedback } from './labData.js'
import { VARIANTS } from './darkPalettes.js'
import fixtures from './darkFixtures.json'
import { WORDS, KNOWN_IDS, useLabDrill } from './labDrill.js'
import './lab.css'

// Dark details panel: the real CardDetails (the shipped component, fed frozen
// data) under a paper card, in several dark palettes. The product keeps the
// paper panel until one of these is chosen.

const FEEDBACK_KEY = 'lab:drill-context:dark-panel:feedback'
const P = { margin: 0, lineHeight: 1.6, fontSize: 15, maxWidth: 900 }
const JA_FONT = 'system-ui, sans-serif'

function Face({ word, back, readingPosition }) {
  return (
    <div style={{ background: '#E8E4DE', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5cqw', padding: '0 16px', boxSizing: 'border-box' }}>
      <CardWord form={word.form} reading={word.reading} showReading={back} readingPosition={readingPosition} jaFont={JA_FONT} />
      {back && <div style={{ fontFamily: FONT, fontSize: '5.26cqw', letterSpacing: '0.04em', color: '#555', textAlign: 'center' }}>{word.gloss}</div>}
    </div>
  )
}

function Stage({ variant, mobile, s, u, next }) {
  const word = WORDS[s.idx]
  const settings = { ...DRILL_SETTINGS_DEFAULTS, details: s.details, sentenceFurigana: s.sentenceFurigana, sentenceTranslation: s.sentenceTranslation, readingPosition: s.readingPosition, detailsTheme: variant.palette ? 'dark' : 'light' }
  return (
    <DrillScreen mobile={mobile}>
      {/* The drill's scroll area is the size container the card and panel
          measure against (cqw), as in the app; on a phone it runs past the
          screen's 16px padding so both go edge to edge. */}
      <div style={{ alignSelf: 'stretch', margin: mobile ? '0 -16px' : 0, containerType: 'inline-size', display: 'flex', justifyContent: 'center' }}>
        <DrillStack mobile={mobile}>
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
          <CardDetails
            cardKey={word.id}
            word={{ form: word.form, reading: word.reading }}
            sentence={word.sentence}
            settings={settings}
            knownIds={KNOWN_IDS}
            related={fixtures.related}
            revealed={s.flipped}
            leaving={s.leaving}
            mobile={mobile}
            jaFont={JA_FONT}
            palette={variant.palette}
            kanjiMeanings={word.meanings}
            onChangeSetting={(key, value) => { if (key === 'details') u({ details: value }) }}
            onPlaySentence={() => {}}
          />
          <VerdictRow flipped={s.flipped} width={mobile ? 358 : 380} mobile={mobile} onVerdict={next} />
        </DrillStack>
      </div>
    </DrillScreen>
  )
}

function Overview({ s, u, next, notes, setNotes }) {
  return (
    <Section id="overview" tag="0" title="All five, side by side">
      <p style={P}>Phones at 55%, sharing one drill: flip or answer in any of them and they all follow. Use the bar above to change the word, the side, and the sentence settings, or turn on Auto to watch the transitions loop.</p>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {VARIANTS.map(v => (
          <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 13 }}>{v.name}</span>
            <Frame device="phone" scale={0.55}><Stage variant={v} mobile s={s} u={u} next={next} /></Frame>
          </div>
        ))}
      </div>
      <Notes id="overview" label="the set as a whole" notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function VariantSection({ variant, index, scale, s, u, next, notes, setNotes }) {
  return (
    <Section id={variant.id} tag={String(index)} title={variant.name}>
      <p style={P}>{variant.summary}</p>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={scale}><Stage variant={variant} mobile={false} s={s} u={u} next={next} /></Frame>
        <Frame device="phone" scale={0.8}><Stage variant={variant} mobile s={s} u={u} next={next} /></Frame>
      </div>
      <Notes id={variant.id} label={variant.name} notes={notes} setNotes={setNotes} />
    </Section>
  )
}

function feedbackMarkdown(notes) {
  const titles = { overview: '0 · All five', ...Object.fromEntries(VARIANTS.map((v, i) => [v.id, `${i + 1} · ${v.name}`])), general: 'General' }
  const parts = Object.entries(titles).filter(([id]) => notes[id]?.trim()).map(([id, t]) => `## ${t}\n${notes[id].trim()}`)
  return `# Dark details panel feedback\n\n${parts.join('\n\n')}\n`
}

export default function DarkPanelLab() {
  const [scale, setScale] = useState(0.6)
  const [s, u, next] = useLabDrill()
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
        <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design lab · details panel, dark</span>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400 }}>A dark details panel</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>Keeping light for the card above, the one thing being tested, and letting the panel under it recede. Every frame here is the shipped panel component with its colours swapped, so the behaviour is real:</p>
        <Bullets items={[
          'The redaction, the fade on the flip, and the fade as a card leaves and the next arrives.',
          'Tappable words, the blurred translation, and the kanji tiles’ word lists, one popover at a time.',
          'The product still uses the paper panel. Nothing here changes it until you pick one.',
        ]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 4 }}>
          <Principle title="What stays fixed">Layout, spacing, type and timing are the shipped panel’s. Only colour, border and shadow change, so the comparison is only about tone.</Principle>
          <Principle title="What to look at">Whether the card still reads as the thing to answer, whether the sentence stays easy to read at a glance, and whether the redaction bars feel like placeholders rather than content.</Principle>
        </div>
      </header>

      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(30,30,30,0.94)', padding: '10px 0', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` }}>
        <Seg label="Word" value={s.idx} options={WORDS.map((w, i) => [i, <Japanese key={w.id}>{w.form}</Japanese>])} onChange={idx => u({ idx, flipped: false })} />
        <Seg label="Side" value={s.flipped} options={[[false, 'Front'], [true, 'Back']]} onChange={flipped => u({ flipped })} />
        <Seg label="Furigana" value={s.sentenceFurigana} options={[['off', 'Off'], ['new', 'New'], ['all', 'All']]} onChange={v => u({ sentenceFurigana: v })} />
        <Seg label="Translation" value={s.sentenceTranslation} options={[['off', 'Off'], ['blur', 'Blurred'], ['on', 'On']]} onChange={v => u({ sentenceTranslation: v })} />
        <Seg label="Reading" value={s.readingPosition} options={[['below', 'Below'], ['above', 'Above']]} onChange={v => u({ readingPosition: v })} />
        <Seg label="Auto" value={s.auto} options={[[false, 'Off'], [true, 'On']]} onChange={auto => u({ auto })} />
        <Seg label="Desktop frame" value={scale} options={[[0.5, '50%'], [0.6, '60%'], [0.8, '80%']]} onChange={setScale} />
        <span style={{ flex: 1 }} />
        <button type="button" className="lab-ctl" onClick={copy} style={{ border: `1px solid ${BRAND}`, background: 'transparent', color: TEXT, borderRadius: 6, padding: '6px 12px', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING }}>
          {copied ? 'Copied' : 'Copy all notes as Markdown'}
        </button>
      </div>

      <Overview s={s} u={u} next={next} notes={notes} setNotes={setNotes} />
      {VARIANTS.map((v, i) => (
        <VariantSection key={v.id} variant={v} index={i + 1} scale={scale} s={s} u={u} next={next} notes={notes} setNotes={setNotes} />
      ))}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40, borderTop: `1px solid ${BORDER}`, maxWidth: 1180 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Overall</h2>
        <Notes id="general" label="the direction overall" notes={notes} setNotes={setNotes} />
      </section>
    </div>
  )
}

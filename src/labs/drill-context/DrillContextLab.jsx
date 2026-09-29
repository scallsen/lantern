import { useState } from 'react'
import Japanese from '../../components/Japanese.jsx'
import { FONT, KANJI_FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND, BRAND_TEXT, FS_BASE } from '../../data/theme.js'
import { Frame, SentenceText } from './parts.jsx'
import './lab.css'
import { Seg, Controls, FeedbackBox, Bullets } from './labChrome.jsx'
import { WORDS, KANJI, CHAPTER, useConceptState, readFeedback, writeFeedback } from './labData.js'
import { CONCEPTS } from './conceptList.js'

const FEEDBACK_KEY = 'lab:drill-context:feedback'


function feedbackMarkdown(notes) {
  const parts = CONCEPTS.filter(c => notes[c.id]?.trim()).map(c => `## ${c.tag} · ${c.name}\n${notes[c.id].trim()}`)
  if (notes.general?.trim()) parts.push(`## General\n${notes.general.trim()}`)
  return `# Drill context lab feedback\n\n${parts.join('\n\n')}\n`
}

function ConceptSection({ concept, desktopScale, notes, setNotes }) {
  const [s, u] = useConceptState(concept.defaults)
  const { Screen } = concept
  return (
    <section id={`concept-${concept.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 40, borderTop: `1px solid ${BORDER}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 28, color: concept.tag === '0' ? TEXT_MUTED : BRAND_TEXT }}>{concept.tag}</span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>{concept.name}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 32, maxWidth: 1180 }}>
        <p style={{ margin: 0, lineHeight: 1.6, fontSize: FS_BASE }}>{concept.pitch}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
          {concept.lookFor.length > 0 && <div><div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 4 }}>TRY</div><Bullets items={concept.lookFor} /></div>}
          {concept.risks.length > 0 && <div><div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 4 }}>RISKS</div><Bullets items={concept.risks} color={TEXT_MUTED} /></div>}
        </div>
      </div>
      <Controls concept={concept} s={s} u={u} />
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Frame device="desktop" scale={desktopScale}><Screen mobile={false} s={s} u={u} /></Frame>
        <Frame device="phone" scale={0.8}><Screen mobile s={s} u={u} /></Frame>
      </div>
      <div style={{ maxWidth: 1180 }}>
        <FeedbackBox concept={concept} notes={notes} setNotes={setNotes} />
      </div>
    </section>
  )
}

function tokenStats() {
  const counts = { known: 0, lesson: 0, new: 0 }
  for (const w of WORDS) for (const sen of w.sentences) for (const t of sen.tokens) if (t.status in counts) counts[t.status]++
  const total = counts.known + counts.lesson + counts.new
  return { ...counts, total, sentences: WORDS.reduce((n, w) => n + w.sentences.length, 0) }
}

function Findings() {
  const st = tokenStats()
  const pct = n => `${Math.round(n / st.total * 100)}%`
  const noKnown = Object.entries(KANJI).filter(([, k]) => k.known.length === 0).map(([ch]) => ch)
  const legendSentence = WORDS[1].sentences[0]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, maxWidth: 1180 }}>
      <Card title="Test set">
        <p style={P}>9 words from <b>{CHAPTER.book} · {CHAPTER.label}</b> ({CHAPTER.wordCount} words in the lesson). The learner is assumed to know {CHAPTER.learnedFrom}: 1,380 words. The sentences are the real Tanaka picks the app would make (recommended first, then shortest, up to 3), tokenized offline with kuromoji and frozen into <code>fixtures.json</code>.</p>
      </Card>
      <Card title="Furigana by what you know is feasible">
        <p style={P}>Across {st.sentences} sentences, {st.total} content words: <span style={{ color: '#4ade80' }}>{pct(st.known)} known</span>, <span style={{ color: '#fbbf24' }}>{pct(st.lesson)} in this lesson</span>, {pct(st.new)} new. Matching kuromoji’s dictionary form against the learned list is enough to drive “furigana on new words only”. It’s rough: it misses conjugated compounds, but it’s usable.</p>
        <div style={{ background: '#E8E4DE', borderRadius: 6, padding: '6px 12px', marginTop: 8 }}>
          <SentenceText sentence={legendSentence} furigana="new" target="reveal" size={18} />
        </div>
        <p style={{ ...P, fontSize: 12, color: TEXT_MUTED, marginTop: 6 }}>Red: this card. Yellow underline: in this lesson. Furigana: not yet learned.</p>
      </Card>
      <Card title="Sentences don't always contain the word">
        <p style={P}>All three sentences for <Japanese style={JA}>温かい</Japanese> write <Japanese style={JA}>暖かい</Japanese>. The lookup matches by dictionary entry, and one entry covers both spellings. Today that’s invisible because nothing is highlighted. Every concept that marks or blanks the word needs a fallback. The Tanaka index records the exact form used, which the import currently throws away.</p>
      </Card>
      <Card title="Sentences can teach a different sense">
        <p style={P}><Japanese style={JA}>限る</Japanese> is taught as “to restrict; to limit”, but all of its top sentences are the grammar pattern <Japanese style={JA}>とは限らない</Japanese> (“not necessarily”). And <Japanese style={JA}>賞味期限</Japanese> has exactly one sentence. A bigger sentence display makes weak picks more visible, so picking may matter as much as layout.</p>
      </Card>
      <Card title="At N3, the lesson is the kanji link">
        <p style={P}>{noKnown.map(ch => <Japanese key={ch} style={JA}>{ch}</Japanese>)} have <b>no</b> words among the 1,380 learned. The connection comes from the lesson itself: So-Matome groups words by kanji. <Japanese style={JA}>期</Japanese> appears in 6 of this lesson’s words, <Japanese style={JA}>費</Japanese> in 4. “Also in this lesson” is the row that carries the idea for new kanji. “Words you know” carries it for old ones (<Japanese style={JA}>気</Japanese>, <Japanese style={JA}>間</Japanese>).</p>
      </Card>
    </div>
  )
}

const P = { margin: 0, lineHeight: 1.6, fontSize: 14 }
const JA = { fontFamily: KANJI_FONT, fontSize: 16, margin: '0 2px' }

function Card({ title, children }) {
  return (
    <div style={{ background: '#252525', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 15 }}>{title}</div>
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function DrillContextLab() {
  const [desktopScale, setDesktopScale] = useState(0.6)
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
        <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design lab · drill-card-redesign</span>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400 }}>Drill card context</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          The drill card holds the word, furigana, meaning, an example sentence and kanji meanings in one fixed 380×280 box, and every extra row shrinks the others. Sentences are one of the best memory hooks, and sentence audio is on its way. These are directions for giving the sentence (and the kanji behind the word) real room, in the Vocab Drill first and the SRS review after. Every frame is live: flip, answer, tap words, page sentences.
        </p>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {CONCEPTS.map(c => (
            <a key={c.id} href={`#concept-${c.id}`} onClick={e => { e.preventDefault(); document.getElementById(`concept-${c.id}`)?.scrollIntoView({ behavior: 'smooth' }) }} className="lab-ctl" style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 6, padding: '4px 10px', color: TEXT, textDecoration: 'none', fontSize: 13 }}>
              <span style={{ color: c.tag === '0' ? TEXT_MUTED : BRAND_TEXT }}>{c.tag}</span> {c.name}
            </a>
          ))}
        </nav>
      </header>

      <Findings />

      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(30,30,30,0.94)', padding: '10px 0', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` }}>
        <Seg label="Desktop frame" value={desktopScale} options={[[0.5, '50%'], [0.6, '60%'], [0.8, '80%'], [1, '100%']]} onChange={setDesktopScale} />
        <span style={{ fontSize: 12, color: TEXT_MUTED }}>Phone frame at 80%. Each concept also has its own 1:1 story in the sidebar.</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="lab-ctl" onClick={copy} style={{ border: `1px solid ${BRAND}`, background: 'transparent', color: TEXT, borderRadius: 6, padding: '6px 12px', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING }}>
          {copied ? 'Copied' : 'Copy all notes as Markdown'}
        </button>
      </div>

      {CONCEPTS.map(c => <ConceptSection key={c.id} concept={c} desktopScale={desktopScale} notes={notes} setNotes={setNotes} />)}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 40, borderTop: `1px solid ${BORDER}`, maxWidth: 1180 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Overall</h2>
        <p style={{ ...P, color: TEXT_MUTED }}>Direction, combinations (e.g. C in the drill, F for SRS review), anything missing. Notes are saved in this browser. “Copy all notes” gives you one Markdown block to paste back to Claude.</p>
        <textarea
          className="lab-feedback"
          value={notes.general ?? ''}
          onChange={e => setNotes({ ...notes, general: e.target.value })}
          rows={5}
          style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: '#252525', color: TEXT, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: '10px 12px', fontFamily: FONT, fontSize: 14, letterSpacing: TRACKING, lineHeight: 1.5 }}
        />
      </section>
    </div>
  )
}

// One concept at 1:1 in a single device frame, for its own story.
export function ConceptPlayground({ conceptId, device }) {
  const concept = CONCEPTS.find(c => c.id === conceptId)
  const [s, u] = useConceptState(concept.defaults)
  const { Screen } = concept
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: FONT, letterSpacing: TRACKING, color: TEXT }}>
      <Controls concept={concept} s={s} u={u} />
      <Frame device={device}><Screen mobile={device === 'phone'} s={s} u={u} /></Frame>
    </div>
  )
}

// Context band, iteration 2: two tabs (Sentence, Kanji), sentence-first,
// lighter kanji views, and a band that shows/hides in place — kept in sync
// with a mock of the settings sidebar.
import { useState } from 'react'
import Japanese from '../../components/Japanese.jsx'
import Switch from '../../components/Switch.jsx'
import Select from '../../components/Select.jsx'
import ChipSelector from '../../components/Chip.jsx'
import FilterCard from '../../components/FilterCard.jsx'
import { Row } from '../../components/DrillSettingsPanel.jsx'
import { FONT, KANJI_FONT, TEXT, TEXT_MUTED, BORDER, BRAND, SUBHEADING_STYLE, FS_BASE } from '../../data/theme.js'
import { PAPER, INK, PaperCard, SentenceText, SpellingNote, IconBtn, TokenPopover, DrillScreen, VerdictRow } from './parts.jsx'
import { DrillStack, FrontWord, BackWord } from './concepts.jsx'
import { KANJI, familyOf, cardWidth, current, actions } from './labData.js'

export const BAND_W = 680

const SHARED_RED = '#c4003d'
const SHARED_RED_SOFT = '#d9829c'
const QUIET_INK = '#8a8a8a'

// ── Shared bits ───────────────────────────────────────────────────────────

function Dots({ count, index, onChange }) {
  if (count <= 1) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          title={`Example ${i + 1}`}
          className="lab-dot"
          onClick={e => { e.stopPropagation(); onChange(i) }}
          style={{ border: 'none', background: 'transparent', padding: '6px 4px', display: 'inline-flex' }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: i === index ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.18)' }} />
        </button>
      ))}
    </span>
  )
}

// A word that shares the kanji, the shared character picked out. Tap for its
// reading and meaning, the same popover the sentence's words use.
export function KanjiWord({ v, ch, size = 16, tone = INK, s, u }) {
  const id = `${ch}:${v.form}`
  const open = s.kTok === id
  return (
    <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
      <Japanese
        className="lab-kword"
        onClick={e => { e.stopPropagation(); u({ kTok: open ? null : id }) }}
        style={{ fontFamily: KANJI_FONT, fontSize: size, color: tone, padding: '0 1px' }}
      >
        {[...v.form].map((c, i) => <span key={i} style={c === ch ? { color: tone === INK ? SHARED_RED : SHARED_RED_SOFT } : undefined}>{c}</span>)}
      </Japanese>
      {open && <TokenPopover token={{ base: v.form, r: v.reading, g: v.gloss, status: v.tag, src: v.source }} />}
    </span>
  )
}


// ── Sentence panes ────────────────────────────────────────────────────────

function Translation({ sentence, s, mobile }) {
  if (s.english === 'hide') return null
  const shown = s.english === 'show' || s.enShown
  if (!shown) return null
  return <div className="lab-fade-up" style={{ fontFamily: FONT, fontSize: mobile ? 13 : 14, color: '#777', lineHeight: 1.5 }}>{sentence.english}</div>
}

// Quiet: the sentence, then one row of actions at 45% until the band is hovered.
function SentenceQuiet({ s, u, mobile }) {
  const { sentences, sentence } = current(s)
  return (
    <div style={{ padding: mobile ? '14px 16px 8px' : '18px 24px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SentenceText sentence={sentence} furigana={s.furigana} target="reveal" size={mobile ? 21 : 27} active={s.tok} onTap={i => u({ tok: i })} lineHeight={2} />
      {!sentence.containsForm && <SpellingNote />}
      <Translation sentence={sentence} s={s} mobile={mobile} />
      <div className="lab-quiet" style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: -8, marginTop: 2 }}>
        <IconBtn title="Play sentence audio">▶</IconBtn>
        {s.english === 'tap' && (
          <IconBtn title="Show translation" active={s.enShown} onClick={() => u(p => ({ enShown: !p.enShown }))}>Translation</IconBtn>
        )}
        <span style={{ flex: 1 }} />
        <Dots count={sentences.length} index={s.sIdx % sentences.length} onChange={i => u({ sIdx: i, tok: null, enShown: false })} />
      </div>
    </div>
  )
}

// Bare: nothing but the sentence. Audio plays by itself (a setting), the
// translation is a setting, and the only affordance left is the dots.
function SentenceBare({ s, u, mobile }) {
  const { sentences, sentence } = current(s)
  const shownEnglish = s.english === 'show'
  return (
    <div style={{ position: 'relative', padding: mobile ? '16px 16px 14px' : '20px 24px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SentenceText sentence={sentence} furigana={s.furigana} target="reveal" size={mobile ? 21 : 27} active={s.tok} onTap={i => u({ tok: i })} lineHeight={2} />
      {!sentence.containsForm && <SpellingNote />}
      {shownEnglish && <div style={{ fontFamily: FONT, fontSize: mobile ? 13 : 14, color: '#777', lineHeight: 1.5 }}>{sentence.english}</div>}
      {sentences.length > 1 && (
        <div className="lab-quiet" style={{ position: 'absolute', right: mobile ? 8 : 14, bottom: 4 }}>
          <Dots count={sentences.length} index={s.sIdx % sentences.length} onChange={i => u({ sIdx: i, tok: null, enShown: false })} />
        </div>
      )}
    </div>
  )
}

export function SpeakerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M2 7 H5 L9 3.5 V14.5 L5 11 H2 Z" fill="currentColor" />
      <path d="M12 6.2 Q14 9 12 11.8 M14.2 4.2 Q17.6 9 14.2 13.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// One sentence, one quiet speaker. No pager, no translation button — the
// translation is a setting (Always / Off).
function SentenceSingle({ s, u, mobile }) {
  const { word } = current(s)
  const sentence = word.sentences[0]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: mobile ? '14px 8px 14px 16px' : '18px 14px 16px 24px' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SentenceText sentence={sentence} furigana={s.furigana} target="reveal" size={mobile ? 21 : 27} active={s.tok} onTap={i => u({ tok: i })} lineHeight={2} />
        {!sentence.containsForm && <SpellingNote />}
        {s.english === 'show' && <div style={{ fontFamily: FONT, fontSize: mobile ? 13 : 14, color: '#777', lineHeight: 1.5 }}>{sentence.english}</div>}
      </div>
      <button type="button" title="Play sentence" className="lab-speaker" onClick={e => e.stopPropagation()} style={{
        flexShrink: 0, width: 34, height: 34, marginTop: mobile ? 12 : 16, border: 'none', borderRadius: 8,
        background: 'transparent', color: '#555', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <SpeakerIcon />
      </button>
    </div>
  )
}

const SENTENCE_PANES = { quiet: SentenceQuiet, bare: SentenceBare, single: SentenceSingle }

// ── Kanji panes ───────────────────────────────────────────────────────────

// Lines: one text line per kanji. Words you know in ink, this lesson's in grey.
function KanjiLines({ s, u, mobile }) {
  const { word, chars } = current(s)
  const cap = mobile ? 2 : 3
  return (
    <div style={{ padding: mobile ? '12px 16px' : '14px 24px', display: 'flex', flexDirection: 'column', gap: mobile ? 10 : 8 }}>
      {chars.map(ch => {
        const { known, lesson } = familyOf(ch, word)
        const words = [...known.slice(0, cap), ...lesson.slice(0, cap)]
        const more = known.length + lesson.length - words.length
        return (
          <div key={ch} style={{ display: 'grid', gridTemplateColumns: mobile ? '30px minmax(0,1fr)' : '30px 110px minmax(0,1fr)', alignItems: 'baseline', columnGap: 12, rowGap: 2 }}>
            <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 24, color: INK, gridRow: mobile ? 'span 2' : undefined }}>{ch}</Japanese>
            <span style={{ fontFamily: FONT, fontSize: 13, color: '#555' }}>{KANJI[ch].meaning}</span>
            <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 10px' }}>
              {words.length === 0 && <span style={{ fontFamily: FONT, fontSize: 13, color: QUIET_INK }}>New kanji</span>}
              {words.map(v => <KanjiWord key={v.form} v={v} ch={ch} tone={v.tag === 'known' ? INK : QUIET_INK} s={s} u={u} />)}
              {more > 0 && <span style={{ fontFamily: FONT, fontSize: 12, color: QUIET_INK }}>+{more}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Anatomy: the word taken apart, one column per kanji, each with a few
// words it lives in.
function KanjiAnatomy({ s, u, mobile }) {
  const { word, chars } = current(s)
  const cap = chars.length > 2 && mobile ? 2 : 3
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${chars.length}, minmax(0, 1fr))` }}>
      {chars.map((ch, i) => {
        const { known, lesson } = familyOf(ch, word)
        const words = [...known, ...lesson].slice(0, cap)
        return (
          <div key={ch} style={{
            padding: mobile ? '12px 8px' : '14px 16px', borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.1)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0,
          }}>
            <Japanese style={{ fontFamily: KANJI_FONT, fontSize: mobile ? 28 : 34, lineHeight: 1.1, color: INK }}>{ch}</Japanese>
            <span style={{ fontFamily: FONT, fontSize: 12, color: '#666', textAlign: 'center' }}>{KANJI[ch].meaning}</span>
            <span style={{ width: 24, borderTop: '1px solid rgba(0,0,0,0.15)', margin: '2px 0' }} />
            {words.length === 0 && <span style={{ fontFamily: FONT, fontSize: 12, color: QUIET_INK }}>New kanji</span>}
            {words.map(v => (
              <span key={v.form} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, maxWidth: '100%' }}>
                <KanjiWord v={v} ch={ch} size={mobile ? 15 : 17} tone={v.tag === 'known' ? INK : QUIET_INK} s={s} u={u} />
                {!(mobile && chars.length > 2) && (
                  <span style={{ fontFamily: FONT, fontSize: 11, color: QUIET_INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {v.gloss?.split(';')[0]}
                  </span>
                )}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// Anchor: one word per kanji — the most familiar one you know — phrased as
// "期 period, as in 来学期". The rest are only counted.
function KanjiAnchor({ s, u, mobile }) {
  const { word, chars } = current(s)
  return (
    <div style={{ padding: mobile ? '12px 16px' : '16px 24px', display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 10 }}>
      {chars.map(ch => {
        const { known, lesson } = familyOf(ch, word)
        const anchor = known[0] ?? lesson[0]
        const rest = []
        if (known.length > 1) rest.push(`${known.length - 1} more you know`)
        if (lesson.length > (anchor?.tag === 'lesson' ? 1 : 0)) rest.push(`${lesson.length - (anchor?.tag === 'lesson' ? 1 : 0)} in this lesson`)
        return (
          <div key={ch} style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 26, color: INK, lineHeight: 1.2 }}>{ch}</Japanese>
            <span style={{ fontFamily: FONT, fontSize: FS_BASE, color: '#333' }}>{KANJI[ch].meaning}</span>
            {anchor ? (
              <>
                <span style={{ fontFamily: FONT, fontSize: 13, color: QUIET_INK }}>as in</span>
                <KanjiWord v={anchor} ch={ch} size={20} s={s} u={u} />
                <span style={{ fontFamily: FONT, fontSize: 13, color: '#666' }}>{anchor.gloss?.split(';')[0]}</span>
                {anchor.tag === 'lesson' && <span style={{ fontFamily: FONT, fontSize: 11, color: '#8a6200' }}>this lesson</span>}
              </>
            ) : <span style={{ fontFamily: FONT, fontSize: 13, color: QUIET_INK }}>new kanji</span>}
            {rest.length > 0 && !mobile && <span style={{ fontFamily: FONT, fontSize: 12, color: QUIET_INK, marginLeft: 'auto' }}>{rest.join(' · ')}</span>}
          </div>
        )
      })}
    </div>
  )
}

const KANJI_PANES = { lines: KanjiLines, anatomy: KanjiAnatomy, anchor: KanjiAnchor }

// ── The band ──────────────────────────────────────────────────────────────

function TextTab({ on, children, onClick }) {
  return (
    <button type="button" className={on ? undefined : 'lab-text-tab'} onClick={onClick} style={{
      border: 'none', background: 'transparent', padding: '6px 0 7px', cursor: 'pointer',
      color: on ? TEXT : 'rgba(255,255,255,0.45)', fontFamily: FONT, fontSize: 13, letterSpacing: '0.05em',
      boxShadow: on ? `inset 0 -2px 0 ${BRAND}` : 'none',
    }}>
      {children}
    </button>
  )
}

function Chevron({ up, size = 10 }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 10 6" aria-hidden="true" style={{ display: 'block' }}>
      <path d={up ? 'M1 5 L5 1 L9 5' : 'M1 1 L5 5 L9 1'} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const DETAIL_LABELS = {
  details: { show: 'Show details', group: 'Details' },
  more: { show: 'Show more', group: 'More' },
}
const labelsFor = s => DETAIL_LABELS[s.label] ?? { show: 'Show sentence and kanji', group: 'Sentence and kanji' }

const TABS = [['sentence', 'Sentence'], ['kanji', 'Kanji']]

// Hide — words when there's room, a chevron when the bar is on the paper.
function HideButton({ u, mobile, onPaper, iconOnly, label }) {
  return (
    <button type="button" title={label.replace('Show', 'Hide')} className={onPaper ? 'lab-icon-btn' : 'lab-text-tab'} onClick={() => u({ shown: false })} style={{
      border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer',
      color: onPaper ? '#888' : 'rgba(255,255,255,0.4)', fontFamily: FONT, fontSize: 12, letterSpacing: '0.05em',
      padding: iconOnly ? '6px 8px' : '6px 4px', display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      {!iconOnly && <span>Hide{mobile ? '' : ' [S]'}</span>}
      <Chevron up />
    </button>
  )
}

function Segmented({ s, pick }) {
  return (
    <span style={{ display: 'inline-flex', padding: 2, gap: 2, borderRadius: 7, background: 'rgba(255,255,255,0.06)' }}>
      {TABS.map(([id, label]) => {
        const on = s.tab === id
        return (
          <button key={id} type="button" className={on ? undefined : 'lab-text-tab'} onClick={() => pick(id)} style={{
            border: 'none', borderRadius: 5, padding: '4px 12px', cursor: 'pointer',
            background: on ? PAPER : 'transparent', color: on ? INK : 'rgba(255,255,255,0.5)',
            fontFamily: FONT, fontSize: 12, letterSpacing: '0.05em',
          }}>
            {label}
          </button>
        )
      })}
    </span>
  )
}

function PaperTabs({ s, pick }) {
  return (
    <span style={{ display: 'inline-flex', gap: 16 }}>
      {TABS.map(([id, label]) => {
        const on = s.tab === id
        return (
          <button key={id} type="button" className={on ? undefined : 'lab-paper-tab'} onClick={() => pick(id)} style={{
            border: 'none', background: 'transparent', padding: '6px 0', cursor: 'pointer',
            color: on ? INK : '#9a9a9a', fontFamily: FONT, fontSize: 12, letterSpacing: '0.06em',
            boxShadow: on ? `inset 0 -2px 0 ${BRAND}` : 'none',
          }}>
            {label}
          </button>
        )
      })}
    </span>
  )
}

export function BandV2({ s, u, mobile, width }) {
  const { word } = current(s)
  const labels = labelsFor(s)
  if (!s.shown) {
    return (
      <div style={{ width, display: 'flex', justifyContent: 'center' }}>
        <button type="button" className="lab-text-tab" onClick={() => u({ shown: true })} style={{
          border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 6, background: 'transparent', padding: '6px 14px',
          color: 'rgba(255,255,255,0.45)', fontFamily: FONT, fontSize: 13, letterSpacing: '0.05em', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {labels.show}{mobile ? '' : ' [S]'}
          <Chevron />
        </button>
      </div>
    )
  }
  const Sentence = SENTENCE_PANES[s.sentencePane]
  const Kanji = KANJI_PANES[s.kanjiPane]
  const pick = id => u(id === 'sentence' ? { tab: 'sentence', kTok: null } : { tab: 'kanji', tok: null })
  const body = s.tab === 'sentence' ? <Sentence s={s} u={u} mobile={mobile} /> : <Kanji s={s} u={u} mobile={mobile} />
  const paper = { background: PAPER, color: INK, borderRadius: 6, boxShadow: '0 4px 0 rgba(0,0,0,0.25)' }
  const bar = s.bar ?? 'underline'

  let content
  if (bar === 'segmented') {
    content = (
      <>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <Segmented s={s} pick={pick} />
          <span style={{ flex: 1 }} />
          <HideButton u={u} mobile={mobile} label={labels.show} />
        </div>
        <div style={paper}>{body}</div>
      </>
    )
  } else if (bar === 'inset') {
    content = (
      <div style={paper}>
        <div style={{ display: 'flex', alignItems: 'center', padding: mobile ? '2px 8px 0 16px' : '4px 12px 0 24px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <PaperTabs s={s} pick={pick} />
          <span style={{ flex: 1 }} />
          <HideButton u={u} mobile={mobile} onPaper iconOnly label={labels.show} />
        </div>
        {body}
      </div>
    )
  } else if (bar === 'footer') {
    content = (
      <div style={paper}>
        {body}
        <div style={{ display: 'flex', alignItems: 'center', padding: mobile ? '0 8px 2px 16px' : '0 12px 4px 24px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <PaperTabs s={s} pick={pick} />
          <span style={{ flex: 1 }} />
          <HideButton u={u} mobile={mobile} onPaper iconOnly label={labels.show} />
        </div>
      </div>
    )
  } else {
    content = (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 4px' }}>
          {TABS.map(([id, label]) => <TextTab key={id} on={s.tab === id} onClick={() => pick(id)}>{label}</TextTab>)}
          <span style={{ flex: 1 }} />
          <HideButton u={u} mobile={mobile} label={labels.show} />
        </div>
        <div style={paper}>{body}</div>
      </>
    )
  }
  return <div key={`${word.id}-v2`} className="lab-slide-down lab-band" style={{ width }}>{content}</div>
}

// The band on its own, for side-by-side comparison of one pane variant.
export function BandSample({ s, u, mobile, pane, override }) {
  const { word } = current(s)
  const [sentencePane, kanjiPane] = !pane ? [s.sentencePane, s.kanjiPane] : pane.kind === 'sentence' ? [pane.id, s.kanjiPane] : [s.sentencePane, pane.id]
  const local = { ...s, shown: true, tab: pane?.kind ?? s.tab, sentencePane, kanjiPane, ...override }
  return (
    <div style={{ background: '#1E1E1E', padding: 12, borderRadius: 8, border: `1px solid ${BORDER}` }}>
      <div style={{ fontFamily: FONT, fontSize: 11, color: TEXT_MUTED, marginBottom: 6 }}>{mobile ? 'Phone width' : 'Desktop width'} · <Japanese style={{ fontFamily: KANJI_FONT }}>{word.form}</Japanese></div>
      <BandV2 s={local} u={u} mobile={mobile} width={mobile ? cardWidth(true) : BAND_W} />
    </div>
  )
}

// ── Drill screen with the band, optionally with the settings drawer ───────

export function BandScreen({ mobile, s, u, sidebar }) {
  const { flip, next } = actions(u)
  const { word } = current(s)
  const w = cardWidth(mobile)
  const tall = s.sentencePane !== 'single'
  const reserve = !s.shown ? 40 : tall ? (mobile ? 250 : 236) : (mobile ? 180 : 150)
  const screen = (
    <DrillScreen mobile={mobile}>
      <DrillStack mobile={mobile}>
        <PaperCard width={w} flipped={s.flipped} onFlip={flip} front={<FrontWord word={word} showReading={false} />} back={<BackWord word={word} />} />
        <div style={{ minHeight: reserve, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          {s.flipped && <BandV2 s={s} u={u} mobile={mobile} width={mobile ? w : BAND_W} />}
        </div>
        <VerdictRow flipped={s.flipped} width={w} mobile={mobile} onVerdict={next} />
      </DrillStack>
    </DrillScreen>
  )
  if (!sidebar) return screen
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>{screen}</div>
      <SettingsMock s={s} u={u} />
    </div>
  )
}

// ── Settings drawer mock ──────────────────────────────────────────────────

function Group({ label, children }) {
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ ...SUBHEADING_STYLE, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      </div>
      <FilterCard>{children}</FilterCard>
    </div>
  )
}

function useStaticToggles() {
  const [v, setV] = useState({ furigana: false, frontAudio: false, meaning: true, backAudio: true })
  return [v, key => setV(p => ({ ...p, [key]: !p[key] }))]
}

export function SettingsMock({ s, u }) {
  const [t, flipT] = useStaticToggles()
  const bool = (key, label) => (
    <Row key={key} label={label} onActivate={() => flipT(key)} control={<Switch checked={t[key]} onChange={() => flipT(key)} label={label} />} />
  )
  return (
    <aside style={{ width: 400, flexShrink: 0, borderLeft: `1px solid ${BORDER}`, background: '#1E1E1E', overflowY: 'auto', padding: '20px 20px 40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: FS_BASE, color: TEXT }}>Options</div>
      <Group label="Card front">
        {bool('furigana', 'Furigana')}
        {bool('frontAudio', 'Audio')}
      </Group>
      <Group label="Card back">
        {bool('meaning', 'Meaning')}
        {bool('backAudio', 'Audio')}
      </Group>
      <Group label={labelsFor(s).group}>
        <Row
          label="Show under card"
          onActivate={() => u(p => ({ shown: !p.shown }))}
          control={<Switch checked={s.shown} onChange={() => u(p => ({ shown: !p.shown }))} label="Show under card" />}
        />
        {s.shown && [
          <Row key="tab" label="Open on" control={<ChipSelector mode="single" value={s.tab} onChange={v => u({ tab: v })} options={[{ value: 'sentence', label: 'Sentence' }, { value: 'kanji', label: 'Kanji' }]} />} />,
          <Row key="furi" label="Furigana" control={<Select value={s.furigana} onChange={v => u({ furigana: v })} label="Furigana" options={[{ value: 'new', label: 'New words only' }, { value: 'all', label: 'All' }, { value: 'off', label: 'Off' }]} />} />,
          <Row key="en" label="Translation" control={<Select value={s.english} onChange={v => u({ english: v, enShown: false })} label="Translation" options={[...(s.sentencePane === 'single' ? [] : [{ value: 'tap', label: 'On tap' }]), { value: 'show', label: 'Always' }, { value: 'hide', label: 'Off' }]} />} />,
          <Row key="audio" label="Play sentence after word" onActivate={() => u(p => ({ sentenceAudio: !p.sentenceAudio }))} control={<Switch checked={s.sentenceAudio} onChange={() => u(p => ({ sentenceAudio: !p.sentenceAudio }))} label="Play sentence after the word" />} />,
        ]}
      </Group>
      <Group label="Audio">
        <Row label="Voice" control={<ChipSelector mode="single" value="male" onChange={() => {}} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />} />
      </Group>
    </aside>
  )
}

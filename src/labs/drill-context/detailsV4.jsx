// Details panel, iteration 4: no tabs — the sentence and the kanji meanings
// together, related words one tap away — and four ways to hold the panel's
// space before the flip so the card never moves.
import Japanese from '../../components/Japanese.jsx'
import { FONT, KANJI_FONT, TEXT, TEXT_MUTED, BORDER } from '../../data/theme.js'
import Switch from '../../components/Switch.jsx'
import ChipSelector from '../../components/Chip.jsx'
import FilterCard from '../../components/FilterCard.jsx'
import { Row } from '../../components/DrillSettingsPanel.jsx'
import { PAPER, INK, TARGET_BG, PaperCard, KanjiBar, Ruby, SentenceText, SpellingNote, DrillScreen, VerdictRow, HudStreak, HudCounts } from './parts.jsx'
import { DrillStack, FrontWord, BackWord } from './concepts.jsx'
import { KanjiWord, SpeakerIcon } from './bandV2.jsx'
import { KANJI, REDACT_BAR, familyOf, hasKanji, cardWidth, current, actions } from './labData.js'

const PANEL_W = 620
const QUIET = '#8a8a8a'
const GLOSS_RED = '#b0003a'

// Reserved panel height per layout, [desktop, phone]. Min-heights: a longer
// sentence can still grow past them.
const HEIGHTS = {
  footer: [168, 196],
  stack: [164, 190],
  split: [150, 204],
  card: [112, 150],
  inline: [132, 168],
}

// ── Pieces ────────────────────────────────────────────────────────────────

// Sentence type metrics. The eye measures a line's edge from the kanji,
// not from the furigana above it — furigana reads like ascenders. So the
// padding is balanced against the kanji: equal space from the panel's top
// edge to the first line's kanji and from the last line's kanji to the
// bottom edge. The line height holds the furigana inside the half-leading
// above each line, so it lands inside that top gap and never changes the
// layout whether a line has furigana or not.
const SENTENCE_LH = 1.95
const SPEAKER = 30
const GLOSS_LH = 2.35

function sentenceMetrics(mobile) {
  const size = mobile ? 21 : 26
  const side = mobile ? 16 : 24
  const inset = mobile ? 20 : 24 // edge ↔ kanji, both top and bottom
  const halfLeading = ((SENTENCE_LH - 1) * size) / 2
  const pad = Math.max(4, Math.round(inset - halfLeading))
  return { size, side, inset, pad, firstLine: SENTENCE_LH * size }
}

// Replay, pinned to the panel's top-right corner. A float the size of the
// button reserves that corner, so only lines beside it wrap around it.
function Speaker() {
  return (
    <button type="button" title="Play sentence" className="lab-speaker" onClick={e => e.stopPropagation()} style={{
      position: 'absolute', top: 8, right: 8, width: SPEAKER, height: SPEAKER,
      border: 'none', borderRadius: 8, padding: 0, zIndex: 1,
      background: 'transparent', color: '#555', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <SpeakerIcon />
    </button>
  )
}

// The sentence with every token replaced by a bar its own width.
function RedactedSentence({ sentence, m }) {
  return (
    <Japanese as="div" aria-hidden="true" style={{ fontFamily: KANJI_FONT, fontSize: m.size, lineHeight: SENTENCE_LH, letterSpacing: '0.02em', userSelect: 'none' }}>
      {sentence.tokens.map((t, i) => (
        <span key={i} style={{ color: 'transparent', background: 'rgba(0,0,0,0.13)', borderRadius: 3, marginRight: 3, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>{t.t}</span>
      ))}
    </Japanese>
  )
}

// `mode`: 'answer' (the back), 'blank' (word blanked out), 'plain' (whole
// sentence, word unannotated), 'blur', 'redact'.
function SentenceBlock({ s, u, mobile, masked, mode: modeProp }) {
  const { word } = current(s)
  const sentence = word.sentences[0]
  const m = sentenceMetrics(mobile)
  const mode = modeProp ?? (masked ? 'blank' : 'answer')
  const answer = mode === 'answer'
  const english = answer && s.english === 'show'
  const note = answer && !sentence.containsForm
  // Lines under the sentence have no leading below them, so the bottom
  // goes back to the full inset.
  const bottom = english || note ? m.inset : m.pad
  let text
  if (mode === 'redact') text = <RedactedSentence sentence={sentence} m={m} />
  else {
    text = (
      <SentenceText
        sentence={sentence}
        furigana={s.furigana}
        target={mode === 'blank' ? 'blank' : mode === 'plain' ? 'highlight' : 'reveal'}
        size={m.size}
        active={answer ? s.tok : null}
        onTap={answer ? i => u({ tok: i }) : undefined}
        lineHeight={SENTENCE_LH}
      />
    )
    if (mode === 'blur') text = <div aria-hidden="true" style={{ filter: 'blur(6px)', opacity: 0.75, userSelect: 'none', pointerEvents: 'none' }}>{text}</div>
  }
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: `${m.pad}px ${m.side}px ${bottom}px` }}>
      <div>
        <span aria-hidden="true" style={{ float: 'right', width: SPEAKER - 8, height: m.firstLine }} />
        {text}
      </div>
      {note && <SpellingNote />}
      {english && <div style={{ fontFamily: FONT, fontSize: mobile ? 13 : 14, color: '#777', lineHeight: 1.5 }}>{sentence.english}</div>}
      {answer && <Speaker />}
    </div>
  )
}

function Hairline() {
  return <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />
}

function countOf(ch, word) {
  const { known, lesson } = familyOf(ch, word)
  return known.length + lesson.length
}

// 期 period · 間 interval — one quiet line. Tap a kanji to open its words.
function KanjiStrip({ s, u, mobile, masked }) {
  const { word, chars } = current(s)
  return (
    <div style={{ padding: mobile ? '6px 12px 8px' : '6px 18px 8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: mobile ? 4 : 8 }}>
      {chars.map(ch => {
        const open = !masked && s.open === ch
        const n = countOf(ch, word)
        return (
          <button
            key={ch}
            type="button"
            className={masked ? undefined : 'lab-icon-btn'}
            onClick={masked ? undefined : e => { e.stopPropagation(); u(p => ({ open: p.open === ch ? null : ch, kTok: null })) }}
            style={{
              border: 'none', borderRadius: 6, padding: '4px 8px', cursor: masked ? 'default' : 'pointer',
              background: open ? 'rgba(0,0,0,0.07)' : 'transparent',
              display: 'inline-flex', alignItems: 'baseline', gap: 6,
            }}
          >
            <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 19, color: INK }}>{ch}</Japanese>
            <span style={{ fontFamily: FONT, fontSize: 13, color: '#555', letterSpacing: '0.03em' }}>{masked ? '· · ·' : KANJI[ch].meaning}</span>
            {!masked && n > 0 && <span style={{ fontFamily: FONT, fontSize: 11, color: open ? '#555' : '#aaa' }}>{open ? '▴' : n}</span>}
          </button>
        )
      })}
    </div>
  )
}

// The opened kanji's words, one line, under the strip.
function RelatedLine({ s, u, mobile }) {
  const { word } = current(s)
  const ch = s.open
  if (!ch || !KANJI[ch]) return null
  const { known, lesson } = familyOf(ch, word)
  const cap = mobile ? 3 : 4
  const words = [...known.slice(0, cap), ...lesson.slice(0, cap)]
  const more = known.length + lesson.length - words.length
  return (
    <div className="lab-fade-up" style={{ padding: mobile ? '0 16px 12px' : '0 26px 14px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 12px' }}>
      {words.length === 0 && <span style={{ fontFamily: FONT, fontSize: 13, color: QUIET }}>First word with {ch}</span>}
      {words.map(v => <KanjiWord key={v.form} v={v} ch={ch} tone={v.tag === 'known' ? INK : QUIET} s={s} u={u} />)}
      {more > 0 && <span style={{ fontFamily: FONT, fontSize: 12, color: QUIET }}>+{more}</span>}
    </div>
  )
}

// The related-words popover. `variant` picks how the list is set:
//   'v4'      — the iteration-4 list (rows with "this lesson" tags), for comparison
//   'grouped' — two labelled groups, word + meaning
//   'table'   — aligned word / reading / meaning columns
//   'flow'    — words only, one line per group; meaning on hover
//   'ruby'    — a small grid of words with furigana over meaning
const POP_CAP = 3

function Shared({ form, ch, tone = TEXT, size = 16 }) {
  return (
    <Japanese style={{ fontFamily: KANJI_FONT, fontSize: size, color: tone, whiteSpace: 'nowrap' }}>
      {[...form].map((c, i) => <span key={i} style={c === ch ? { color: '#FF5C8A' } : undefined}>{c}</span>)}
    </Japanese>
  )
}

function PopHeader({ ch }) {
  const k = KANJI[ch]
  const readings = [...k.on, ...k.kun].slice(0, 4)
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 22, color: TEXT, lineHeight: 1 }}>{ch}</Japanese>
      <span style={{ fontSize: 13, color: TEXT }}>{k.meanings.slice(0, 2).join(', ')}</span>
      {readings.length > 0 && <Japanese style={{ marginLeft: 'auto', fontSize: 12, color: TEXT_MUTED, whiteSpace: 'nowrap' }}>{readings.join('・')}</Japanese>}
    </div>
  )
}

function GroupLabel({ children }) {
  return <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</div>
}

function More({ n }) {
  return n > 0 ? <span style={{ fontSize: 12, color: TEXT_MUTED }}>+{n} more</span> : null
}

function groupsOf(ch, word) {
  const { known, lesson } = familyOf(ch, word)
  return [
    { id: 'known', label: 'You know', items: known },
    { id: 'lesson', label: 'This lesson', items: lesson },
  ].filter(g => g.items.length > 0)
}

const firstGloss = g => (g ?? '').split(';')[0].replace(/\s*\(.*?\)\s*/g, ' ').trim()

function PopBody({ ch, word, variant }) {
  const groups = groupsOf(ch, word)
  if (groups.length === 0) return <span style={{ fontSize: 13, color: TEXT_MUTED }}>The first word you’ve met with {ch}.</span>

  if (variant === 'table') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'max-content max-content minmax(0, 1fr)', columnGap: 12, rowGap: 5, alignItems: 'baseline' }}>
        {groups.map((g, gi) => [
          gi > 0 && <div key={`${g.id}-rule`} style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '3px 0' }} />,
          ...g.items.slice(0, POP_CAP).map(v => [
            <Shared key={`${v.form}-w`} form={v.form} ch={ch} tone={g.id === 'known' ? TEXT : TEXT_MUTED} />,
            <Japanese key={`${v.form}-r`} style={{ fontSize: 12, color: TEXT_MUTED, whiteSpace: 'nowrap' }}>{v.reading}</Japanese>,
            <span key={`${v.form}-g`} style={{ fontSize: 13, color: g.id === 'known' ? TEXT : TEXT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstGloss(v.gloss)}</span>,
          ]),
        ])}
        <span style={{ gridColumn: '1 / -1', fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>Bright: you know it · dim: this lesson</span>
      </div>
    )
  }

  if (variant === 'flow') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {groups.map(g => (
          <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '78px minmax(0, 1fr)', alignItems: 'baseline', gap: 8 }}>
            <GroupLabel>{g.label}</GroupLabel>
            <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 12px' }}>
              {g.items.slice(0, 5).map(v => <span key={v.form} title={`${v.reading} · ${firstGloss(v.gloss)}`}><Shared form={v.form} ch={ch} /></span>)}
              <More n={g.items.length - 5} />
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'ruby') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map(g => (
          <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <GroupLabel>{g.label}</GroupLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px 12px' }}>
              {g.items.slice(0, POP_CAP).map(v => (
                <div key={v.form} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 16, lineHeight: 1.9, color: TEXT, whiteSpace: 'nowrap' }}>
                    <Ruby text={v.form} reading={v.reading} rtColor={TEXT_MUTED} />
                  </Japanese>
                  <span style={{ fontSize: 11, color: TEXT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstGloss(v.gloss)}</span>
                </div>
              ))}
            </div>
            <More n={g.items.length - POP_CAP} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'final') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map(g => (
          <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <GroupLabel>{g.label}</GroupLabel>
            {g.items.slice(0, POP_CAP).map(v => (
              <span key={v.form} style={{ display: 'flex', alignItems: 'baseline', gap: 16, minWidth: 0 }}>
                <Shared form={v.form} ch={ch} />
                <span style={{ marginLeft: 'auto', fontSize: 13, color: TEXT_MUTED, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstGloss(v.gloss)}</span>
              </span>
            ))}
            <More n={g.items.length - POP_CAP} />
          </div>
        ))}
      </div>
    )
  }

  // grouped (default for the new set)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {groups.map(g => (
        <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <GroupLabel>{g.label}</GroupLabel>
          {g.items.slice(0, POP_CAP).map(v => (
            <span key={v.form} style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
              <Shared form={v.form} ch={ch} />
              <span style={{ fontSize: 13, color: TEXT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstGloss(v.gloss)}</span>
            </span>
          ))}
          <More n={g.items.length - POP_CAP} />
        </div>
      ))}
    </div>
  )
}

function RelatedPopover({ chars, word, style, variant = 'v4' }) {
  const box = {
    position: 'absolute', zIndex: 25, boxSizing: 'border-box', background: '#2A2A2A', color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)', fontFamily: FONT, textAlign: 'left', ...style,
  }
  if (variant !== 'v4') {
    return (
      <div className="lab-fade-up" onClick={e => e.stopPropagation()} style={{ ...box, padding: '12px 14px', width: variant === 'table' || variant === 'ruby' ? 300 : 260, maxWidth: 'calc(100vw - 32px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {chars.map(ch => (
          <div key={ch} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {variant !== 'final' && <PopHeader ch={ch} />}
            <PopBody ch={ch} word={word} variant={variant} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="lab-fade-up" onClick={e => e.stopPropagation()} style={{ ...box, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220, maxWidth: 300 }}>
      {chars.map(ch => {
        const { known, lesson } = familyOf(ch, word)
        const rows = [...known.slice(0, 4), ...lesson.slice(0, 4)]
        return (
          <div key={ch} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {chars.length > 1 && <span style={{ fontSize: 12, color: TEXT_MUTED }}><Japanese style={{ fontFamily: KANJI_FONT, fontSize: 15, color: TEXT }}>{ch}</Japanese> {KANJI[ch].meaning}</span>}
            {rows.length === 0 && <span style={{ fontSize: 13, color: TEXT_MUTED }}>First word with {ch}</span>}
            {rows.map(v => (
              <span key={v.form} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13 }}>
                <Shared form={v.form} ch={ch} tone={v.tag === 'known' ? TEXT : TEXT_MUTED} />
                <span style={{ color: TEXT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.gloss?.split(';')[0]}</span>
                {v.tag === 'lesson' && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#fbbf24', whiteSpace: 'nowrap' }}>this lesson</span>}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function PopoverSample({ ch, word, variant }) {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <RelatedPopover chars={[ch]} word={word} variant={variant} style={{ position: 'relative' }} />
    </div>
  )
}

// M5: the card's kanji-bar pattern as the sentence card's footer — evenly
// divided tiles, kanji over meaning. A tile opens its words upward, over the
// sentence, so the popover never covers the verdict buttons.
function KanjiFooter({ s, u, mobile, masked, mode: modeProp }) {
  const { word, chars } = current(s)
  const mode = modeProp ?? (masked ? 'hidden' : 'answer')
  masked = mode !== 'answer'
  return (
    <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.035)', borderRadius: '0 0 6px 6px' }}>
      {chars.map((ch, i) => {
        const open = !masked && s.open === ch
        const n = countOf(ch, word)
        return (
          <div key={ch} style={{ position: 'relative', flex: 1, minWidth: 0, borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.09)' : 'none' }}>
            <button
              type="button"
              className={masked ? undefined : 'lab-kanji-tile'}
              onClick={masked ? undefined : e => { e.stopPropagation(); u(p => ({ open: p.open === ch ? null : ch })) }}
              style={{
                width: '100%', border: 'none', cursor: masked ? 'default' : 'pointer',
                padding: mobile ? '7px 6px 8px' : '8px 8px 9px',
                background: open ? 'rgba(255,0,77,0.08)' : 'transparent',
                boxShadow: open ? 'inset 0 2px 0 #FF004D' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                borderRadius: i === 0 && i === chars.length - 1 ? '0 0 6px 6px' : i === 0 ? '0 0 0 6px' : i === chars.length - 1 ? '0 0 6px 0' : 0,
              }}
            >
              <Japanese style={{ fontFamily: KANJI_FONT, fontSize: mobile ? 18 : 20, lineHeight: 1.2, color: '#333' }}>{ch}</Japanese>
              <span style={{ fontFamily: FONT, fontSize: 11, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {mode === 'answer' ? KANJI[ch].meaning
                  : mode === 'blur' ? <span aria-hidden="true" style={{ filter: 'blur(4px)', opacity: 0.8 }}>{KANJI[ch].meaning}</span>
                    : mode === 'redact' ? <span aria-hidden="true" style={{ color: 'transparent', background: 'rgba(0,0,0,0.13)', borderRadius: 3 }}>{KANJI[ch].meaning}</span>
                      : '· · ·'}
              </span>
            </button>
            {!masked && n > 0 && !open && (
              <span style={{ position: 'absolute', top: 5, right: 7, fontFamily: FONT, fontSize: 10, color: '#aaa', pointerEvents: 'none' }}>{n}</span>
            )}
            {open && (
              <RelatedPopover variant={s.popStyle} chars={[ch]} word={word} style={i < chars.length / 2 ? { bottom: 'calc(100% + 6px)', left: 0 } : { bottom: 'calc(100% + 6px)', right: 0 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// M2's right-hand column: kanji rows, each opening a popover.
function KanjiColumn({ s, u }) {
  const { word, chars } = current(s)
  return (
    <div style={{ borderLeft: '1px solid rgba(0,0,0,0.08)', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
      {chars.map(ch => {
        const open = s.open === ch
        return (
          <div key={ch} style={{ position: 'relative' }}>
            <button type="button" className="lab-icon-btn" onClick={e => { e.stopPropagation(); u(p => ({ open: p.open === ch ? null : ch })) }} style={{
              width: '100%', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', textAlign: 'left',
              background: open ? 'rgba(0,0,0,0.07)' : 'transparent', display: 'flex', alignItems: 'baseline', gap: 8,
            }}>
              <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 19, color: INK }}>{ch}</Japanese>
              <span style={{ fontFamily: FONT, fontSize: 13, color: '#555', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{KANJI[ch].meaning}</span>
              <span style={{ fontFamily: FONT, fontSize: 11, color: '#aaa' }}>{countOf(ch, word) || ''}</span>
            </button>
            {open && <RelatedPopover chars={[ch]} word={word} style={{ top: 'calc(100% + 4px)', right: 0 }} />}
          </div>
        )
      })}
    </div>
  )
}

// M4: the kanji meanings set under each kanji of the word, inside the sentence.
function InterlinearSentence({ s, u, mobile }) {
  const { word } = current(s)
  const sentence = word.sentences[0]
  // Taller lines: the glosses under the word need the room.
  const base = sentenceMetrics(mobile)
  const m = { ...base, firstLine: GLOSS_LH * base.size }
  const showRuby = t => t.r && (s.furigana === 'all' || (s.furigana === 'new' && (t.status === 'new' || t.status === 'lesson')))
  const targets = sentence.tokens.filter(t => t.status === 'target')
  const firstTarget = sentence.tokens.findIndex(t => t.status === 'target')
  const open = s.open === '*'
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${m.pad}px ${m.side}px ${m.pad}px` }}>
      <Speaker />
      <div>
        <div style={{ fontFamily: KANJI_FONT, fontSize: m.size, lineHeight: GLOSS_LH, color: INK, letterSpacing: '0.02em' }}>
          <span aria-hidden="true" style={{ float: 'right', width: SPEAKER - 4, height: m.firstLine }} />
          {sentence.tokens.map((t, i) => {
            if (t.status !== 'target') {
              return <Japanese key={i}><Ruby text={t.t} reading={t.r} show={showRuby(t)} /></Japanese>
            }
            if (i !== firstTarget) return null
            const text = targets.map(x => x.t).join('')
            return (
              <span key={i} style={{ position: 'relative' }}>
                <Japanese
                  className="lab-tok"
                  onClick={e => { e.stopPropagation(); u(p => ({ open: p.open === '*' ? null : '*' })) }}
                  style={{ background: TARGET_BG, boxShadow: 'inset 0 -2px 0 #FF004D', borderRadius: 3, padding: '0 1px' }}
                >
                  {[...text].map((c, j) => hasKanji(c) && KANJI[c] ? (
                    <span key={j} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'baseline', margin: '0 0.12em' }}>
                      <span>{c}</span>
                      <span style={{ fontFamily: FONT, fontSize: 'max(11px, 0.42em)', lineHeight: 1, color: GLOSS_RED, marginTop: '0.15em', whiteSpace: 'nowrap', letterSpacing: 0 }}>{KANJI[c].meaning}</span>
                    </span>
                  ) : <span key={j}>{c}</span>)}
                </Japanese>
              </span>
            )
          })}
        </div>
        {s.english === 'show' && <div style={{ fontFamily: FONT, fontSize: mobile ? 13 : 14, color: '#777', lineHeight: 1.5 }}>{sentence.english}</div>}
      </div>
      {open && (
        <RelatedPopover
          chars={[...new Set([...targets.map(x => x.t).join('')].filter(c => KANJI[c]))]}
          word={word}
          style={{ bottom: 'calc(100% + 6px)', left: mobile ? 12 : 20 }}
        />
      )}
    </div>
  )
}

// ── v6: the redaction that fades away ─────────────────────────────────────

// Mobile and desktop both use one inset for all four sides, measured to the
// kanji (the furigana sits inside the top inset, like ascenders).
function revealMetrics(mobile) {
  const size = mobile ? 21 : 26
  const inset = mobile ? 16 : 24
  const halfLeading = ((SENTENCE_LH - 1) * size) / 2
  return { size, inset, pad: Math.max(4, Math.round(inset - halfLeading)), firstLine: SENTENCE_LH * size, corner: mobile ? 6 : 10 }
}

// The card's flip is 450ms. The fade starts on the same tap and runs a
// little longer, so the words are fully in just after the card lands — and
// out again the same way when the flip is undone.
const FADE = 'opacity 500ms ease'

// The real content and its redacted twin, stacked in the same box. Only the
// opacities change, so nothing reflows or remounts on the flip.
function Layered({ revealed, block, style, children }) {
  const T = block ? 'div' : 'span'
  return (
    <T style={{ position: 'relative', display: block ? 'block' : 'inline-block', maxWidth: '100%', ...style }}>
      <T style={{ display: block ? 'block' : 'inline', opacity: revealed ? 1 : 0, transition: FADE }}>{children}</T>
      <T aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: revealed ? 0 : 1, transition: FADE, pointerEvents: 'none' }}>
        <span style={REDACT_BAR}>{children}</span>
      </T>
    </T>
  )
}

function RevealFooter({ s, u, mobile, revealed, standalone }) {
  const { word, chars } = current(s)
  // Kanji-only: the tiles are the whole panel, so they take all four corners
  // and a little more room than as a footer under a sentence. Corners follow
  // the panel: 6px on desktop, square on a phone.
  const r = mobile ? 0 : 6
  const radius = standalone ? r : 0
  return (
    <div style={{ display: 'flex', borderTop: standalone ? 'none' : '1px solid rgba(0,0,0,0.12)', background: standalone ? 'transparent' : 'rgba(0,0,0,0.035)', borderRadius: standalone ? r : `0 0 ${r}px ${r}px` }}>
      {chars.map((ch, i) => {
        const open = revealed && s.open === ch
        const n = countOf(ch, word)
        return (
          <div key={ch} style={{ position: 'relative', flex: 1, minWidth: 0, borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.09)' : 'none' }}>
            <button
              type="button"
              className={revealed ? 'lab-kanji-tile' : undefined}
              onClick={revealed ? e => { e.stopPropagation(); u(p => ({ open: p.open === ch ? null : ch, tok: null })) } : undefined}
              style={{
                width: '100%', border: 'none', cursor: revealed ? 'pointer' : 'default',
                padding: standalone ? (mobile ? '12px 6px 13px' : '14px 8px 15px') : mobile ? '7px 6px 8px' : '8px 8px 9px',
                background: open ? 'rgba(255,0,77,0.08)' : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                borderRadius: i === 0 && i === chars.length - 1 ? `${radius}px ${radius}px ${r}px ${r}px` : i === 0 ? `${radius}px 0 0 ${r}px` : i === chars.length - 1 ? `0 ${radius}px ${r}px 0` : 0,
              }}
            >
              <Japanese style={{ fontFamily: KANJI_FONT, fontSize: standalone ? (mobile ? 22 : 24) : mobile ? 18 : 20, lineHeight: 1.2, color: '#333' }}>{ch}</Japanese>
              <Layered revealed={revealed} style={{ fontFamily: FONT, fontSize: 11, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {KANJI[ch].meaning}
              </Layered>
            </button>
            {n > 0 && !open && (
              <span style={{ position: 'absolute', top: 5, ...(standalone ? { left: 7 } : { right: 7 }), fontFamily: FONT, fontSize: 10, color: '#aaa', pointerEvents: 'none', opacity: revealed ? 1 : 0, transition: FADE }}>{n}</span>
            )}
            {open && (
              <RelatedPopover variant="final" chars={[ch]} word={word} style={{ width: 240, ...(i < chars.length / 2 ? { bottom: 'calc(100% + 6px)', left: 0 } : { bottom: 'calc(100% + 6px)', right: 0 }) }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// One panel for both faces. Redacted on the front, and on the flip the bars
// fade out and the words fade in, in place.
function RevealPanel({ s, u, mobile, width, revealed }) {
  const { word } = current(s)
  const showSentence = s.showSentence !== false
  const showKanji = s.showKanji !== false
  if (!showSentence) {
    return (
      <div data-reveal-panel="" style={{ ...paperBox, width, borderRadius: mobile ? 0 : 6 }}>
        <RevealFooter s={s} u={u} mobile={mobile} revealed={revealed} standalone />
        <PanelCorner u={u} top={4} right={4} revealed={revealed} withSpeaker={false} />
      </div>
    )
  }
  const sentence = word.sentences[0]
  const m = revealMetrics(mobile)
  // Translation: 'hide' | 'blur' (the default — blurred until tapped) | 'show'.
  const english = s.english !== 'hide'
  const blurred = s.english === 'blur' && !s.enShown
  const note = !sentence.containsForm
  const bottom = english || note ? m.inset : m.pad
  const radius = mobile ? 0 : 6
  // Two corner buttons now (replay, hide), so the float reserves both.
  const spacer = <span aria-hidden="true" style={{ float: 'right', width: SPEAKER * 2 + 2 - (mobile ? 12 : 8), height: m.firstLine }} />
  // Furigana follows the card's reading position: under the kanji when the
  // card puts its reading below the word. Under-ruby sits in the half-leading
  // below each line, so the layout (and the kanji-based insets) don't change.
  const textProps = { sentence, furigana: s.furigana, target: 'reveal', size: m.size, lineHeight: SENTENCE_LH, rubyPosition: s.readingPos === 'below' ? 'under' : 'over', targetBold: true, tokenStatus: false }
  return (
    <div data-reveal-panel="" style={{ ...paperBox, width, borderRadius: radius }}>
      <div data-sentence-box="" style={{ position: 'relative', padding: `${m.pad}px ${m.inset}px ${bottom}px`, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ position: 'relative' }}>
          <div data-real-layer="" style={{ opacity: revealed ? 1 : 0, transition: FADE, pointerEvents: revealed ? 'auto' : 'none' }}>
            {spacer}
            <SentenceText {...textProps} active={s.tok} onTap={i => u({ tok: i, open: null })} />
          </div>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: revealed ? 0 : 1, transition: FADE, pointerEvents: 'none' }}>
            {spacer}
            <SentenceText {...textProps} redact />
          </div>
        </div>
        {note && <Layered block revealed={revealed} style={{ fontFamily: FONT, fontSize: 12, color: '#8a6200' }}>This sentence spells it differently from the card</Layered>}
        {english && (
          <Layered block revealed={revealed} style={{ fontFamily: FONT, fontSize: mobile ? 13 : 14, color: '#777', lineHeight: 1.5 }}>
            <span
              className={blurred ? 'lab-blur-reveal' : undefined}
              title={blurred ? 'Tap to reveal' : undefined}
              onClick={blurred && revealed ? e => { e.stopPropagation(); u({ enShown: true }) } : undefined}
              style={{ filter: blurred ? 'blur(4px)' : 'none', transition: 'filter 250ms ease', userSelect: blurred ? 'none' : 'auto' }}
            >
              {sentence.english}
            </span>
          </Layered>
        )}
        <PanelCorner u={u} top={m.corner} right={m.corner} revealed={revealed} />
      </div>
      {showKanji && <RevealFooter s={s} u={u} mobile={mobile} revealed={revealed} />}
    </div>
  )
}

function CornerButton({ title, onClick, children }) {
  return (
    <button type="button" title={title} className="lab-speaker" onClick={e => { e.stopPropagation(); onClick?.() }} style={{
      width: SPEAKER, height: SPEAKER, border: 'none', borderRadius: 8, padding: 0,
      background: 'transparent', color: '#555', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </button>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M3 3 L11 11 M11 3 L3 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

// Top-right corner: replay (only with a sentence, and only once revealed —
// playing it earlier would say the answer) and hide, side by side, same style.
// Hide is there on both faces: it's a control for the panel, not content.
function PanelCorner({ u, top, right, revealed, withSpeaker = true }) {
  return (
    <div style={{ position: 'absolute', top, right, display: 'flex', gap: 2, zIndex: 2 }}>
      {withSpeaker && (
        <span style={{ opacity: revealed ? 1 : 0, transition: FADE, pointerEvents: revealed ? 'auto' : 'none' }}>
          <CornerButton title="Play sentence"><SpeakerIcon /></CornerButton>
        </span>
      )}
      <CornerButton title="Hide details" onClick={() => u({ shown: false, open: null, tok: null })}><CloseIcon /></CornerButton>
    </div>
  )
}

// Reserved slot for the reveal panel, [desktop, phone]: room for two lines on
// desktop and three on a phone. The panel hugs its content and sits at the top
// of the slot, so the card and buttons hold still from card to card while the
// panel itself carries no padding it doesn't need.
const REVEAL_SLOT = {
  both: [168, 186],
  sentence: [120, 140],
  kanji: [72, 76],
}

function slotFor(s, mobile) {
  const key = s.showSentence === false ? 'kanji' : s.showKanji === false ? 'sentence' : 'both'
  return REVEAL_SLOT[key][mobile ? 1 : 0]
}

// ── v7: the card's own faces ──────────────────────────────────────────────

// The word without the drop shadow. `readingPos`: 'below' puts the reading on
// its own line under the word (the default); 'above' keeps today's furigana.
function CardWord({ word, reading, readingPos }) {
  const scale = word.form.length >= 8 ? 0.7 : word.form.length >= 6 ? 0.85 : 1
  const size = `${(12.63 * scale).toFixed(2)}cqw`
  if (!reading || readingPos !== 'below') {
    return (
      <Japanese as="div" style={{ fontFamily: KANJI_FONT, fontSize: size, lineHeight: 1.4, textAlign: 'center', color: INK }}>
        <Ruby text={word.form} reading={word.reading} show={!!reading} />
      </Japanese>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8cqw' }}>
      <Japanese as="div" style={{ fontFamily: KANJI_FONT, fontSize: size, lineHeight: 1.15, textAlign: 'center', color: INK }}>{word.form}</Japanese>
      <Japanese as="div" style={{ fontFamily: KANJI_FONT, fontSize: '5.4cqw', lineHeight: 1.2, letterSpacing: '0.08em', color: '#666' }}>{word.reading}</Japanese>
    </div>
  )
}

function CardFace({ word, back, readingPos }) {
  return (
    <div style={{ position: 'relative', background: PAPER, width: '100%', height: '100%', color: INK }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5cqw', padding: '0 4cqw' }}>
        <CardWord word={word} reading={back ? word.reading : null} readingPos={readingPos} />
        {back && (
          <div style={{ fontFamily: FONT, fontSize: '5.26cqw', letterSpacing: '0.04em', color: '#555', textAlign: 'center', padding: '0 4cqw' }}>{word.gloss}</div>
        )}
      </div>
    </div>
  )
}

// The drawer for v7: the Details group gains Sentence and Kanji switches,
// at least one of which stays on, and the card back gains Reading position.
export function DrawerV7({ s, u }) {
  const shown = s.shown !== false
  const sentenceOn = s.showSentence !== false
  const kanjiOn = s.showKanji !== false
  const toggle = key => u(p => ({ [key]: p[key] === false, open: null, tok: null }))
  const row = (key, label, checked, { disabled, onChange } = {}) => (
    <Row
      key={key}
      label={label}
      onActivate={disabled ? undefined : onChange}
      control={<Switch checked={checked} disabled={disabled} onChange={onChange} label={label} />}
    />
  )
  const chips = (key, label, value, options, onChange) => (
    <Row key={key} label={label} control={<ChipSelector mode="single" value={value} onChange={onChange} options={options} />} />
  )
  // Rows are passed as flat children: FilterCard draws its divider between
  // direct children, so a nested array would render as one undivided block.
  const detailRows = [
    row('shown', 'Show under card', shown, { onChange: () => u(p => ({ shown: p.shown === false, open: null, tok: null })) }),
    shown && row('showSentence', 'Sentence', sentenceOn, { disabled: sentenceOn && !kanjiOn, onChange: () => toggle('showSentence') }),
    shown && row('showKanji', 'Kanji', kanjiOn, { disabled: kanjiOn && !sentenceOn, onChange: () => toggle('showKanji') }),
  ].filter(Boolean)
  const audioActive = shown && sentenceOn
  return (
    <aside style={{ width: 400, flexShrink: 0, borderLeft: `1px solid ${BORDER}`, background: '#1E1E1E', overflowY: 'auto', padding: '20px 20px 40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 15, color: TEXT }}>Options</div>
      <DrawerGroup label="Card back">
        {chips('reading', 'Reading', s.readingPos, [{ value: 'below', label: 'Below' }, { value: 'above', label: 'Above' }], v => u({ readingPos: v }))}
        {row('meaning', 'Meaning', true, { onChange: () => {} })}
      </DrawerGroup>
      <DrawerGroup label="Details">{detailRows}</DrawerGroup>
      {shown && sentenceOn && (
        <DrawerGroup label="Sentence">
          {chips('english', 'Translation', s.english, [{ value: 'hide', label: 'Off' }, { value: 'blur', label: 'Blurred' }, { value: 'show', label: 'On' }], v => u({ english: v, enShown: false }))}
          {chips('furi', 'Furigana', s.furigana, [{ value: 'off', label: 'Off' }, { value: 'new', label: 'New' }, { value: 'all', label: 'All' }], v => u({ furigana: v }))}
        </DrawerGroup>
      )}
      <DrawerGroup label="Audio">
        {chips('voice', 'Voice', 'male', [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }], () => {})}
        {row('sentenceAudio', 'Play sentence', audioActive && s.sentenceAudio !== false, { disabled: !audioActive, onChange: () => u(p => ({ sentenceAudio: p.sentenceAudio === false })) })}
      </DrawerGroup>
    </aside>
  )
}

function DrawerGroup({ label, children }) {
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      </div>
      <FilterCard>{children}</FilterCard>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────

const paperBox = { background: PAPER, color: INK, borderRadius: 6, boxShadow: '0 4px 0 rgba(0,0,0,0.25)', boxSizing: 'border-box', position: 'relative' }

// `front` (footer layout only): how the panel shows before the flip —
// { sentence: SentenceBlock mode, footer: KanjiFooter mode }.
function Panel({ s, u, mobile, width, height, masked, front }) {
  const { word } = current(s)
  if (front) masked = true
  const sentence = word.sentences[0]
  // The in-sentence gloss needs the word to actually be in the sentence;
  // otherwise this card falls back to the stacked layout.
  const layout = s.layout === 'inline' && !sentence.containsForm ? 'stack' : s.layout
  let body
  if (layout === 'footer') {
    body = (
      <>
        <SentenceBlock s={s} u={u} mobile={mobile} masked={masked} mode={front?.sentence} />
        <KanjiFooter s={s} u={u} mobile={mobile} masked={masked} mode={front?.footer} />
      </>
    )
  } else if (layout === 'stack' || (layout === 'split' && mobile)) {
    body = (
      <>
        <SentenceBlock s={s} u={u} mobile={mobile} masked={masked} />
        <Hairline />
        <KanjiStrip s={s} u={u} mobile={mobile} masked={masked} />
        {!masked && <RelatedLine s={s} u={u} mobile={mobile} />}
      </>
    )
  } else if (layout === 'split') {
    body = (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 190px' }}>
        <SentenceBlock s={s} u={u} mobile={mobile} masked={masked} />
        {masked ? <div style={{ borderLeft: '1px solid rgba(0,0,0,0.08)' }} /> : <KanjiColumn s={s} u={u} />}
      </div>
    )
  } else if (layout === 'inline') {
    body = masked ? <SentenceBlock s={s} u={u} mobile={mobile} masked /> : <InterlinearSentence s={s} u={u} mobile={mobile} />
  } else {
    body = <SentenceBlock s={s} u={u} mobile={mobile} masked={masked} />
  }
  return (
    <div key={`${word.id}-${masked ? 'f' : 'b'}`} className={masked ? undefined : 'lab-fade-up lab-band'} style={{ ...paperBox, width, minHeight: height, display: 'flex', flexDirection: 'column' }}>
      {body}
    </div>
  )
}

// Empty state: the panel's outline with a line of text, for a feature that's
// on but has nothing to show until the flip.
function EmptyPanel({ width, height, mobile }) {
  return (
    <div style={{
      width, height, borderRadius: 6, boxSizing: 'border-box', border: '1px dashed rgba(255,255,255,0.16)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontFamily: FONT, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 16,
    }}>
      <span style={{ fontSize: 13 }}>Flip the card to see the sentence and kanji</span>
      {!mobile && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Space</span>}
    </div>
  )
}

const FRONT_MODES = {
  preview: { sentence: 'blank', footer: 'hidden' },
  sentence: { sentence: 'plain', footer: 'hidden' },
  blur: { sentence: 'blur', footer: 'blur' },
  redact: { sentence: 'redact', footer: 'redact' },
}

// A face-down panel: the same paper, dimmed and hatched, like the back of a card.
function GhostPanel({ width, height }) {
  return (
    <div style={{
      width, height, borderRadius: 6, boxSizing: 'border-box',
      background: 'repeating-linear-gradient(135deg, rgba(232,228,222,0.07) 0 6px, rgba(232,228,222,0.03) 6px 12px)',
      border: '1px solid rgba(232,228,222,0.1)',
    }} />
  )
}

// ── Stage ─────────────────────────────────────────────────────────────────

export function StageV4({ mobile, s, u, sidebar }) {
  const { flip, next } = actions(u)
  const { word } = current(s)
  const w = cardWidth(mobile)
  const pw = mobile ? w : PANEL_W
  const height = HEIGHTS[s.layout][mobile ? 1 : 0]
  const onCard = s.layout === 'card'

  const back = onCard
    ? <BackWord word={word} bar={<KanjiBar word={word} selected={s.open} onSelect={ch => u(p => ({ open: p.open === ch ? null : ch }))} />} />
    : <BackWord word={word} />
  const card = (
    <div style={{ position: 'relative' }}>
      <PaperCard width={w} flipped={s.flipped} onFlip={flip} front={<FrontWord word={word} showReading={false} />} back={back} />
      {onCard && s.flipped && s.open && KANJI[s.open] && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 25 }}>
          <RelatedPopover chars={[s.open]} word={word} style={{ position: 'relative' }} />
        </div>
      )}
    </div>
  )

  let panel = null
  if (s.flipped) panel = <Panel s={s} u={u} mobile={mobile} width={pw} height={height} />
  else if (s.reserve === 'ghost') panel = <GhostPanel width={pw} height={height} />
  else if (s.reserve === 'empty') panel = <EmptyPanel width={pw} height={height} mobile={mobile} />
  else if (s.layout === 'footer' && FRONT_MODES[s.reserve]) panel = <Panel s={s} u={u} mobile={mobile} width={pw} height={height} front={FRONT_MODES[s.reserve]} />
  else if (s.reserve === 'preview') panel = <Panel s={s} u={u} mobile={mobile} width={pw} height={height} masked />

  const verdict = <VerdictRow flipped={s.flipped} width={w} mobile={mobile} onVerdict={next} />

  if (s.reserve === 'reveal') {
    // On a phone the card and panel run edge to edge (the stage has 16px side
    // padding, so they pull out past it); on desktop both take 6px corners.
    const edge = s.v7 && mobile
    const cw = edge ? 390 : w
    const v7Card = s.v7 && (
      <div className="lab-card-r" style={{ '--card-r': edge ? '0px' : '6px', margin: edge ? '0 -16px' : 0 }}>
      <PaperCard
        width={cw}
        flipped={s.flipped}
        onFlip={flip}
        front={<CardFace word={word} readingPos={s.readingPos} />}
        back={<CardFace word={word} back readingPos={s.readingPos} />}
      />
      </div>
    )
    const hidden = s.shown === false
    const screen = (
      <DrillScreen mobile={mobile}>
        <DrillStack mobile={mobile}>
          {v7Card || card}
          <div style={{ minHeight: hidden ? 36 : slotFor(s, mobile), display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            {hidden ? (
              <button type="button" className="lab-text-tab" onClick={() => u({ shown: true })} style={{
                border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 6, background: 'transparent', padding: '6px 14px',
                color: 'rgba(255,255,255,0.45)', fontFamily: FONT, fontSize: 13, letterSpacing: '0.05em', cursor: 'pointer',
              }}>
                Show details
              </button>
            ) : (
              <div style={{ margin: edge ? '0 -16px' : 0 }}>
                <RevealPanel key={word.id} s={s} u={u} mobile={mobile} width={edge ? 390 : pw} revealed={s.flipped} />
              </div>
            )}
          </div>
          {verdict}
        </DrillStack>
      </DrillScreen>
    )
    if (!sidebar) return screen
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>{screen}</div>
        <DrawerV7 s={s} u={u} />
      </div>
    )
  }

  if (s.reserve === 'pinned') {
    return (
      <DrillScreen mobile={mobile} align="start" bottomBar={<>{verdict}{!mobile && <HudCounts inline />}</>}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 10 : 15, paddingTop: mobile ? 4 : 20 }}>
          <HudStreak compact={mobile} />
          {card}
          {panel}
        </div>
      </DrillScreen>
    )
  }
  return (
    <DrillScreen mobile={mobile}>
      <DrillStack mobile={mobile}>
        {card}
        <div style={{ minHeight: s.reserve === 'none' ? 0 : height, display: 'flex', justifyContent: 'center' }}>{panel}</div>
        {verdict}
      </DrillStack>
    </DrillScreen>
  )
}

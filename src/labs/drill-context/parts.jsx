// Building blocks for the Drill Context lab. Deliberately lab-local copies of
// the drill's look (card paper, cqw sizing, HUD, header) rather than the real
// VocabCard/DrillHUD: those size themselves off 100vw and fetch from Supabase,
// and every frame here is a fixed-size device mock fed from frozen fixtures.
import FlipCard from '../../FlipCard.jsx'
import Japanese from '../../components/Japanese.jsx'
import { DrillButton } from '../../components/DrillButton.jsx'
import { buildFurigana } from '../../utils/furigana.js'
import {
  FONT, KANJI_FONT, TRACKING, TEXT, TEXT_MUTED, BORDER, BRAND, BRAND_TEXT,
  FS_BASE, FS_NAV, DRILL_COLORS, DRILL_ROW_HEIGHT,
} from '../../data/theme.js'
import { KANJI, DEVICES, REDACT_BAR, hasKanji, kanjiOf } from './labData.js'

export const PAPER = '#E8E4DE'
export const INK = '#222'
export const INK_MUTED = '#6b6b6b'
export const TARGET_BG = 'rgba(255,0,77,0.13)'


// ── Device frame ──────────────────────────────────────────────────────────

export function Frame({ device, size, scale = 1, children }) {
  const { w, h, label } = size ?? DEVICES[device]
  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        width: w * scale, height: h * scale, overflow: 'hidden',
        borderRadius: device === 'phone' ? 28 * scale : 10 * scale,
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        flexShrink: 0,
      }}>
        <div style={{
          width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left',
          position: 'relative', overflow: 'hidden', background: '#1E1E1E',
          fontFamily: FONT, letterSpacing: TRACKING, color: TEXT,
        }}>
          {children}
        </div>
      </div>
      <figcaption style={{ fontSize: 13, color: TEXT_MUTED }}>{label}{scale !== 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''}</figcaption>
    </figure>
  )
}

// ── Drill screen chrome (header, progress, HUD) ───────────────────────────

export function DrillScreen({ mobile, progress = 0.3, hud = 'full', bottomBar, children, align = 'center' }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: mobile ? '0 16px' : '0 24px', borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ fontSize: FS_NAV, color: 'rgba(255,255,255,0.35)' }}>
            {mobile
              ? <span>← <span style={{ color: TEXT }}>Reviewing</span></span>
              : <span>Lantern <Sep /> Vocabulary <Sep /> <span style={{ color: TEXT }}>Reviewing</span></span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'rgba(255,255,255,0.45)', fontSize: FS_BASE }}>
            {hud === 'header' && !mobile && <HudCounts inline />}
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#5b7c99', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>SC</span>
            {mobile && <span style={{ fontSize: 18 }}>☰</span>}
          </div>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: BRAND }} />
        </div>
      </div>
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto', scrollbarGutter: 'stable both-edges',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: align === 'center' ? 'safe center' : 'flex-start',
        padding: mobile ? '12px 16px' : '16px 24px',
        paddingBottom: bottomBar ? (mobile ? 120 : 96) : undefined,
        boxSizing: 'border-box',
      }}>
        {children}
      </div>
      {!mobile && hud !== 'header' && (
        <div style={{ position: 'absolute', right: 0, top: 59, bottom: 0, width: 18, borderLeft: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>‹</div>
      )}
      {bottomBar && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'rgba(30,30,30,0.96)', borderTop: `1px solid ${BORDER}`,
          padding: mobile ? '12px 16px 20px' : '14px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          {bottomBar}
        </div>
      )}
    </div>
  )
}

function Sep() {
  return <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 6px' }}>/</span>
}

export function HudStreak({ compact }) {
  return (
    <div style={{ minHeight: compact ? 36 : 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>Streak: 4</span>
      {!compact && <span style={{ fontSize: FS_BASE, color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>Best streak: 12</span>}
    </div>
  )
}

export function HudCounts({ inline }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: inline ? 13 : FS_BASE, alignItems: 'center', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#4ade80' }}>7 Correct</span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
      <span style={{ color: '#fbbf24' }}>2 Troubled</span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>17 Remaining</span>
    </div>
  )
}

export function UndoSlot({ width }) {
  return (
    <div style={{ width, textAlign: 'center', padding: '8px 0', color: 'rgba(255,255,255,0.55)', fontSize: FS_BASE }}>Undo</div>
  )
}

// ── Verdict row ───────────────────────────────────────────────────────────

export function VerdictRow({ flipped, width, mobile, onVerdict, placeholder }) {
  if (!flipped) {
    return (
      <div style={{ width, height: DRILL_ROW_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: FS_BASE }}>
        {placeholder ?? (mobile ? 'Tap to flip' : 'Click to flip')}
      </div>
    )
  }
  return (
    <div style={{ width, height: DRILL_ROW_HEIGHT, display: 'flex', gap: 8 }}>
      <DrillButton label="Incorrect" hint={mobile ? null : 'Z'} color={DRILL_COLORS.again} onClick={() => onVerdict(false)} />
      <DrillButton label="Correct" hint={mobile ? null : 'X'} color={DRILL_COLORS.good} onClick={() => onVerdict(true)} />
    </div>
  )
}

// ── Furigana ──────────────────────────────────────────────────────────────

// Ruby is always laid out, only hidden, so toggling furigana never moves a line.
export function Ruby({ text, reading, show = true, rtColor = INK_MUTED }) {
  if (!reading || reading === text || !hasKanji(text)) return <>{text}</>
  const rt = s => <rt style={{ fontSize: '0.45em', color: rtColor, visibility: show ? 'visible' : 'hidden', letterSpacing: '0.04em' }}>{s}</rt>
  const parts = buildFurigana(text, reading)
  if (!parts) return <ruby>{text}{rt(reading)}</ruby>
  return parts.map((p, i) => p.type === 'kanji'
    ? <ruby key={i}>{p.text}{rt(p.furigana)}</ruby>
    : <span key={i}>{p.text}</span>)
}

// ── Flip card (today's paper card) ────────────────────────────────────────

export function PaperCard({ width, flipped, onFlip, front, back }) {
  const height = Math.round(width * 280 / 380)
  return (
    <div style={{ width, height, containerType: 'size' }}>
      <FlipCard front={front} back={back} width="100%" height="100%" flipped={flipped} onFlip={() => onFlip?.()} />
    </div>
  )
}

export function Paper({ children, style }) {
  return <div style={{ position: 'relative', background: PAPER, width: '100%', height: '100%', color: INK, ...style }}>{children}</div>
}

// The card's big word — same cqw scale as VocabCard's front/back.
export function BigWord({ word, showReading, size = 12.63 }) {
  const scale = word.form.length >= 8 ? 0.7 : word.form.length >= 6 ? 0.85 : 1
  return (
    <Japanese as="div" style={{
      fontFamily: KANJI_FONT, fontSize: `${(size * scale).toFixed(2)}cqw`, lineHeight: 1.4,
      textShadow: '2px 2px 0 rgba(0,0,0,0.25)', textAlign: 'center', color: INK,
    }}>
      <Ruby text={word.form} reading={word.reading} show={showReading} />
    </Japanese>
  )
}

export function Meaning({ word, size = 5.26 }) {
  return (
    <div style={{ fontFamily: FONT, fontSize: `${size}cqw`, letterSpacing: '0.04em', color: '#555', textAlign: 'center', padding: '0 4cqw' }}>
      {word.gloss}
    </div>
  )
}

// Today's KanjiMeaningBar, optionally selectable (concepts B/C use the tiles as tabs).
export function KanjiBar({ word, selected, onSelect, scale = 1 }) {
  const chars = kanjiOf(word.form)
  return (
    <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.14)', backgroundColor: 'rgba(0,0,0,0.035)' }}>
      {chars.map((ch, i) => {
        const isSel = selected === ch
        return (
          <div
            key={ch}
            className={onSelect ? 'lab-kanji-tile' : undefined}
            onClick={onSelect ? e => { e.stopPropagation(); onSelect(ch) } : undefined}
            style={{
              flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '1.8cqw 1cqw', gap: 2,
              borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.1)' : 'none',
              background: isSel ? 'rgba(255,0,77,0.08)' : 'transparent',
              boxShadow: isSel ? `inset 0 3px 0 ${BRAND}` : 'none',
            }}
          >
            <Japanese as="span" style={{ fontFamily: KANJI_FONT, fontSize: `${5 * scale}cqw`, color: '#333' }}>{ch}</Japanese>
            <div style={{ fontFamily: FONT, fontSize: `${2.6 * scale}cqw`, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {KANJI[ch]?.meaning}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Sentences ─────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  target: () => 'This card',
  lesson: () => 'Also in this lesson',
  known: t => t.src ? `Known · ${t.src.split(' · ').pop()}` : 'Known',
  new: () => 'New to you',
}
const STATUS_COLOR = { target: BRAND_TEXT, lesson: '#fbbf24', known: '#4ade80', new: TEXT_MUTED }

function groupTokens(tokens) {
  const out = []
  tokens.forEach((t, i) => {
    const last = out[out.length - 1]
    if (t.status === 'target' && last?.target) last.tokens.push({ ...t, i })
    else out.push({ target: t.status === 'target', tokens: [{ ...t, i }] })
  })
  return out
}

function showRubyFor(t, furigana) {
  if (!t.r) return false
  if (furigana === 'all') return true
  if (furigana === 'new') return t.status === 'new' || t.status === 'lesson'
  return false
}

export function TokenPopover({ token, dark, status = true }) {
  return (
    <span className="lab-fade-up" style={{
      position: 'absolute', bottom: 'calc(100% + 2px)', left: '50%', transform: 'translateX(-50%)',
      zIndex: 20, width: 'max-content', maxWidth: 240, textAlign: 'left',
      background: '#2A2A2A', color: TEXT, border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : BORDER}`, borderRadius: 8,
      padding: '8px 12px', fontFamily: FONT, fontSize: 13, lineHeight: 1.45, letterSpacing: TRACKING,
      boxShadow: '0 6px 20px rgba(0,0,0,0.35)', whiteSpace: 'normal', display: 'block',
    }}>
      <span style={{ display: 'block', fontSize: 18, fontFamily: KANJI_FONT }}>
        <Japanese>{token.base}</Japanese>
        {token.r && <Japanese style={{ fontSize: 12, color: TEXT_MUTED, marginLeft: 8 }}>{token.r}</Japanese>}
      </span>
      {token.g && <span style={{ display: 'block', color: TEXT }}>{token.g}</span>}
      {status && (
        <span style={{ display: 'block', color: STATUS_COLOR[token.status] ?? TEXT_MUTED, fontSize: 12, marginTop: 2 }}>
          {STATUS_LABEL[token.status]?.(token) ?? ''}
        </span>
      )}
    </span>
  )
}

// A tokenized sentence. `furigana`: 'off' | 'new' (words not yet learned) | 'all'.
// `target`: 'highlight' | 'reveal' (highlight + its reading) | 'blank' (cloze).
// `redact`: render the same tokens, same ruby, same widths — as bars. Laid
// over the real sentence, the two crossfade without anything reflowing.
export function SentenceText({ sentence, furigana = 'new', target = 'highlight', size = 22, dark = false, active, onTap, align = 'left', lineHeight = 2.05, redact = false, rubyPosition = 'over', targetBold = false, tokenStatus = true }) {
  const ink = dark ? TEXT : INK
  const rtColor = redact ? 'transparent' : dark ? TEXT_MUTED : INK_MUTED
  const tokClass = dark ? 'lab-tok lab-tok--dark' : 'lab-tok'
  const tap = i => e => { e.stopPropagation(); onTap?.(active === i ? null : i) }

  return (
    <div style={{ fontFamily: KANJI_FONT, fontSize: size, lineHeight, color: ink, textAlign: align, letterSpacing: '0.02em', rubyPosition }}>
      {groupTokens(sentence.tokens).map((seg, si) => {
        if (seg.target) {
          const text = seg.tokens.map(t => t.t).join('')
          if (target === 'blank') {
            return (
              <span key={si} style={{ display: 'inline-block', width: `${text.length * 1.05}em`, height: '1.1em', verticalAlign: '-0.15em', background: 'rgba(0,0,0,0.07)', boxShadow: `inset 0 -2px 0 ${BRAND}`, borderRadius: 3, margin: '0 2px' }} />
            )
          }
          const head = seg.tokens[0]
          return (
            <span key={si} style={{ position: 'relative' }}>
              <Japanese className={onTap ? tokClass : undefined} onClick={onTap ? tap(head.i) : undefined} style={targetBold
                ? { ...(redact ? REDACT_BAR : null), fontWeight: 700 }
                : redact ? { ...REDACT_BAR, padding: '0 1px' } : { background: TARGET_BG, boxShadow: `inset 0 -2px 0 ${BRAND}`, borderRadius: 3, padding: '0 1px' }}>
                {seg.tokens.map(t => <Ruby key={t.i} text={t.t} reading={t.r} show={target === 'reveal'} rtColor={redact ? 'transparent' : targetBold ? rtColor : dark ? BRAND_TEXT : '#b0003a'} />)}
              </Japanese>
              {active === head.i && <TokenPopover token={{ ...head, t: text, base: head.base }} dark={dark} status={tokenStatus} />}
            </span>
          )
        }
        const t = seg.tokens[0]
        const lessonMark = t.status === 'lesson' ? { boxShadow: `inset 0 -1px 0 ${dark ? '#fbbf24' : '#b08400'}` } : null
        return (
          <span key={si} style={{ position: 'relative' }}>
            <Japanese className={onTap && t.w ? tokClass : undefined} onClick={onTap && t.w ? tap(t.i) : undefined} style={redact ? REDACT_BAR : lessonMark ?? undefined}>
              <Ruby text={t.t} reading={t.r} show={showRubyFor(t, furigana)} rtColor={rtColor} />
            </Japanese>
            {active === t.i && <TokenPopover token={t} dark={dark} status={tokenStatus} />}
          </span>
        )
      })}
    </div>
  )
}

export function SpellingNote({ dark }) {
  return (
    <div style={{ fontFamily: FONT, fontSize: 12, color: dark ? WARN_DARK : '#8a6200', marginTop: 4 }}>
      This sentence spells it differently from the card
    </div>
  )
}
const WARN_DARK = '#fbbf24'

// ── Small in-surface controls ─────────────────────────────────────────────

export function IconBtn({ children, onClick, dark, title, active }) {
  return (
    <button
      type="button"
      title={title}
      className={`lab-icon-btn${dark ? ' lab-icon-btn--dark' : ''}`}
      onClick={e => { e.stopPropagation(); onClick?.() }}
      style={{
        border: 'none', borderRadius: 6, padding: '4px 8px', minWidth: 28, height: 28,
        background: active ? (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
        color: dark ? 'rgba(255,255,255,0.7)' : '#555', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}
    >
      {children}
    </button>
  )
}

export function Pager({ index, count, onChange, dark }) {
  if (count <= 1) return <span style={{ fontSize: 12, color: dark ? TEXT_MUTED : '#888', padding: '0 6px' }}>1 example</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <IconBtn dark={dark} title="Previous example" onClick={() => onChange((index - 1 + count) % count)}>‹</IconBtn>
      <span style={{ fontSize: 12, color: dark ? TEXT_MUTED : '#777', minWidth: 30, textAlign: 'center' }}>{index + 1}/{count}</span>
      <IconBtn dark={dark} title="Next example" onClick={() => onChange((index + 1) % count)}>›</IconBtn>
    </span>
  )
}

export function English({ sentence, mode, revealed, onReveal, dark, size = 14 }) {
  if (mode === 'hide') return null
  if (mode === 'tap' && !revealed) {
    return (
      <button type="button" onClick={e => { e.stopPropagation(); onReveal() }} className={`lab-icon-btn${dark ? ' lab-icon-btn--dark' : ''}`} style={{
        border: `1px dashed ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, background: 'transparent', borderRadius: 6,
        padding: '4px 10px', color: dark ? TEXT_MUTED : '#777', fontFamily: FONT, fontSize: 13, letterSpacing: TRACKING, alignSelf: 'flex-start',
      }}>
        Show translation
      </button>
    )
  }
  return <div style={{ fontFamily: FONT, fontSize: size, color: dark ? TEXT_MUTED : '#666', lineHeight: 1.5 }}>{sentence.english}</div>
}

// ── Kanji family ──────────────────────────────────────────────────────────

// One word that shares the kanji, with the shared character picked out.
export function WordChip({ v, ch, dim, dark, compact }) {
  const bg = dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'
  const border = dim
    ? `1px dashed ${dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}`
    : `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
  return (
    <div className="lab-chip" style={{
      background: dim ? 'transparent' : bg, border, borderRadius: 8,
      padding: compact ? '4px 8px' : '6px 10px', display: 'flex', flexDirection: 'column', gap: 1,
      minWidth: 0, maxWidth: compact ? 150 : 180, opacity: dim ? 0.8 : 1,
    }}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <Japanese style={{ fontFamily: KANJI_FONT, fontSize: compact ? 16 : 18, color: dark ? TEXT : INK, whiteSpace: 'nowrap' }}>
          {[...v.form].map((c, i) => <span key={i} style={c === ch ? { color: dark ? BRAND_TEXT : '#c4003d', fontWeight: 600 } : undefined}>{c}</span>)}
        </Japanese>
        <Japanese style={{ fontSize: 11, color: dark ? TEXT_MUTED : '#777', whiteSpace: 'nowrap' }}>{v.reading}</Japanese>
      </span>
      <span style={{ fontFamily: FONT, fontSize: 11, color: dark ? TEXT_MUTED : '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {v.gloss}
      </span>
    </div>
  )
}

export function KanjiReadings({ ch, dark }) {
  const k = KANJI[ch]
  const muted = dark ? TEXT_MUTED : '#777'
  return (
    <span style={{ fontSize: 12, color: muted }}>
      {k.on.length > 0 && <>on <Japanese style={{ color: dark ? TEXT : '#444' }}>{k.on.join('、')}</Japanese></>}
      {k.on.length > 0 && k.kun.length > 0 && <span style={{ margin: '0 6px' }}>·</span>}
      {k.kun.length > 0 && <>kun <Japanese style={{ color: dark ? TEXT : '#444' }}>{k.kun.join('、')}</Japanese></>}
    </span>
  )
}

export function FamilyGroup({ title, items, ch, dim, dark, compact, empty, max = 6 }) {
  const shown = items.slice(0, max)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: dark ? TEXT_MUTED : '#777', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}{items.length > max ? ` · ${items.length}` : ''}
      </div>
      {shown.length > 0
        ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{shown.map(v => <WordChip key={v.form} v={v} ch={ch} dim={dim} dark={dark} compact={compact} />)}</div>
        : <div style={{ fontSize: 13, color: dark ? TEXT_MUTED : '#888' }}>{empty}</div>}
    </div>
  )
}

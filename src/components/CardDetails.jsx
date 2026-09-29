import { createContext, useContext, useState, useRef, useEffect, useLayoutEffect } from 'react'
import Japanese from './Japanese.jsx'
import WordPopup from './WordPopup.jsx'
import { FONT, TEXT, TEXT_MUTED, BORDER, TRACKING, BRAND_TEXT } from '../data/theme.js'
import { briefGloss } from '../utils/dictionaryEntryLookup.js'
import { useKanjiMeanings } from '../hooks/useKanjiMeanings.js'
import { kanjiCharsOf } from '../utils/kanjiMeaningLookup.js'

// The details panel under a drill card: the example sentence (words tappable,
// furigana by what the learner already knows, translation off / blurred / on)
// and the card word's kanji, each opening the other words the learner has met
// that share it. Explored in the Drill Card Context labs (iterations 1–7).
//
// One panel for both faces. Before the flip every word is a redaction bar in
// the exact shape of the real text; on the flip the bars fade out as the words
// fade in, in place, timed to the card's own 450ms turn — so nothing moves,
// reflows or remounts, and nothing gives the answer away early.

// The panel's colours. Dark by default — an outline on the page, no fill — so
// the card above is the one light thing on screen; the sun in the panel's
// corner switches it to paper, like the card (the `detailsTheme` setting).
// Chosen in the Details Panel Dark lab, which also passes `palette` to try
// other colours without a second copy of the panel.
const PAPER_PALETTE = {
  bg: '#E8E4DE',
  ink: '#222',
  target: '#222',
  rt: '#6b6b6b',
  quiet: '#777',
  tileInk: '#333',
  corner: '#555',
  bar: 'rgba(0,0,0,0.13)',
  hover: 'rgba(0,0,0,0.07)',
  footerBg: 'rgba(0,0,0,0.035)',
  footerBorder: 'rgba(0,0,0,0.12)',
  divider: 'rgba(0,0,0,0.09)',
  openTint: 'rgba(255,0,77,0.08)',
  // Transparent, not none: the dark panel's hairline is 1px, and without the
  // same 1px here every word shifted a pixel when switching between the two.
  border: '1px solid transparent',
  shadow: '0 4px 0 rgba(0,0,0,0.25)',
  popBg: '#2A2A2A',
  popBorder: BORDER,
}
const OUTLINE_PALETTE = {
  ...PAPER_PALETTE,
  bg: 'transparent',
  ink: '#E8E8E8',
  target: '#FFFFFF',
  rt: '#8f8f8f',
  quiet: '#8f8f8f',
  tileInk: '#D6D6D6',
  corner: '#A0A0A0',
  bar: 'rgba(255,255,255,0.10)',
  hover: 'rgba(255,255,255,0.06)',
  footerBg: 'transparent',
  footerBorder: 'rgba(255,255,255,0.10)',
  divider: 'rgba(255,255,255,0.08)',
  openTint: 'rgba(255,92,138,0.12)',
  border: '1px solid rgba(255,255,255,0.14)',
  shadow: 'none',
}
const PaletteContext = createContext(PAPER_PALETTE)
const usePalette = () => useContext(PaletteContext)

// The card's flip is 450ms. The fade starts on the same tap and runs a little
// longer, so the words are fully in just after the card lands, and out again
// the same way when the flip is undone.
const FADE = 'opacity 500ms ease'

// The line height holds the furigana inside each line's half-leading, so a
// line with or without furigana (above or below) is the same height, and the
// insets can be measured to the kanji the way the eye measures them.
const SENTENCE_LH = 1.95
const CORNER_BTN = 30
const POPOVER_CAP = 3
const EMPTY = new Set()

// Reserved room under the card, [desktop, phone], by which halves are on:
// two lines of sentence plus its translation and the kanji tiles, measured
// from the rendered panel (1px border included) so a panel exactly that tall
// doesn't nudge the buttons by a pixel or two. The panel hugs its content at
// the top of the slot, so the card and the buttons below hold still from
// card to card. A sentence longer than two lines steps its type down to fit
// (useFitLines) rather than grow the panel.
// On a phone that's also room for a longer sentence at its smallest step,
// which still takes three narrow lines.
const SLOT = {
  both: [225, 207],
  sentence: [166, 150],
  kanji: [80, 76],
}
const SENTENCE_LINES = 2
const MIN_FIT = 0.8

// A bar the width of the text it covers, with a 3px gap on its right so a run
// of words reads as separate words. An SVG rounded rect with no viewBox keeps
// a 3px radius at any size — border-radius would round the element's box, not
// the narrower bar — and box-decoration-break gives every wrapped line its own.
function redactBar(fill) {
  return {
    color: 'transparent',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' rx='3' fill='${encodeURIComponent(fill)}'/%3E%3C/svg%3E")`,
    backgroundSize: 'calc(100% - 3px) 100%',
    backgroundRepeat: 'no-repeat',
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
  }
}

// Steps a sentence's type down, 5% at a time to at most MIN_FIT, until it
// fits the lines its slot reserves — measured before paint, so a long
// sentence never shows at full size first. Keyed per card with the panel.
function useFitLines(ref, lineHeight, maxLines, deps) {
  const [fit, setFit] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const lines = el.getBoundingClientRect().height / (lineHeight * fit)
    if (lines > maxLines + 0.25 && fit > MIN_FIT) setFit(f => Math.max(MIN_FIT, Math.round((f - 0.05) * 100) / 100))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit, lineHeight, maxLines, ...deps])
  return fit
}

function metrics(mobile) {
  const size = mobile ? 21 : 26
  const inset = mobile ? 16 : 24
  const halfLeading = ((SENTENCE_LH - 1) * size) / 2
  return { size, inset, pad: Math.max(4, Math.round(inset - halfLeading)), firstLine: SENTENCE_LH * size, corner: mobile ? 6 : 10 }
}

const firstGloss = g => (g ?? '').split(';')[0].replace(/\s*\(.*?\)\s*/g, ' ').trim()

// ── Sentence ──────────────────────────────────────────────────────────────

// Hidden furigana keeps its box (visibility, not display), so switching the
// furigana setting or crossing to the redacted twin never moves a line.
function Reading({ token, show, color }) {
  if (!token.parts) return token.t
  const covered = token.parts.map(p => p.text).join('')
  return (
    <>
      {token.parts.map((p, i) => (p.type === 'kanji'
        ? <ruby key={i}>{p.text}<rt style={{ fontSize: '0.45em', color, visibility: show ? 'visible' : 'hidden', letterSpacing: '0.04em' }}>{p.furigana}</rt></ruby>
        : <span key={i}>{p.text}</span>))}
      {token.t.slice(covered.length)}
    </>
  )
}

// A tapped word opens the app's one word lookup (WordPopup), in its
// dictionary form. The wrapper keeps the lookup's clicks — including those in
// its phone sheet, which React still bubbles through here — from reaching the
// panel, whose own click closes it.
function WordLookup({ token, entry, rect, mobile, srsData, saveSrs, onClose }) {
  if (!token) return null
  const reading = entry?.kana_forms?.[0]
  const text = token.form ?? token.t
  return (
    <span onClick={e => e.stopPropagation()}>
      <WordPopup
        word={{ text, reading, meaning: briefGloss(entry) ?? '', kana: reading !== text ? reading : undefined, jmdictId: token.id }}
        anchorRect={rect}
        isMobile={mobile}
        srsData={srsData}
        saveSrs={saveSrs}
        onClose={onClose}
      />
    </span>
  )
}

function SentenceText({ tokens, furigana, knownIds, rubyPosition, size, jaFont, redact, active, onTap }) {
  const pal = usePalette()
  const rtColor = redact ? 'transparent' : pal.rt
  const bar = redactBar(pal.bar)
  return (
    <div style={{ fontFamily: jaFont, fontSize: size, lineHeight: SENTENCE_LH, color: pal.ink, letterSpacing: '0.02em', rubyPosition }}>
      {tokens.map((tok, i) => {
        const tappable = !!tok.id && !redact && !!onTap
        const show = tok.target || furigana === 'all' || (furigana === 'new' && !!tok.id && !knownIds.has(tok.id))
        const style = redact && (tok.id || tok.target) ? { ...bar } : {}
        if (tok.target) { style.fontWeight = 700; if (!redact) style.color = pal.target }
        if (!tok.id && !tok.target) {
          return <Japanese key={i} style={redact ? bar : undefined}>{tok.t}</Japanese>
        }
        return (
          <span key={i} style={{ position: 'relative' }}>
            <Japanese
              className={tappable ? 'details-tok' : undefined}
              onClick={tappable ? e => { e.stopPropagation(); onTap(active === i ? null : i, e.currentTarget.getBoundingClientRect()) } : undefined}
              style={style}
            >
              <Reading token={tok} show={show} color={rtColor} />
            </Japanese>
          </span>
        )
      })}
    </div>
  )
}

// The real content and its redacted twin, stacked in one box. Only the
// opacities change on the flip.
function Layered({ revealed, block, style, children }) {
  const pal = usePalette()
  const T = block ? 'div' : 'span'
  return (
    <T style={{ position: 'relative', display: block ? 'block' : 'inline-block', maxWidth: '100%', ...style }}>
      <T style={{ display: block ? 'block' : 'inline', opacity: revealed ? 1 : 0, transition: FADE }}>{children}</T>
      <T aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: revealed ? 0 : 1, transition: FADE, pointerEvents: 'none' }}>
        <span style={redactBar(pal.bar)}>{children}</span>
      </T>
    </T>
  )
}

// ── Kanji ─────────────────────────────────────────────────────────────────

// The word with the kanji it shares picked out.
function Shared({ form, ch }) {
  return (
    <Japanese style={{ fontSize: 16, color: TEXT, whiteSpace: 'nowrap' }}>
      {[...form].map((c, i) => <span key={i} style={c === ch ? { color: BRAND_TEXT } : undefined}>{c}</span>)}
    </Japanese>
  )
}

function KanjiPopover({ ch, groups, style }) {
  const pal = usePalette()
  return (
    <div className="details-pop" onClick={e => e.stopPropagation()} style={{
      position: 'absolute', zIndex: 25, boxSizing: 'border-box', width: 260, maxWidth: 'calc(100vw - 32px)',
      background: pal.popBg, color: TEXT, border: `1px solid ${pal.popBorder}`, borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.45)', fontFamily: FONT, letterSpacing: TRACKING, textAlign: 'left',
      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, ...style,
    }}>
      {groups.length === 0 && (
        <span style={{ fontSize: 13, color: TEXT_MUTED }}>The first word you’ve met with <Japanese>{ch}</Japanese>.</span>
      )}
      {groups.map(g => (
        <div key={g.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{g.label}</div>
          {g.items.slice(0, POPOVER_CAP).map(v => (
            <span key={v.form} style={{ display: 'flex', alignItems: 'baseline', gap: 16, minWidth: 0 }}>
              <Shared form={v.form} ch={ch} />
              <span style={{ marginLeft: 'auto', fontSize: 13, color: TEXT_MUTED, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstGloss(v.gloss)}</span>
            </span>
          ))}
          {g.items.length > POPOVER_CAP && <span style={{ fontSize: 12, color: TEXT_MUTED }}>+{g.items.length - POPOVER_CAP} more</span>}
        </div>
      ))}
    </div>
  )
}

function groupsFor(ch, form, related, lessonLabel) {
  const seen = new Set([form])
  const pick = group => (related?.[group] ?? []).filter(v => {
    if (!v.form?.includes(ch) || seen.has(v.form)) return false
    seen.add(v.form)
    return true
  })
  return [
    { label: 'You know', items: pick('known') },
    { label: lessonLabel, items: pick('lesson') },
  ].filter(g => g.items.length > 0)
}

function KanjiFooter({ chars, meanings, form, related, lessonLabel, mobile, revealed, standalone, open, onOpen, jaFont }) {
  const pal = usePalette()
  // Kanji-only: the tiles are the whole panel, so they take its corners and a
  // little more room than as a footer under a sentence.
  const r = mobile ? 0 : 6
  return (
    <div style={{ display: 'flex', borderTop: standalone ? 'none' : `1px solid ${pal.footerBorder}`, background: standalone ? 'transparent' : pal.footerBg, borderRadius: standalone ? r : `0 0 ${r}px ${r}px` }}>
      {chars.map((ch, i) => {
        const isOpen = revealed && open === ch
        const groups = groupsFor(ch, form, related, lessonLabel)
        const first = i === 0
        const last = i === chars.length - 1
        return (
          <div key={`${ch}-${i}`} style={{ position: 'relative', flex: 1, minWidth: 0, borderLeft: first ? 'none' : `1px solid ${pal.divider}` }}>
            <button
              type="button"
              className={revealed ? 'details-tile' : undefined}
              aria-expanded={isOpen}
              tabIndex={revealed ? 0 : -1}
              onClick={revealed ? e => { e.stopPropagation(); onOpen(open === ch ? null : ch) } : undefined}
              style={{
                width: '100%', border: 'none', cursor: revealed ? 'pointer' : 'default',
                padding: standalone ? (mobile ? '12px 6px 13px' : '14px 8px 15px') : mobile ? '7px 6px 8px' : '8px 8px 9px',
                background: isOpen ? pal.openTint : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                // Kanji only, the corner buttons' column takes the right-hand
                // corners, so only the first tile rounds (on its left).
                borderRadius: standalone
                  ? (first ? `${r}px 0 0 ${r}px` : 0)
                  : first && last ? `0 0 ${r}px ${r}px` : first ? `0 0 0 ${r}px` : last ? `0 0 ${r}px 0` : 0,
              }}
            >
              <Japanese style={{ fontFamily: jaFont, fontSize: standalone ? (mobile ? 22 : 24) : mobile ? 18 : 20, lineHeight: 1.2, color: pal.tileInk }}>{ch}</Japanese>
              <Layered revealed={revealed} style={{ fontFamily: FONT, fontSize: 11, color: pal.quiet, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '1.2em' }}>
                {meanings[ch] || ' '}
              </Layered>
            </button>
            {isOpen && (
              <KanjiPopover ch={ch} groups={groups} style={{ bottom: 'calc(100% + 6px)', ...(i < chars.length / 2 ? { left: 0 } : { right: 0 }) }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Corner ────────────────────────────────────────────────────────────────

function SpeakerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M2 7 H5 L9 3.5 V14.5 L5 11 H2 Z" fill="currentColor" />
      <path d="M12 6.2 Q14 9 12 11.8 M14.2 4.2 Q17.6 9 14.2 13.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M3 3 L11 11 M11 3 L3 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M13 9.6A5.5 5.5 0 0 1 6.4 3a5.5 5.5 0 1 0 6.6 6.6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function CornerButton({ title, onClick, tabIndex, children }) {
  const pal = usePalette()
  return (
    <button type="button" title={title} aria-label={title} tabIndex={tabIndex} className="details-corner" onClick={e => { e.stopPropagation(); onClick?.() }} style={{
      width: CORNER_BTN, height: CORNER_BTN, border: 'none', borderRadius: 8, padding: 0,
      background: 'transparent', color: pal.corner, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </button>
  )
}

// Replay (only with a sentence, and only once revealed — playing it earlier
// would say the answer), the light / dark switch, and hide, side by side. The
// last two are there on both faces: they're controls for the panel, not
// content. The switch shows where it goes: a sun on the dark panel, a moon on
// the light one.
function Corner({ top, right, revealed, onPlay, dark, onToggleTheme, onHide, stacked }) {
  const pal = usePalette()
  return (
    <div style={stacked
      ? { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, padding: '0 4px', flexShrink: 0, borderLeft: `1px solid ${pal.divider}` }
      : { position: 'absolute', top, right, display: 'flex', gap: 2, zIndex: 2 }}>
      {onPlay && (
        <span style={{ opacity: revealed ? 1 : 0, transition: FADE, pointerEvents: revealed ? 'auto' : 'none' }}>
          <CornerButton title="Play sentence" onClick={onPlay} tabIndex={revealed ? 0 : -1}><SpeakerIcon /></CornerButton>
        </span>
      )}
      <CornerButton title={dark ? 'Light panel' : 'Dark panel'} onClick={onToggleTheme}>{dark ? <SunIcon /> : <MoonIcon />}</CornerButton>
      <CornerButton title="Hide details" onClick={onHide}><CloseIcon /></CornerButton>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────

function Panel({ word, sentence, showSentence, showKanji, chars, meanings, related, lessonLabel, settings, knownIds, revealed, leaving, mobile, jaFont, srsData, saveSrs, onHide, onToggleTheme, onPlaySentence }) {
  const pal = usePalette()
  // The tapped word: its index in the sentence and where it sits on screen,
  // for the word lookup to anchor to.
  const [tok, setTok] = useState(null)
  const [open, setOpen] = useState(null)
  const [translationShown, setTranslationShown] = useState(false)
  const ref = useRef(null)

  // One popover at a time, and a tap anywhere else closes it. Inside the
  // panel that's the panel's own click handler below (words, tiles and the
  // popovers stop their clicks reaching it). Outside it, the word lookup
  // closes itself (it's the shared Popover); the kanji list is closed here.
  function closePopovers() { setTok(null); setOpen(null) }
  useEffect(() => {
    if (open == null) return undefined
    function onDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // Flipping back hides the answer again, popovers included.
  useEffect(() => {
    if (!revealed) { setTok(null); setOpen(null) }
  }, [revealed])

  const m = metrics(mobile)
  const sentenceRef = useRef(null)
  const fit = useFitLines(sentenceRef, SENTENCE_LH * m.size, SENTENCE_LINES, [mobile, settings.readingPosition, sentence?.japanese])

  const radius = mobile ? 0 : 6
  const box = {
    position: 'relative', boxSizing: 'border-box', width: '100%',
    background: pal.bg, color: pal.ink, borderRadius: radius, boxShadow: pal.shadow, textAlign: 'left',
    '--details-hover': pal.hover,
    // Edge to edge on a phone: a border on the screen's own edges is noise.
    // Longhands only — React warns when a shorthand and its longhands mix.
    borderTop: pal.border, borderBottom: pal.border,
    borderLeft: mobile ? 'none' : pal.border, borderRight: mobile ? 'none' : pal.border,
  }
  const dark = settings.detailsTheme !== 'light'
  // Between cards the words go before the card does: they fade out with the
  // answered card's exit, and the next card's fade in as it arrives, so the
  // panel never swaps one sentence for another in plain sight.
  const content = { opacity: leaving ? 0 : 1, transition: 'opacity 200ms ease' }
  const footer = showKanji && (
    <KanjiFooter
      chars={chars} meanings={meanings} form={word.form} related={related} lessonLabel={lessonLabel}
      mobile={mobile} revealed={revealed} standalone={!showSentence} open={open} jaFont={jaFont}
      onOpen={ch => { setOpen(ch); setTok(null) }}
    />
  )

  if (!showSentence) {
    return (
      // Kanji only: the switch and hide stack in a column beside the tiles
      // rather than sit over the last one.
      <div ref={ref} data-details-panel="" style={{ ...box, display: 'flex' }} onClick={closePopovers}>
        <div className="details-content-in" style={{ ...content, flex: 1, minWidth: 0 }}>{footer}</div>
        <Corner stacked revealed={revealed} dark={dark} onToggleTheme={onToggleTheme} onHide={onHide} />
      </div>
    )
  }

  const translation = settings.sentenceTranslation !== 'off' && !!sentence.english
  const blurred = settings.sentenceTranslation === 'blur' && !translationShown
  const bottom = translation ? m.inset : m.pad
  // The float reserves the corner buttons' room on the first line only.
  const spacer = <span aria-hidden="true" style={{ float: 'right', width: CORNER_BTN * 3 + 4 - (mobile ? 12 : 8), height: m.firstLine * fit }} />
  const text = {
    tokens: sentence.tokens, furigana: settings.sentenceFurigana, knownIds,
    rubyPosition: settings.readingPosition === 'below' ? 'under' : 'over', size: m.size * fit, jaFont,
  }

  return (
    <div ref={ref} data-details-panel="" style={box} onClick={closePopovers}>
      <div style={{ position: 'relative', padding: `${m.pad}px ${m.inset}px ${bottom}px`, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="details-content-in" style={{ position: 'relative', ...content }}>
          <div ref={sentenceRef} style={{ opacity: revealed ? 1 : 0, transition: FADE, pointerEvents: revealed ? 'auto' : 'none' }}>
            {spacer}
            <SentenceText {...text} active={tok?.i} onTap={(i, rect) => { setTok(i == null ? null : { i, rect }); setOpen(null) }} />
          </div>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: revealed ? 0 : 1, transition: FADE, pointerEvents: 'none' }}>
            {spacer}
            <SentenceText {...text} redact />
          </div>
        </div>
        {translation && (
          <Layered block revealed={revealed} style={{ fontFamily: FONT, fontSize: mobile ? 13 : 14, color: pal.quiet, lineHeight: 1.5, letterSpacing: TRACKING, ...content }}>
            <span
              className={blurred ? 'details-blur' : undefined}
              title={blurred ? 'Tap to reveal' : undefined}
              onClick={blurred && revealed ? e => { e.stopPropagation(); setTranslationShown(true) } : undefined}
              style={{ filter: blurred ? 'blur(4px)' : 'none', transition: 'filter 250ms ease', userSelect: blurred ? 'none' : 'auto' }}
            >
              {sentence.english}
            </span>
          </Layered>
        )}
        <Corner top={m.corner} right={m.corner} revealed={revealed} onPlay={onPlaySentence} dark={dark} onToggleTheme={onToggleTheme} onHide={onHide} />
      </div>
      {tok && <WordLookup token={sentence.tokens[tok.i]} entry={sentence.entries?.[sentence.tokens[tok.i]?.id]} rect={tok.rect} mobile={mobile} srsData={srsData} saveSrs={saveSrs} onClose={() => setTok(null)} />}
      {footer && <div className="details-content-in" style={content}>{footer}</div>}
    </div>
  )
}

/**
 * The reserved slot under a drill card, holding the details panel — or, with
 * the panel hidden, the quiet button that brings it back.
 *
 * @param {object}  word          { form, reading } as the card shows them
 * @param {string}  cardKey       resets popovers and a tapped translation per card
 * @param {object}  sentence      { japanese, english, tokens, entries } from
 *                                useCardSentence, or null when there's none
 * @param {object}  settings      from useDrillSettings
 * @param {Set}     knownIds      jmdictIds the learner knows — their furigana
 *                                drops in the 'new' furigana mode
 * @param {object}  related       { known: [], lesson: [] } of { form, gloss },
 *                                the words a kanji tile opens
 * @param {string}  lessonLabel   heading for `related.lesson`
 * @param {boolean} revealed      the card is flipped
 * @param {boolean} leaving       the card is on its way out (answered) — the
 *                                panel's words fade with it
 * @param {function} onChangeSetting (key, value) — the panel's × and the
 *                                Show details button write `details`
 * @param {object}  palette       overrides for the panel's colours (labs only)
 * @param {object}  kanjiMeanings { [kanji]: meaning } instead of fetching them
 *                                (stories and labs with frozen data)
 * @param {object}  srsData       the drill's `vocab-srs` progress, and `saveSrs`
 *                                its save — a tapped word can be added to a
 *                                review deck from its lookup (WordPopup)
 * @param {boolean} reserve       hold the slot's room even when the panel is
 *                                shorter, so a vertically centred stage (and
 *                                its card) holds still from card to card. A
 *                                phone drill pins its stage to the top instead
 *                                and passes false — on a short screen the
 *                                invisible room was what made the page scroll
 * @param {function} onReady      called once the panel has everything it will
 *                                show — the drill holds its first card back
 *                                until then, so card and panel arrive together
 */
export default function CardDetails({
  word, cardKey, sentence, settings, knownIds, related, lessonLabel = 'This lesson',
  revealed, leaving = false, mobile, jaFont, onChangeSetting, onPlaySentence, palette, kanjiMeanings, onReady, srsData, saveSrs, reserve = true,
}) {
  const shown = settings.details && (settings.sentence || settings.kanjiMeanings)
  const chars = kanjiCharsOf(word.form)
  const fetched = useKanjiMeanings(word.form, shown && settings.kanjiMeanings && !kanjiMeanings)
  const meanings = kanjiMeanings ?? fetched
  // `undefined` is a sentence still resolving: hold the slot empty rather than
  // flash a kanji-only panel for a frame first.
  const sentencePending = settings.sentence && sentence === undefined
  const showSentence = settings.sentence && !!sentence?.tokens?.length
  const showKanji = settings.kanjiMeanings && chars.length > 0
  const complete = !shown || (!sentencePending && (!showKanji || chars.every(ch => ch in meanings)))
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  useEffect(() => { if (complete) onReadyRef.current?.() }, [complete])
  const config = !settings.sentence ? 'kanji' : !settings.kanjiMeanings ? 'sentence' : 'both'

  if (!shown) {
    return (
      <div style={{ minHeight: 36, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <button
          type="button"
          className="details-show"
          onClick={() => {
            onChangeSetting('details', true)
            if (!settings.sentence && !settings.kanjiMeanings) onChangeSetting('sentence', true)
          }}
          style={{
            border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 6, background: 'transparent', padding: '6px 14px',
            color: 'rgba(255,255,255,0.45)', fontFamily: FONT, fontSize: 13, letterSpacing: '0.05em', cursor: 'pointer',
          }}
        >
          Show details
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: reserve ? SLOT[config][mobile ? 1 : 0] : 0,
      width: mobile ? '100cqw' : 'min(620px, calc(100cqw - 32px))',
      // The panel hugs its content at the top of the slot; the reserve is
      // invisible room under it, which keeps the card where it is from card
      // to card (the drill's buttons sit in its bottom bar, so nothing below
      // the panel depends on its height).
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    }}>
      {!sentencePending && (showSentence || showKanji) && (
        <PaletteContext.Provider value={palette ? { ...PAPER_PALETTE, ...palette } : settings.detailsTheme === 'light' ? PAPER_PALETTE : OUTLINE_PALETTE}>
        <Panel
          key={cardKey}
          word={word} sentence={sentence} showSentence={showSentence} showKanji={showKanji}
          chars={chars} meanings={meanings} related={related} lessonLabel={lessonLabel}
          settings={settings} knownIds={knownIds ?? EMPTY} revealed={revealed} leaving={leaving} mobile={mobile} jaFont={jaFont}
          srsData={srsData} saveSrs={saveSrs}
          onHide={() => onChangeSetting('details', false)}
          onToggleTheme={() => onChangeSetting('detailsTheme', settings.detailsTheme === 'light' ? 'dark' : 'light')}
          onPlaySentence={showSentence && onPlaySentence ? onPlaySentence : undefined}
        />
        </PaletteContext.Provider>
      )}
    </div>
  )
}

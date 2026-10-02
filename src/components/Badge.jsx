import { FONT, TRACKING, FS_BADGE, FS_SM, TEXT_MUTED, SUCCESS, WARNING, DANGER, BRAND, BRAND_TEXT } from '../data/theme.js'
import { useAccent } from '../context/ModuleThemeContext.jsx'

// Small classification pill — JLPT level, part-of-speech, difficulty, SRS
// status, "common", etc. `variant="fill"` is the tinted-pill treatment used
// for most badges; `variant="text"` is bare colored text with no background,
// used where a badge would compete with too much other chrome (e.g. dense
// table cells, DictionaryPage's "common" marker).
//
// `accent` prop mirrors Chip's own accent override — only tone="accent"
// is ambient (ModuleThemeProvider); success/warning/danger/neutral stay
// fixed semantic colors regardless of module (a "danger" badge shouldn't
// turn pink in a pink module). Anime Vocab's difficulty/mediaType badges
// are the first real accent="accent" consumers.
//
// `dimmed` renders the whole pill/text at reduced opacity — generic, not
// JLPT-specific, so it's reusable for any "approximate value" case (the
// `~`-prefixed inferred JLPT level is the first; Dictionary's own inferred
// levels are a likely second). The `~` prefix and any tooltip stay
// call-site content, not a Badge concern.
// `size="md"` is one step up the type scale (FS_SM) for a badge that sits
// beside full-size button text rather than in dense metadata — the sign-in
// dialog's "Last used" is the first.
const SIZES = {
  sm: { fontSize: FS_BADGE, padding: '1px 7px' },
  md: { fontSize: FS_SM, padding: '2px 8px' },
}

export default function Badge({ tone = 'neutral', variant = 'fill', size = 'sm', accent, dimmed = false, children }) {
  const { fontSize, padding } = SIZES[size] ?? SIZES.sm
  const moduleAccent = useAccent(accent)
  const TONE_COLORS = {
    accent: moduleAccent,
    success: SUCCESS,
    warning: WARNING,
    danger: DANGER,
    neutral: TEXT_MUTED,
  }
  const color = TONE_COLORS[tone] ?? TONE_COLORS.neutral
  // BRAND on bg is 4.25:1 — fine for the border/tint, fails AA at FS_BADGE
  // (brand/BRAND.md §3: "BRAND_TEXT for … any red text under 24px"). Only
  // the label swaps; background/border stay on raw `color`.
  const textColor = color === BRAND ? BRAND_TEXT : color
  const opacity = dimmed ? 0.55 : 1

  // width: fit-content matters — as a child of a flex *column* the default
  // align-items: stretch would otherwise blow the pill out to the container's
  // full width. A badge must always be exactly as wide as its label.
  if (variant === 'text') {
    return (
      <span style={{ fontFamily: FONT, letterSpacing: TRACKING, fontSize, color: textColor, opacity, flexShrink: 0, width: 'fit-content' }}>
        {children}
      </span>
    )
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: FONT,
        letterSpacing: TRACKING,
        fontSize,
        color: textColor,
        background: `${color}22`,
        border: `1px solid ${color}55`,
        borderRadius: 4,
        padding,
        flexShrink: 0,
        width: 'fit-content',
        whiteSpace: 'nowrap',
        opacity,
      }}
    >
      {children}
    </span>
  )
}

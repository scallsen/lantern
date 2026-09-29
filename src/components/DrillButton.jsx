import { FONT, TRACKING, FS_BASE, FS_CAPTION, SPACE_8, DRILL_ROW_WIDTH, DRILL_ROW_HEIGHT } from '../data/theme.js'

/**
 * One judgment button in a drill. Consolidates two components that were the
 * same control wearing different labels: SpeedModeControls' Correct/Incorrect
 * pair and VocabSrsDrill's four-way `RatingButton`. Both already shared the
 * `.verdict-btn` class, the 380px row width, radius 8, white-on-solid fill,
 * and gap — they differed only in padding (10px vs 8px) and fill opacity
 * (0.85 vs 0.75), reconciled to 8px padding + 0.85 opacity (the
 * higher-contrast of the two). A fixed `DRILL_ROW_HEIGHT` (not padding-driven
 * auto height) is what keeps this identical in height to the pre-flip
 * placeholder in `DrillButtonRow` below — a `sublabel` second line (the FSRS
 * interval preview) used to make this row taller than the placeholder,
 * shifting the card on flip. That preview is gone from the SRS drill for the
 * same reason: label + hint + interval routinely wrapped a single button's
 * text across two lines even without a sublabel.
 */
export function DrillButton({ label, hint, color, onClick, disabled = false, flex = 1 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="verdict-btn"
      style={{
        flex,
        height: DRILL_ROW_HEIGHT,
        fontSize: FS_BASE,
        fontFamily: FONT,
        letterSpacing: TRACKING,
        background: color,
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {label}
      {/* A margin, not a leading space: the button is a flex box, which
          drops a space at the start of its text — "Correct[X]". */}
      {hint && <span style={{ opacity: 0.6, fontSize: FS_CAPTION, marginLeft: '0.45em' }}>[{hint}]</span>}
    </button>
  )
}

const FLIP_FILL = 'rgba(255,255,255,0.1)'

// Before the flip, the row is one button the same height as the verdict
// buttons that replace it, so nothing shifts when the card turns.
export function DrillFlipButton({ onClick, hint = 'Space', disabled = false }) {
  return <DrillButton label="Flip card" hint={hint} color={FLIP_FILL} onClick={onClick} disabled={disabled} />
}

function UndoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M7.5 5 L3.5 9 L7.5 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9 H12 A4.5 4.5 0 0 1 12 18 H9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// Undo as a square the height of the verdict buttons, leading their row —
// it used to be a line of its own under the row, which a short window
// couldn't spare. Hover in global.css (.drill-undo).
export function DrillUndoButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      title="Undo"
      aria-label="Undo"
      onClick={onClick}
      disabled={disabled}
      className="drill-undo"
      style={{
        width: DRILL_ROW_HEIGHT, height: DRILL_ROW_HEIGHT, flexShrink: 0, padding: 0, borderRadius: 8,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1,
      }}
    >
      <UndoIcon />
    </button>
  )
}

// The row DrillButtons sit in, plus the pre-flip placeholder that occupies
// the same slot so the layout doesn't jump when the card flips. Both are
// pinned to DRILL_ROW_HEIGHT so that's true regardless of content.
// `undo` ({ onClick, disabled }) leads the row with DrillUndoButton on both
// faces.
export default function DrillButtonRow({ children, placeholder, undo }) {
  const lead = undo && <DrillUndoButton onClick={undo.onClick} disabled={undo.disabled} />
  if (placeholder) {
    return (
      <div style={{
        width: DRILL_ROW_WIDTH, height: DRILL_ROW_HEIGHT,
        display: 'flex', alignItems: 'center', gap: SPACE_8,
        color: 'rgba(255,255,255,0.25)', fontSize: FS_BASE,
        fontFamily: FONT, letterSpacing: TRACKING,
      }}>
        {lead}
        <span style={{ flex: 1, textAlign: 'center' }}>{placeholder}</span>
      </div>
    )
  }

  return (
    <div style={{ width: DRILL_ROW_WIDTH, height: DRILL_ROW_HEIGHT, display: 'flex', gap: SPACE_8 }}>
      {lead}
      {children}
    </div>
  )
}

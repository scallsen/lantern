import DrillButtonRow, { DrillButton, DrillFlipButton } from './DrillButton.jsx'
import { DRILL_COLORS } from '../data/theme.js'

// The speed-mode Incorrect/Correct pair, shared by VocabPage and Anime
// Vocab's EpisodeDrill. A named composition over DrillButton rather than
// each drill inlining the same two buttons — the keyboard hints and the
// pre-flip state are the whole point of it existing.
//
// With `onFlip`, the pre-flip state is a "Flip card [Space]" button the same
// height as the pair (no shift on the flip) rather than the "Click to flip"
// placeholder; with `onUndo`, an Undo square leads the row on both faces.
export default function SpeedModeControls({ isFlipped, transitioning, onVerdict, onFlip, onUndo, canUndo = false }) {
  const undo = onUndo ? { onClick: onUndo, disabled: !canUndo || transitioning } : undefined
  if (!isFlipped) {
    return onFlip
      ? <DrillButtonRow undo={undo}><DrillFlipButton onClick={onFlip} disabled={transitioning} /></DrillButtonRow>
      : <DrillButtonRow placeholder="Click to flip" undo={undo} />
  }

  return (
    <DrillButtonRow undo={undo}>
      <DrillButton label="Incorrect" hint="Z" color={DRILL_COLORS.again} onClick={() => onVerdict(false)} disabled={transitioning} />
      <DrillButton label="Correct" hint="X" color={DRILL_COLORS.good} onClick={() => onVerdict(true)} disabled={transitioning} />
    </DrillButtonRow>
  )
}

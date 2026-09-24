import { READINESS_TARGET_PCT } from '../lib/drillScore.js'

// Kept out of homeCards.jsx (a component file) to satisfy react-refresh
// lint — same reasoning as attributionSegments.jsx: a non-component export
// mixed into a file of components breaks fast refresh for that file.

// Shared between the home card and the vocab training page's own header —
// both show the same primary action for the chapter under the tracker.
// Advancing (moving off a drilled current chapter onto the next one) always
// goes through `onAdvance`, which is where the SRS gate hangs; drilling the
// current chapter again never touches the tracker, so it's a plain `onStart`.
//
// Once the current chapter is drilled, its first-try score picks the lead:
// at or above the readiness target, starting the next chapter; below it (or
// with no score saved yet), drilling this one again. The other is always one
// tap away in the menu — a nudge, never a lock.
export function chapterPrimaryAction(state, { onStart, onAdvance, onChangeTextbook }) {
  const { chapters, current, next, doneCount } = state
  if (doneCount === chapters.length) {
    return { label: 'Pick new word list', onClick: onChangeTextbook, menuItems: [] }
  }
  if (!current.drilled) {
    return { label: `Start ${current.label}`, onClick: () => onStart(current), menuItems: [] }
  }
  const again = { label: `Drill ${current.label} again`, onClick: () => onStart(current) }
  if (!next) return { ...again, menuItems: [] }
  const start = { label: `Start ${next.label}`, onClick: onAdvance }
  const ready = current.scorePct != null && current.scorePct >= READINESS_TARGET_PCT
  const [lead, other] = ready ? [start, again] : [again, start]
  return { ...lead, menuItems: [{ id: 'other', ...other }] }
}

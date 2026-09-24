import { fn } from 'storybook/test'
import { RoundBreak, LessonCleared } from './drillFinish.jsx'
import { finishRows, PREVIOUS_RUNS } from './drillFinishFixtures.js'

// The vocab drill's finishing screens, rendered with the real components.
// LessonCleared's Action Bar is position: fixed, so every story renders in
// its own frame (see the root CLAUDE.md's story conventions).
export default {
  title: 'Vocab Drill/Finish',
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 720 },
      description: { component: "The vocab drill's two finishing screens. **Round break**: between rounds while missed words are left — a lantern, where the session is, and the next round starts by itself after 2.9s. **Lesson cleared**: once every word is answered right — the first-try score against the 80% target, this lesson's previous sessions, every word ranked by misses, and the actions. At or above the target, adding the words to review leads; below it, drilling again does." },
    },
  },
}

const cleared = {
  render: args => (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <LessonCleared {...args} />
    </div>
  ),
  args: {
    rows: finishRows(14),
    previousRuns: PREVIOUS_RUNS,
    isMobile: false,
    onAddToReview: words => ({ count: words.length, cardIds: words.map(w => w.id) }),
    onUndoAdd: fn(),
    onDrillAgain: fn(),
    onDrillTroubled: fn(),
    onEnd: fn(),
  },
}

export const ClearedBelowTarget = cleared

export const ClearedTargetReached = { ...cleared, args: { ...cleared.args, rows: finishRows(17) } }

export const ClearedFirstRun = { ...cleared, args: { ...cleared.args, previousRuns: [] } }

export const ClearedPerfect = { ...cleared, args: { ...cleared.args, rows: finishRows(20) } }

export const ClearedPhone = {
  ...cleared,
  args: { ...cleared.args, isMobile: true },
}

const roundBreak = {
  render: args => (
    <div style={{ minHeight: 560, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <RoundBreak {...args} />
    </div>
  ),
  args: { onContinue: fn(), onEnd: fn() },
}

export const RoundBreakFirst = { ...roundBreak, args: { ...roundBreak.args, round: 1, correct: 14, troubled: 6 } }

export const RoundBreakSecond = { ...roundBreak, args: { ...roundBreak.args, round: 2, correct: 18, troubled: 2 } }

export const RoundBreakThird = { ...roundBreak, args: { ...roundBreak.args, round: 3, correct: 19, troubled: 1 } }

import ScoreBar from './ScoreBar.jsx'

export default {
  title: 'Patterns/Score Bar',
  component: ScoreBar,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "One score as a share of a whole — a vocab drill's words right first time against the rest of the lesson, with the readiness target marked.\n\n**Use when** showing a single result out of a whole, optionally against a target: the home card's lesson score, the drill's Lesson cleared screen and its previous sessions.\n\n**Don't use** for how a collection splits across several states (Distribution Bar), or for progress through something still underway (Top Progress Bar).\n\n*Build note:* `tone=\"history\"` dims both segments for earlier runs shown under a current one; leave out `caption` and `target` for a bare bar in a table row." } },
  },
  argTypes: { pct: { control: { type: 'range', min: 0, max: 100, step: 1 } } },
  args: { pct: 70, target: 80, caption: '14 of 20 correct first time' },
  decorators: [Story => <div style={{ width: 420 }}><Story /></div>],
}

export const LessonScore = {}

export const HomeCard = { args: { pct: 70, height: 8, caption: '70% correct first time' } }

export const TargetReached = { args: { pct: 90, caption: '18 of 20 correct first time' } }

export const PreviousSession = { args: { pct: 55, tone: 'history', height: 6, target: undefined, caption: undefined } }

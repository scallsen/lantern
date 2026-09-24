import Badge from '../components/Badge.jsx'
import {
  StartToday, StartExplicit, StartReadiness,
  RoundToday, RoundCheckpoint, RoundAuto,
  ClearedToday, ClearedReport, ClearedMoment,
  SendToday, SendPick, SendChapter, SendHeadStart, SendHistory,
  NextToday, NextButton, NextReadiness, NextFocus,
} from './drillJourneyScreens.jsx'
import { STAGES, ISSUES, PRESETS, SESSION, READINESS_TARGET_PCT } from './drillJourneyFixtures.js'
import {
  TEXT, TEXT_MUTED, BRAND_TEXT, SUCCESS, DANGER,
  FS_BASE, FS_BADGE, FS_CONTENT_HEADING, SPACE_4, SPACE_8, SPACE_12, SPACE_16, SPACE_24, SPACE_32,
} from '../data/theme.js'

const BG = '#1E1E1E'
const SURFACE = '#2A2A2A'
const HAIRLINE = 'rgba(255,255,255,0.08)'
const READY_PCT = 90

// Each variant renders one or more states — the readiness variants are only
// meaningful shown on both sides of the target.
const SCREENS = {
  start: {
    today: [{ el: <StartToday /> }],
    explicit: [{ el: <StartExplicit /> }],
    readiness: [
      { label: `Below target (${SESSION.firstTryPct}%)`, el: <StartReadiness pct={SESSION.firstTryPct} /> },
      { label: `Above target (${READY_PCT}%)`, el: <StartReadiness pct={READY_PCT} /> },
    ],
  },
  round: {
    today: [{ el: <RoundToday /> }],
    checkpoint: [{ el: <RoundCheckpoint /> }],
    auto: [{ el: <RoundAuto /> }],
  },
  cleared: {
    today: [{ el: <ClearedToday /> }],
    report: [{ el: <ClearedReport /> }],
    moment: [{ el: <ClearedMoment /> }],
  },
  send: {
    today: [{ el: <SendToday /> }],
    pick: [{ el: <SendPick /> }],
    chapter: [{ el: <SendChapter /> }],
    headstart: [{ el: <SendHeadStart /> }],
    history: [{ el: <SendHistory /> }],
  },
  next: {
    today: [{ el: <NextToday /> }],
    nextButton: [{ el: <NextButton /> }],
    readiness: [
      { label: `Below target (${SESSION.firstTryPct}%)`, el: <NextReadiness pct={SESSION.firstTryPct} /> },
      { label: `Above target (${READY_PCT}%)`, el: <NextReadiness pct={READY_PCT} /> },
    ],
    focus: [{ el: <NextFocus /> }],
  },
}

const ISSUE_BY_ID = Object.fromEntries(ISSUES.map(i => [i.id, i]))
const stageById = id => STAGES.find(s => s.id === id)
const variantOf = (stageId, variantId) => stageById(stageId).variants.find(v => v.id === variantId)

// ── Layout pieces ────────────────────────────────────────────────────────────

function Frame({ width, label, children }) {
  return (
    <div style={{ width, maxWidth: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: SPACE_8 }}>
      {label && <div style={{ fontSize: FS_BADGE, color: TEXT_MUTED, textTransform: 'uppercase' }}>{label}</div>}
      {/* Plain block wrapper: PrimaryCard sets height: 100%, which a flex
          item would resolve against itself and overflow the frame. */}
      <div>
        <div style={{ background: BG, border: `1px solid ${HAIRLINE}`, borderRadius: 12, padding: SPACE_12 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function FixChips({ fixes }) {
  if (fixes.length === 0) return <div style={{ fontSize: FS_BADGE, color: TEXT_MUTED }}>Fixes nothing — this is the baseline.</div>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE_4 }}>
      {fixes.map(id => <Badge key={id} tone="success">{ISSUE_BY_ID[id].title}</Badge>)}
    </div>
  )
}

function VariantHeader({ variant }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE_8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: FS_CONTENT_HEADING, color: TEXT }}>{variant.name}</span>
        {variant.today && <Badge tone="neutral">Today</Badge>}
        {variant.recommended && <Badge tone="accent">Recommended</Badge>}
      </div>
      <FixChips fixes={variant.fixes} />
      <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, lineHeight: 1.45 }}>{variant.tradeoff}</div>
    </div>
  )
}

function StageBoard({ stageId, frameWidth }) {
  const stage = stageById(stageId)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_24 }}>
      <div>
        <div style={{ fontSize: FS_CONTENT_HEADING, color: TEXT }}>{stage.title}</div>
        <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, marginTop: SPACE_4 }}>{stage.question}</div>
      </div>
      <div style={{ display: 'flex', gap: SPACE_32, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: SPACE_16 }}>
        {stage.variants.map(variant => (
          <div key={variant.id} style={{ display: 'flex', flexDirection: 'column', gap: SPACE_16, width: frameWidth * SCREENS[stageId][variant.id].length + SPACE_16 * (SCREENS[stageId][variant.id].length - 1), flexShrink: 0 }}>
            <VariantHeader variant={variant} />
            <div style={{ display: 'flex', gap: SPACE_16 }}>
              {SCREENS[stageId][variant.id].map((s, i) => <Frame key={i} width={frameWidth} label={s.label}>{s.el}</Frame>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Scorecard({ choice }) {
  const fixedBy = {}
  for (const stage of STAGES) {
    for (const id of variantOf(stage.id, choice[stage.id]).fixes) (fixedBy[id] ??= []).push(stage.title.split(' · ')[0])
  }
  const solved = ISSUES.filter(i => fixedBy[i.id]).length
  return (
    <div style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: SPACE_16, display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
      <div style={{ fontSize: FS_CONTENT_HEADING, color: TEXT }}>{solved} of {ISSUES.length} journey problems solved</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: SPACE_12 }}>
        {ISSUES.map(issue => {
          const by = fixedBy[issue.id]
          return (
            <div key={issue.id} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr)', gap: SPACE_8 }}>
              <span style={{ color: by ? SUCCESS : DANGER, fontSize: FS_BASE }}>{by ? '✓' : '✗'}</span>
              <div>
                <div style={{ fontSize: FS_BASE, color: TEXT }}>{issue.title}</div>
                <div style={{ fontSize: FS_BADGE, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.4 }}>
                  {by ? `Solved at stage ${by.join(', ')}` : issue.detail}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function JourneyStep({ stage, variantId, frameWidth }) {
  const variant = variantOf(stage.id, variantId)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `minmax(220px, 300px) auto`, gap: SPACE_24, alignItems: 'start', paddingTop: SPACE_24, borderTop: `1px solid ${HAIRLINE}` }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_8, position: 'sticky', top: SPACE_16 }}>
        <div style={{ fontSize: FS_BADGE, color: BRAND_TEXT, textTransform: 'uppercase' }}>{stage.title}</div>
        <VariantHeader variant={variant} />
      </div>
      <div style={{ display: 'flex', gap: SPACE_16, flexWrap: 'wrap' }}>
        {SCREENS[stage.id][variantId].map((s, i) => <Frame key={i} width={frameWidth} label={s.label}>{s.el}</Frame>)}
      </div>
    </div>
  )
}

function Journey({ frameWidth, ...choice }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_24, maxWidth: 1400 }}>
      <Scorecard choice={choice} />
      {STAGES.map(stage => <JourneyStep key={stage.id} stage={stage} variantId={choice[stage.id]} frameWidth={frameWidth} />)}
    </div>
  )
}

// ── Stories ──────────────────────────────────────────────────────────────────

const variantControl = stageId => ({
  control: 'select',
  options: stageById(stageId).variants.map(v => v.id),
  labels: Object.fromEntries(stageById(stageId).variants.map(v => [v.id, v.name])),
  name: stageById(stageId).title,
})

export default {
  title: 'Explorations/Drill Journey',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Design exploration for drilling a textbook lesson from start to finish: choosing the lesson, the rounds, clearing it, sending words to Reviews, and moving on. Nothing here is wired into the app.

**Use when** comparing the options for one step (the numbered stage stories) or checking how one set of choices works end to end (the Journey stories, where each stage has its own control and the scorecard updates).

**Don't use** as a reference for how the drill behaves today. Only the variants marked Today show current behaviour, and those are copies of the Vocabulary Drill's done screen, not the real one.

*Build note:* the mock learner is on Genki 1 Lesson 3: 20 words, three rounds (20 → 6 → 2 → cleared), ${SESSION.firstTryPct}% right first time. The readiness target is ${READINESS_TARGET_PCT}%. The head-start timing comes from the app's own ts-fsrs settings: only an Easy first rating skips the learning steps.`,
      },
    },
  },
  args: { frameWidth: 420 },
  argTypes: { frameWidth: { control: { type: 'range', min: 320, max: 560, step: 20 } } },
}

const stageStory = stageId => ({
  render: ({ frameWidth }) => <div style={{ padding: SPACE_24 }}><StageBoard stageId={stageId} frameWidth={frameWidth} /></div>,
})

export const Stage1ChoosingWhatToDrill = stageStory('start')
export const Stage2RoundEnd = stageStory('round')
export const Stage3LessonCleared = stageStory('cleared')
export const Stage4SendingToReviews = stageStory('send')
export const Stage5WhatNext = stageStory('next')

const journeyStory = preset => ({
  args: { ...PRESETS[preset] },
  argTypes: Object.fromEntries(STAGES.map(s => [s.id, variantControl(s.id)])),
  render: args => <div style={{ padding: SPACE_24 }}><Journey {...args} /></div>,
})

export const JourneyToday = journeyStory('today')
export const JourneyRecommended = journeyStory('recommended')
export const JourneyMinimalFix = journeyStory('minimalFix')

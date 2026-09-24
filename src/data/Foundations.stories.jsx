import {
  FONT, TRACKING, TEXT, TEXT_MUTED, BORDER as BORDER_TOKEN, FS_BASE, FS_CAPTION, FS_CONTENT_HEADING,
  FS_SM, FS_NAV, FS_BADGE, FS_DISPLAY_HEADING, FS_STAT_VALUE,
  FS_LIST_TITLE, FS_ENTRY_WORD, FS_ENTRY_KANJI, FS_ENTRY_HEADING, FS_ENTRY_ALT, FS_ARTICLE_BODY,
  SPACE_4, SPACE_8, SPACE_12, SPACE_16, SPACE_24, SPACE_32,
  SEGMENT_COLORS, DRILL_COLORS,
  BRAND, BRAND_DEEP, BRAND_TEXT, ON_BRAND,
} from './theme.js'

// Ported from the Style Guide's Foundations pages (Type / Spacing / Color):
// token reference lists rather than interactive components, so each is one
// story with no controls.

const BG = '#1E1E1E'
const SURFACE = '#2A2A2A'
const ACCENT = BRAND
const BORDER = 'rgba(255,255,255,0.08)'
const WARNING = '#fbbf24'

export default {
  title: 'Foundations',
  parameters: { controls: { disable: true }, actions: { disable: true } },
}

/* ── Foundations data ──────────────────────────────────────────────────── */

const CORE_TYPE_TOKENS = [
  { names: ['FS_BADGE'], px: FS_BADGE, usage: 'inline pill labels — badges, tags', sample: 'N4' },
  { names: ['FS_SM'], px: FS_SM, usage: 'compact secondary text', sample: '2,007 cards · bundled' },
  { names: ['FS_BASE', 'FS_CAPTION', 'FS_HEADING', 'FS_ENTRY'], px: FS_BASE, isDefault: true, usage: 'use this — body text, captions, headings, dictionary entries all share it. Start here for any new text.', sample: 'You have 12 cards due today.' },
  { names: ['FS_NAV'], px: FS_NAV, usage: 'breadcrumb navigation, the one step up from body text', sample: 'Japanese Study / Vocabulary' },
]

const HEADING_TYPE_TOKENS = [
  { names: ['FS_CONTENT_HEADING'], px: FS_CONTENT_HEADING, usage: 'article title in reader, module stat summary, grammar node heading — 3 contexts already', sample: "Today's Review" },
]

const CONTENT_TYPE_TOKENS = [
  { names: ['FS_LIST_TITLE'], px: FS_LIST_TITLE, watch: 'promote if FeedCard reuses this for its title', usage: 'article card title in list view', sample: 'Immersion Words' },
  { names: ['FS_ENTRY_ALT'], px: FS_ENTRY_ALT, usage: 'dictionary entry page alternate word forms', sample: '為る' },
  { names: ['FS_ARTICLE_BODY'], px: FS_ARTICLE_BODY, usage: 'article body text (reading-optimised, do not normalise)', sample: '今日は天気がいいです。' },
  { names: ['FS_ENTRY_WORD'], px: FS_ENTRY_WORD, usage: 'word form in dictionary results & word popup', sample: '世界' },
  { names: ['FS_STAT_VALUE'], watch: 'promote if HUD/other stat displays reuse this', px: FS_STAT_VALUE, usage: 'done-screen reviewed / again / time numbers', sample: '42' },
  { names: ['FS_DISPLAY_HEADING'], watch: 'promote if another completion-style screen reuses this', px: FS_DISPLAY_HEADING, usage: 'done-screen "Session complete"', sample: 'Session complete' },
  { names: ['FS_ENTRY_KANJI'], px: FS_ENTRY_KANJI, usage: 'dictionary large kanji display', sample: '語' },
  { names: ['FS_ENTRY_HEADING'], px: FS_ENTRY_HEADING, usage: 'dictionary entry page primary word/kanji display', sample: '語' },
]

const SPACE_TOKENS = [
  { name: 'SPACE_4', px: SPACE_4, usage: 'tightest — icon-to-label gaps, a stacked label/subtext pair' },
  { name: 'SPACE_8', px: SPACE_8, usage: 'compact gaps — chip rows, tight groupings' },
  { name: 'SPACE_12', px: SPACE_12, isDefault: true, usage: 'use this — the standard gap/padding. Start here for any new spacing.' },
  { name: 'SPACE_16', px: SPACE_16, usage: 'standard card/section padding' },
  { name: 'SPACE_24', px: SPACE_24, usage: 'page-level padding, section separation' },
  { name: 'SPACE_32', px: SPACE_32, usage: 'large section breaks' },
]

const CORE_COLORS = [
  { name: 'BG', hex: BG, usage: 'page background' },
  { name: 'SURFACE', hex: SURFACE, usage: 'card / panel background' },
  { name: 'SURFACE_HOVER', hex: '#313131', usage: 'row and card hover' },
  { name: 'BORDER', hex: BORDER_TOKEN, usage: 'header separator' },
  { name: 'TEXT', hex: TEXT, usage: 'primary text' },
  { name: 'TEXT_MUTED', hex: TEXT_MUTED, usage: 'secondary / label text' },
]

const SEMANTIC_COLORS = [
  { name: 'accent', hex: ACCENT, usage: 'primary actions, links, selected states' },
  { name: 'success', hex: '#4ade80', usage: 'correct answers, success messages' },
  { name: 'warning', hex: WARNING, usage: 'troubled cards, leeches, waiting state' },
  { name: 'danger', hex: '#f87171', usage: 'wrong answers, destructive actions' },
]

// Module accents are retired (brand/BRAND.md §3, §7) — every module now
// renders in the base greys with BRAND for its one primary action, instead
// of a colour per module. This list replaces the old MODULE_ACCENTS table.
const BRAND_PALETTE = [
  { name: 'BRAND', hex: BRAND, usage: 'the lit lantern, one primary button/screen, home-card edge, focus rings, active chips' },
  { name: 'BRAND_DEEP', hex: BRAND_DEEP, usage: "BRAND's hover/pressed shade only" },
  { name: 'BRAND_TEXT', hex: BRAND_TEXT, usage: 'links and small red text under 24px — BRAND itself fails AA there' },
  { name: 'ON_BRAND', hex: ON_BRAND, usage: 'text on a BRAND-filled surface' },
]

function GroupLabel({ children }) {
  return (
    <div style={{ fontSize: FS_CAPTION, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '18px 0 4px' }}>
      {children}
    </div>
  )
}

function Pill({ label, color, textColor }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: FONT, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: textColor, background: color, borderRadius: 3, padding: '1px 6px', marginLeft: SPACE_8,
    }}>
      {label}
    </span>
  )
}

function FoundationPage({ description, children }) {
  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, marginBottom: SPACE_24, lineHeight: 1.5, maxWidth: 640 }}>{description}</div>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, padding: '4px 20px' }}>
        {children}
      </div>
    </div>
  )
}

function TypeRow({ t, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: SPACE_24, padding: '16px 14px', margin: '0 -14px',
      borderBottom: isLast ? 'none' : `1px solid ${BORDER}`,
      background: t.isDefault ? 'rgba(58,189,164,0.07)' : 'transparent',
      borderLeft: t.isDefault ? `2px solid ${ACCENT}` : '2px solid transparent',
    }}>
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ fontSize: FS_CAPTION, color: TEXT, fontFamily: 'monospace', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {t.names.join(' / ')}
          {t.isDefault && <Pill label="Default" color={ACCENT} textColor="#0F2622" />}
          {t.watch && <Pill label="Watch" color={WARNING} textColor="#2E2405" />}
        </div>
        <div style={{ fontSize: FS_CAPTION, color: ACCENT, marginTop: 2 }}>{t.px}px</div>
        <div style={{ fontSize: FS_SM, color: TEXT_MUTED, marginTop: SPACE_4, lineHeight: 1.4 }}>{t.watch ?? t.usage}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: t.px, fontFamily: FONT, letterSpacing: TRACKING, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {t.sample}
      </div>
    </div>
  )
}

function ColorRow({ c, isLast }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE_16, padding: '12px 0', borderBottom: isLast ? 'none' : `1px solid ${BORDER}` }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: c.hex, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }} />
      <div style={{ width: 150, flexShrink: 0 }}>
        <div style={{ fontSize: FS_CAPTION, color: TEXT, fontFamily: 'monospace' }}>{c.name}</div>
        <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED, fontFamily: 'monospace', marginTop: 2 }}>{c.hex}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: FS_SM, color: TEXT_MUTED, lineHeight: 1.4 }}>{c.usage}</div>
    </div>
  )
}

export const Type = {
  render: () => (
    <FoundationPage description="Text sizes. Use 15px (FS_BASE) for all body and interface text, and FS_CONTENT_HEADING for headings. Every other size belongs to one specific screen — don't reach for it elsewhere; the ones marked Watch may become general if a second screen needs them.">
      <GroupLabel>Core — pick from these for new UI</GroupLabel>
      {CORE_TYPE_TOKENS.map(t => <TypeRow key={t.names[0]} t={t} isLast={false} />)}
      <GroupLabel>Headings — proven reused, the general heading choice</GroupLabel>
      {HEADING_TYPE_TOKENS.map(t => <TypeRow key={t.names[0]} t={t} isLast={false} />)}
      <GroupLabel>Content-specific — one named context each, not general-purpose</GroupLabel>
      {CONTENT_TYPE_TOKENS.map((t, i) => <TypeRow key={t.names[0]} t={t} isLast={i === CONTENT_TYPE_TOKENS.length - 1} />)}
    </FoundationPage>
  ),
}

export const Spacing = {
  render: () => {
    const maxPx = SPACE_TOKENS[SPACE_TOKENS.length - 1].px
    return (
      <FoundationPage description="Gaps and padding. Start with 12px (SPACE_12); go tighter or looser only when there's a clear reason, not by eye.">
        {SPACE_TOKENS.map((s, i) => (
          <div key={s.name} style={{
            display: 'flex', alignItems: 'center', gap: SPACE_24, padding: '14px 14px', margin: '0 -14px',
            borderBottom: i < SPACE_TOKENS.length - 1 ? `1px solid ${BORDER}` : 'none',
            background: s.isDefault ? 'rgba(58,189,164,0.07)' : 'transparent',
            borderLeft: s.isDefault ? `2px solid ${ACCENT}` : '2px solid transparent',
          }}>
            <div style={{ width: 160, flexShrink: 0 }}>
              <div style={{ fontSize: FS_CAPTION, color: TEXT, fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                {s.name}
                {s.isDefault && <Pill label="Default" color={ACCENT} textColor="#0F2622" />}
              </div>
              <div style={{ fontSize: FS_CAPTION, color: ACCENT, marginTop: 2 }}>{s.px}px</div>
            </div>
            <div style={{ width: maxPx + 20, flexShrink: 0 }}>
              <div style={{ width: s.px, height: 14, background: ACCENT, borderRadius: 2 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, fontSize: FS_SM, color: TEXT_MUTED, lineHeight: 1.4 }}>{s.usage}</div>
          </div>
        ))}
      </FoundationPage>
    )
  },
}

export const Color = {
  render: () => {
    const segmentList = Object.entries(SEGMENT_COLORS).map(([k, hex]) => ({ name: k, hex, usage: k === 'new' ? 'inert grey, deliberately outside the ramp' : 'ordinal ramp step' }))
    const drillList = Object.entries(DRILL_COLORS).map(([k, hex]) => ({ name: k, hex, usage: 'solid fill behind white text' }))
    return (
      <FoundationPage description="Greys for surfaces and text; one brand red for the single most important action on a screen and for selected states; semantic colours for meaning — success, warning, danger. Two sets sit apart on purpose: the card-state ramp, chosen to stay distinguishable with colour blindness, and the drill grading colours.">
        <GroupLabel>Core surfaces &amp; text</GroupLabel>
        {CORE_COLORS.map((c, i) => <ColorRow key={c.name} c={c} isLast={i === CORE_COLORS.length - 1} />)}
        <GroupLabel>Semantic</GroupLabel>
        {SEMANTIC_COLORS.map((c, i) => <ColorRow key={c.name} c={c} isLast={i === SEMANTIC_COLORS.length - 1} />)}
        <GroupLabel>Brand — the one accent, five places it&apos;s allowed (brand/BRAND.md §3)</GroupLabel>
        {BRAND_PALETTE.map((c, i) => <ColorRow key={c.name} c={c} isLast={i === BRAND_PALETTE.length - 1} />)}
        <GroupLabel>Card-state ramp — validated for colour-vision deficiency, do not normalise</GroupLabel>
        {segmentList.map((c, i) => <ColorRow key={c.name} c={c} isLast={i === segmentList.length - 1} />)}
        <GroupLabel>Drill judgment — Flat-UI lineage, separate from semantic on purpose</GroupLabel>
        {drillList.map((c, i) => <ColorRow key={c.name} c={c} isLast={i === drillList.length - 1} />)}
      </FoundationPage>
    )
  },
}

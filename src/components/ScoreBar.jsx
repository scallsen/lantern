import { TEXT, TEXT_MUTED, BRAND, FS_BASE, SPACE_12 } from '../data/theme.js'

// The rest of the whole: a visible grey, not the faint hairline track, since
// it stands for real items (words not right first time), not empty space.
const TONES = {
  current: { correct: BRAND, rest: '#4A4A4A' },
  // Earlier runs are context for the current bar, so they keep the same
  // encoding dimmed rather than taking a second hue — ACCENT_SECONDARY's
  // ramp already means SRS card stages and would read as different data.
  history: { correct: '#7A1F3A', rest: '#333333' },
}

function Bar({ pct, height, colors }) {
  const radius = height >= 10 ? 4 : 3
  // Two segments with the 2px surface gap between them rather than a fill
  // over a track — both halves are items, neither is empty space.
  return (
    <div style={{ display: 'flex', gap: pct > 0 && pct < 100 ? 2 : 0, height }}>
      {pct > 0 && <div style={{ flex: `${pct} 0 0`, background: colors.correct, borderRadius: pct < 100 ? `${radius}px 0 0 ${radius}px` : radius }} />}
      {pct < 100 && <div style={{ flex: `${100 - pct} 0 0`, background: colors.rest, borderRadius: pct > 0 ? `0 ${radius}px ${radius}px 0` : radius }} />}
    </div>
  )
}

/**
 * One score as a share of a whole: red for what was right, grey for the
 * rest, with an optional target tick and a caption line under it.
 * `pct` is 0–100 (fractions are fine while it animates).
 */
export default function ScoreBar({ pct, target, caption, height = 12, tone = 'current' }) {
  const bar = (
    <div role="img" aria-label={`${Math.round(pct)}%${target != null ? `, target ${target}%` : ''}`} style={{ position: 'relative' }}>
      <Bar pct={pct} height={height} colors={TONES[tone] ?? TONES.current} />
      {target != null && (
        <div style={{ position: 'absolute', top: -4, bottom: -4, left: `${target}%`, width: 2, background: TEXT, opacity: 0.6 }} />
      )}
    </div>
  )
  if (caption == null && target == null) return bar
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
      {bar}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACE_12, fontSize: FS_BASE, color: TEXT_MUTED }}>
        <span>{caption}</span>
        {target != null && <span>Target {target}%</span>}
      </div>
    </div>
  )
}

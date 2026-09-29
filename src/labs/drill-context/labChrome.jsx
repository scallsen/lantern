// Shared chrome for the Drill Context labs: per-concept state, the dashed
// control strip above each frame, and the notes boxes.
import Japanese from '../../components/Japanese.jsx'
import { FONT, KANJI_FONT, TRACKING, TEXT, TEXT_MUTED } from '../../data/theme.js'
import { WORDS } from './labData.js'

// ── Lab chrome ────────────────────────────────────────────────────────────

export function Seg({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: TEXT_MUTED }}>{label}</span>
      <span style={{ display: 'inline-flex', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 6, overflow: 'hidden' }}>
        {options.map(([v, l]) => (
          <button key={String(v)} type="button" className="lab-ctl" onClick={() => onChange(v)} style={{
            border: 'none', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '4px 10px',
            background: v === value ? 'rgba(255,255,255,0.14)' : 'transparent',
            color: v === value ? TEXT : TEXT_MUTED, fontFamily: FONT, fontSize: 12, letterSpacing: TRACKING,
          }}>
            {l}
          </button>
        ))}
      </span>
    </div>
  )
}

export function WordPicker({ s, u }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: TEXT_MUTED }}>Word</span>
      {WORDS.map((w, i) => (
        <button key={w.id} type="button" className="lab-ctl" onClick={() => u({ idx: i, sIdx: 0, tok: null, enShown: false })} style={{
          border: `1px solid ${i === s.idx ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.14)'}`, borderRadius: 6, padding: '2px 8px',
          background: i === s.idx ? 'rgba(255,255,255,0.1)' : 'transparent', color: TEXT, fontFamily: KANJI_FONT, fontSize: 14,
        }}>
          <Japanese>{w.form}</Japanese>
        </button>
      ))}
    </div>
  )
}

export function Controls({ concept, s, u }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 8 }}>
      <WordPicker s={s} u={u} />
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <Seg label="Side" value={s.flipped} options={[[false, 'Front'], [true, 'Back']]} onChange={v => u({ flipped: v, tok: null })} />
        {concept.controls.map(c => <Seg key={c.key} label={c.label} value={s[c.key]} options={c.options} onChange={v => u({ [c.key]: v })} />)}
      </div>
    </div>
  )
}

// ── Feedback (this browser only) ──────────────────────────────────────────

export function FeedbackBox({ concept, notes, setNotes }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: TEXT_MUTED }}>Your notes on {concept.tag} · {concept.name}</span>
      <textarea
        className="lab-feedback"
        value={notes[concept.id] ?? ''}
        onChange={e => setNotes({ ...notes, [concept.id]: e.target.value })}
        placeholder="Keep / drop / change…"
        rows={3}
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'vertical', background: '#252525', color: TEXT,
          border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: '10px 12px',
          fontFamily: FONT, fontSize: 14, letterSpacing: TRACKING, lineHeight: 1.5,
        }}
      />
    </label>
  )
}

// ── Sections ──────────────────────────────────────────────────────────────

export function Bullets({ items, color }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((t, i) => <li key={i} style={{ color: color ?? TEXT, lineHeight: 1.5 }}>{t}</li>)}
    </ul>
  )
}


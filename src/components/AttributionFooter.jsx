import { useState } from 'react'
import { ATTRIBUTIONS } from '../data/attributions.js'
import { FONT, TRACKING, TEXT_MUTED, FS_SM } from '../data/theme.js'
import { renderAttributionSegments } from '../utils/attributionSegments.jsx'

const FOOTER_STYLE = {
  width: '100%',
  textAlign: 'center',
  // Equal room above and below: 4px at the bottom left it pressed against
  // the page's end (or the drill's button bar).
  padding: '16px calc(16px + env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left))',
  fontSize: FS_SM,
  color: TEXT_MUTED,
  fontFamily: FONT,
  letterSpacing: TRACKING,
  opacity: 0.55,
  lineHeight: 1.6,
  flexShrink: 0,
  boxSizing: 'border-box',
}

// Renders the credits for `sources` (attribution ids from src/data/attributions.js)
// as a normal in-flow block at the end of a page's scrollable content — a
// classic flexbox "sticky footer": the page's content wrapper uses flex:1 so
// short content pushes this down to the bottom of the viewport, while tall
// (scrolling) content just has it trail after normally, never overlapping
// content underneath. Add new sources in attributions.js and reference their
// id here — no per-page copy-pasting of credit text. Pass only the ids a
// given page/screen actually uses (e.g. a page with no example sentences
// omits 'tanaka-corpus'); an unknown id or empty list renders nothing.
//
// `compact`: just the sources' names — the linked words of each full credit,
// so there's still one copy of the text, and still links to each project,
// which EDRDG's licence accepts as the acknowledgement — with "Show more" to
// open the full wording in place. The drill screens use it.
export default function AttributionFooter({ sources, compact = false }) {
  const [open, setOpen] = useState(false)
  const credits = (sources ?? []).map(id => ATTRIBUTIONS[id]).filter(Boolean)
  if (credits.length === 0) return null

  if (compact) {
    const names = credits.flatMap(segments => segments.filter(seg => seg.href))
    return (
      <div style={FOOTER_STYLE}>
        <span>
          Sources:{' '}
          {names.map((seg, i) => (
            <span key={`${seg.text}-${i}`}>{i > 0 && ' · '}{renderAttributionSegments([seg])}</span>
          ))}
        </span>
        {' '}
        <button type="button" className="attribution-toggle" aria-expanded={open} onClick={() => setOpen(v => !v)}>
          {open ? 'Show less' : 'Show more'}
        </button>
        {open && (
          <div style={{ marginTop: 4 }}>
            {credits.map((segments, i) => <div key={i}>{renderAttributionSegments(segments)}</div>)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={FOOTER_STYLE}>
      {credits.map((segments, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {renderAttributionSegments(segments)}
        </span>
      ))}
    </div>
  )
}

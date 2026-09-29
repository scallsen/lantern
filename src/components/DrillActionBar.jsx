import ActionBar from './ActionBar.jsx'
import { DrillCounts } from './DrillHUD.jsx'
import { SPACE_8, SPACE_16 } from '../data/theme.js'

// A card drill's bottom bar: its button row (Undo, Flip card / the verdict
// buttons) and the session's counts, pinned under the card so they never
// move while the card, its details panel and the credit line scroll above. Beside each other on desktop — counts leading, buttons at the
// end, the width of the details panel — and stacked on a phone, the buttons
// over the counts.
//
// It's the Action Bar in its in-flow form: the drill places it in a slot
// under its own scroll area, so it spans the drill and not the settings
// sidebar beside it. Under the scroller, not sticky inside it — a
// scroller's reserved scrollbar gutters sit outside its content box, so a
// bar inside one stops short of both edges.
export default function DrillActionBar({ isMobile, correct, troubled, remaining, children }) {
  const counts = <DrillCounts correct={correct} troubled={troubled} remaining={remaining} />
  if (isMobile) {
    return (
      // The stack goes in the leading slot, which takes the bar's full width,
      // so it centres under the card (on a tablet too) rather than sitting at
      // the end like the bar's own buttons.
      <ActionBar
        inFlow
        gutter={SPACE_16}
        leading={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE_8 }}>
            {children}
            {counts}
          </div>
        }
      />
    )
  }
  return (
    <ActionBar inFlow maxWidth={720} leading={counts}>
      {children}
    </ActionBar>
  )
}

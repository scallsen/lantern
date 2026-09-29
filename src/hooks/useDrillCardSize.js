import { useIsMobile } from './useIsMobile.js'

// The drill card is 380px wide wherever that fits with a 16px margin each
// side, so a tablet shows the same card as a desktop and a phone the same
// card less its margins, still rounded. Only the narrowest phones, where the
// margins would cost too much of the card, run it edge to edge (square
// corners, full width, and the details panel under it the same).
// Widths are against the drill's scroll area (cqw), not the viewport, so an
// open settings sidebar can't push the card wider than the room beside it.
export const EDGE_TO_EDGE_MAX = 360
export const DRILL_CARD_WIDTH = 'min(380px, calc(100cqw - 32px), calc(var(--card-max-h, 9999px) * 380 / 280))'

export function useDrillCardSize() {
  const edgeToEdge = useIsMobile(EDGE_TO_EDGE_MAX)
  const width = edgeToEdge ? '100cqw' : DRILL_CARD_WIDTH
  return { edgeToEdge, width }
}

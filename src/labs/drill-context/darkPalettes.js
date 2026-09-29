// Dark versions of the details panel, as palettes for the real CardDetails
// (its `palette` prop). The card above stays paper in every one: the point is
// to keep light for the thing being tested and let the panel under it recede.
// Each only overrides what differs from the paper palette.

const LIGHT_TEXT = '#E8E8E8'
const MUTED = '#8f8f8f'
const WHITE_BAR = 'rgba(255,255,255,0.10)'

export const VARIANTS = [
  {
    id: 'paper',
    name: 'Paper (today)',
    summary: 'The shipped panel, for comparison: the same paper as the card, so the two read as one object in two parts.',
    palette: null,
  },
  {
    id: 'ink',
    name: 'Ink',
    summary: 'A warm charcoal slab, the card’s own shadow side: same shape, corners and drop shadow as the card, so it still reads as its companion, only turned dark. The warmth keeps it from looking like app chrome.',
    palette: {
      bg: '#2B2926',
      ink: '#ECE7DF',
      target: '#FFFFFF',
      rt: '#A39C91',
      quiet: '#9C958B',
      tileInk: '#DDD7CD',
      corner: '#B8B1A6',
      bar: 'rgba(255,248,235,0.11)',
      hover: 'rgba(255,255,255,0.07)',
      footerBg: 'rgba(255,255,255,0.03)',
      footerBorder: 'rgba(255,255,255,0.08)',
      divider: 'rgba(255,255,255,0.06)',
      shadow: '0 4px 0 rgba(0,0,0,0.35)',
      popBg: '#3A3733',
      popBorder: 'rgba(255,255,255,0.12)',
    },
  },
  {
    id: 'surface',
    name: 'Surface',
    summary: 'The app’s own card surface — the same grey and hairline border as the settings drawer’s groups. The panel becomes interface, the card stays the one piece of paper on screen.',
    palette: {
      bg: '#2A2A2A',
      ink: LIGHT_TEXT,
      target: '#FFFFFF',
      rt: MUTED,
      quiet: MUTED,
      tileInk: '#D6D6D6',
      corner: '#B0B0B0',
      bar: WHITE_BAR,
      hover: 'rgba(255,255,255,0.06)',
      footerBg: 'rgba(255,255,255,0.025)',
      footerBorder: 'rgba(255,255,255,0.08)',
      divider: 'rgba(255,255,255,0.06)',
      border: '1px solid #2E2E2E',
      shadow: 'none',
      popBg: '#363636',
      popBorder: 'rgba(255,255,255,0.14)',
    },
  },
  {
    id: 'outline',
    name: 'Outline',
    summary: 'No fill at all: a hairline around the sentence and tiles, on the page itself. The lightest way to still say “this belongs to the card”. Chosen: this is now the product’s default panel, with a sun in its corner to switch to paper.',
    palette: {
      bg: 'transparent',
      ink: LIGHT_TEXT,
      target: '#FFFFFF',
      rt: MUTED,
      quiet: MUTED,
      tileInk: '#D6D6D6',
      corner: '#A0A0A0',
      bar: WHITE_BAR,
      hover: 'rgba(255,255,255,0.06)',
      footerBg: 'transparent',
      footerBorder: 'rgba(255,255,255,0.10)',
      divider: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.14)',
      shadow: 'none',
    },
  },
  {
    id: 'well',
    name: 'Well',
    summary: 'Darker than the page, as if the card sits above a recess it was lifted out of. The inset shadow pushes it back, so it can never compete with the card for attention.',
    palette: {
      bg: '#151515',
      ink: '#DEDEDE',
      target: '#FFFFFF',
      rt: '#858585',
      quiet: '#858585',
      tileInk: '#CFCFCF',
      corner: '#9A9A9A',
      bar: 'rgba(255,255,255,0.09)',
      hover: 'rgba(255,255,255,0.05)',
      footerBg: 'rgba(255,255,255,0.02)',
      footerBorder: 'rgba(255,255,255,0.06)',
      divider: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(0,0,0,0.6)',
      shadow: 'inset 0 2px 6px rgba(0,0,0,0.55)',
    },
  },
]

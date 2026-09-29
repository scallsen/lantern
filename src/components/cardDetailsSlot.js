// Reserved room under the card, [desktop, phone], by which halves are on:
// two lines of sentence plus its translation and the kanji tiles, measured
// from the rendered panel (1px border included) so a panel exactly that tall
// doesn't nudge the buttons by a pixel or two. The panel hugs its content at
// the top of the slot, so the card and the buttons below hold still from
// card to card. A sentence longer than two lines steps its type down to fit
// (useFitLines) rather than grow the panel.
// On a phone that's also room for a longer sentence at its smallest step,
// which still takes three narrow lines.
export const SLOT = {
  both: [225, 207],
  sentence: [166, 150],
  kanji: [80, 76],
}

export const DETAILS_HIDDEN_HEIGHT = 36

// The room the panel keeps for `settings`, or the "Show details" button's
// when it's hidden. A phone drill centres its card as if the panel always
// filled this, so the card holds still without the room itself taking space.
export function detailsSlot(settings, mobile) {
  if (!(settings.details && (settings.sentence || settings.kanjiMeanings))) return DETAILS_HIDDEN_HEIGHT
  const config = !settings.sentence ? 'kanji' : !settings.kanjiMeanings ? 'sentence' : 'both'
  return SLOT[config][mobile ? 1 : 0]
}

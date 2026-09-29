// The first lab's concepts: copy, lab controls and default state for each,
// alongside the screen that renders it.
import {
  Baseline, SentenceTapeConcept, KanjiFamilyConcept, ContextBandConcept,
  SentenceFrontConcept, SentenceStageConcept, WordSheetConcept,
} from './concepts.jsx'

const FURIGANA = { key: 'furigana', label: 'Sentence furigana', options: [['new', 'New words only'], ['all', 'All'], ['off', 'Off']] }
const ENGLISH = { key: 'english', label: 'Translation', options: [['tap', 'Tap to show'], ['show', 'Always'], ['hide', 'Off']] }

export const CONCEPTS = [
  {
    id: 'today', tag: '0', name: 'Today',
    Screen: Baseline,
    pitch: "The current back face with translation, sentence and kanji meanings all on. Everything shares one fixed 380×280 card, and the sentence gets the smallest, greyest type on it. It's here for comparison.",
    lookFor: ['How small the sentence is next to the word.', 'Flip 消費者 or 長期. Long sentences push the kanji bar and the meaning together.'],
    risks: [],
    controls: [],
    defaults: { flipped: true },
  },
  {
    id: 'tape', tag: 'A', name: 'Sentence tape',
    Screen: SentenceTapeConcept,
    pitch: 'The card goes back to being a flashcard: word, reading, meaning. On flip, a paper strip slides out beneath it with the example sentence at reading size. It has its own furigana rule (only on words you haven\'t learned), tap-a-word glosses, audio and a pager across up to three sentences. On desktop the tape is wider than the card, so a sentence mostly fits on one or two lines.',
    lookFor: [
      'Tap any word in the sentence. The popover says whether it\'s this card, in this lesson, known (and from where) or new.',
      'Switch "Tape position". Under the card, the verdict buttons sit lower by a reserved amount. Under the buttons, nothing moves, but you read past the buttons first.',
      'Try 温かい. None of its three sentences write it that way (see findings).',
    ],
    risks: ['Reserved height means an empty gap on the front, or buttons that move on flip.', 'On a phone the tape plus card plus buttons nearly fills the screen.'],
    controls: [
      FURIGANA, ENGLISH,
      { key: 'tapePos', label: 'Tape position', options: [['card', 'Under card'], ['buttons', 'Under buttons']] },
      { key: 'kanjiBar', label: 'Kanji bar on card', options: [[true, 'On'], [false, 'Off']] },
    ],
    defaults: { flipped: true, furigana: 'new', english: 'tap', tapePos: 'card', kanjiBar: true },
  },
  {
    id: 'kanji', tag: 'B', name: 'Kanji family',
    Screen: KanjiFamilyConcept,
    pitch: "The card's kanji bar becomes tabs. Below the card, the selected kanji shows its meanings and readings, then the words that share it: ones you already know, others in this lesson, and optionally common ones you haven't met. The shared character is picked out in red in every word.",
    lookFor: [
      'Tap the kanji tiles on the card back.',
      '期間 → 期: no known words, but 5 siblings in this lesson. 気温 → 気: 7 known words from Genki.',
      '費用 → 費 and 製品 → 製: new kanji. Only the lesson itself links them.',
    ],
    risks: ['It competes with the sentence for the same space, so B alone drops sentences from the drill.', 'Chip walls get tall fast. Turn common words on for 気温: 期 or 気 alone push the verdict buttons off a laptop screen, so the panel needs a hard cap.'],
    controls: [{ key: 'showCommon', label: 'Common words', options: [[true, 'Show'], [false, 'Hide']] }],
    defaults: { flipped: true, showCommon: false },
  },
  {
    id: 'band', tag: 'C', name: 'Context band',
    Screen: ContextBandConcept,
    pitch: 'A and B in one slot. A band under the card has a tab for the sentence and one per kanji ("期 period", "間 interval"). The chosen tab carries over to the next card, so someone who likes kanji links keeps seeing them. It can be collapsed to just the tab row for pure speed.',
    lookFor: ['Pick a kanji tab, then answer. The next card opens on its first kanji.', 'Hide the band. How much calmer is the drill?', 'The phone band with 4 tabs (賞味期限).'],
    risks: ['Another control to learn inside a speed drill.', 'Tabs on a phone crowd quickly with 4-kanji words.'],
    controls: [FURIGANA, ENGLISH],
    defaults: { flipped: true, furigana: 'new', english: 'tap', tab: 'sentence', collapsed: false, showCommon: false },
  },
  {
    id: 'front', tag: 'D', name: 'Sentence on the front',
    Screen: SentenceFrontConcept,
    pitch: 'The optional mode: the question is asked through the sentence. "In context" marks the word inside the sentence and asks what it is (reading plus meaning). "Cloze" blanks it out and gives the English meaning, so you produce the word. The back is the same card plus sentence tape as A.',
    lookFor: ['Flip back and forth: is the back redundant once the front already had the sentence?', 'Try 温かい. There is no sentence to use, so it falls back to the plain word.', '限る: the sentences use とは限らない ("not necessarily"), not "to restrict".'],
    risks: ['Cloze with the meaning as a hint is a production drill. It\'s harder and a different skill.', 'Needs the sentence to actually contain the word.'],
    controls: [{ key: 'frontStyle', label: 'Front', options: [['context', 'In context'], ['cloze', 'Cloze']] }, FURIGANA, ENGLISH],
    defaults: { flipped: false, frontStyle: 'context', furigana: 'new', english: 'tap' },
  },
  {
    id: 'stage', tag: 'E', name: 'Sentence first (no card)',
    Screen: SentenceStageConcept,
    pitch: 'Goes further: drop the card and make the sentence the stage. The sentence is set large like the reader, with the word marked. Revealing adds its reading in place, the translation, a short answer row (word, meaning, kanji) and the other examples. Judging moves to a bottom bar, like other screens\' action bars. This treats the drill as reading practice, and it inverts "sentence on the back".',
    lookFor: ['It works as a front style for D, or as its own drill mode ("Read")?', 'The HUD moves into the header to give the sentence the room.'],
    risks: ['Loses the flip card identity and its tactile flip.', 'Speed drops. It\'s a slower, deeper mode by design.'],
    controls: [FURIGANA],
    defaults: { flipped: false, furigana: 'new', english: 'show' },
  },
  {
    id: 'sheet', tag: 'F', name: 'Word sheet (no card)',
    Screen: WordSheetConcept,
    pitch: 'Also goes further, but keeps the word-first question. There\'s no box: the word sits large in open space. Revealing shrinks it slightly, adds its reading and meaning, and opens a sheet below with a sentence column and a kanji column. Nothing is squeezed to fit a card, the page just gets longer. The verdict lives in a bottom bar, so it never moves.',
    lookFor: ['Desktop uses the width: sentence and kanji sit side by side.', 'Phone: the sheet scrolls under a fixed bar. Does that still feel like a drill?'],
    risks: ['Loses the card, which is a big part of the drill\'s character (flip, the marching ants, the paper).', 'The kanji column is always there: noisy for a quick yes/no.'],
    controls: [FURIGANA, ENGLISH],
    defaults: { flipped: true, furigana: 'new', english: 'tap' },
  },
]

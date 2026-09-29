import Japanese from './Japanese.jsx'
import { buildFurigana } from '../utils/furigana.js'
import { cqw } from '../utils/cardTextFit.js'

const INK = '#222'
const READING_INK = '#666'

// The word on a drill card, with or without its reading. Shared by Vocab
// Drill's VocabCard and the SRS's SrsCardFace, so the reading-position setting
// means the same thing on both.
//
// `readingPosition`: 'below' puts the reading on its own line under the word
// (the default — it reads as the answer rather than as a hint pinned to the
// kanji); 'above' is classic furigana over each kanji run. No drop shadow:
// the paper card carries its own.
export default function CardWord({ form, reading, showReading, readingPosition = 'below', jaFont, scale = 1 }) {
  const size = cqw(12.63, scale)
  const hasReading = showReading && reading && reading !== form

  if (hasReading && readingPosition === 'below') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8cqw' }}>
        <Japanese as="div" style={{ fontFamily: jaFont, fontSize: size, lineHeight: 1.15, textAlign: 'center', color: INK }}>{form}</Japanese>
        <Japanese as="div" style={{ fontFamily: jaFont, fontSize: cqw(5.4, scale), lineHeight: 1.2, letterSpacing: '0.08em', textAlign: 'center', color: READING_INK }}>{reading}</Japanese>
      </div>
    )
  }

  // buildFurigana returns null not just for a missing reading but whenever
  // the kana doesn't match the kanji's structure (bad word data — e.g. a
  // mistyped custom word list entry). Fall back to plain text rather than
  // crash the whole drill.
  const parts = hasReading ? buildFurigana(form, reading) : null
  if (hasReading && !parts) console.warn(`[CardWord] buildFurigana couldn't match reading "${reading}" to "${form}" — rendering without furigana`)
  return (
    <Japanese as="div" style={{ fontFamily: jaFont, fontSize: size, lineHeight: parts ? 1.4 : 1.2, textAlign: 'center', color: INK }}>
      {parts
        ? parts.map((part, i) => (part.type === 'kanji'
          ? <ruby key={i}>{part.text}<rt style={{ fontSize: '0.45em', fontFamily: jaFont, letterSpacing: '0.05em', paddingBottom: '0.25em', color: READING_INK }}>{part.furigana}</rt></ruby>
          : <span key={i}>{part.text}</span>))
        : form}
    </Japanese>
  )
}

import { describe, it, expect, beforeAll } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import VocabCard from './VocabCard.jsx'

beforeAll(() => {
  globalThis.window = { innerWidth: 1280, addEventListener() {}, removeEventListener() {} }
})

const WORD = { id: 'w1', kanji: '経験', kana: 'けいけん', english: 'experience', listKey: 'x' }

// Both faces are rendered at once (the flip is a CSS transform), so the two
// halves of the markup are inspected separately.
function faces(showFurigana) {
  const html = renderToStaticMarkup(
    <VocabCard word={WORD} flipped={false} onFlip={() => {}} animate={false} reviewMode="kanji-front" showFurigana={showFurigana} showTranslation pixelFont={false} />
  )
  const split = html.indexOf('fc-face--back')
  return { front: html.slice(0, split), back: html.slice(split) }
}

const rubies = s => (s.match(/<ruby>/g) ?? []).length

describe('VocabCard furigana', () => {
  // The regression this pins: the back was gated on the same setting as the
  // front, so turning off the front's hint also removed the answer's reading.
  it('always gives the reading on the back, whatever the setting says', () => {
    expect(faces(false).back).toContain('けいけん')
    expect(faces(true).back).toContain('けいけん')
  })

  it('gives the reading on the front only when the setting is on', () => {
    expect(faces(false).front).not.toContain('けいけん')
    expect(faces(true).front).toContain('けいけん')
  })

  it('puts the reading under the word by default, and as furigana above on request', () => {
    expect(rubies(faces(true).back)).toBe(0)
    const html = renderToStaticMarkup(
      <VocabCard word={WORD} flipped={false} onFlip={() => {}} animate={false} reviewMode="kanji-front" showFurigana showTranslation readingPosition="above" pixelFont={false} />
    )
    expect(rubies(html)).toBeGreaterThan(0)
  })

  // Regression: a word whose kana doesn't actually match its kanji (bad data —
  // typically a mistyped custom word list entry) made buildFurigana return
  // null, which RubyText then crashed on (`null.map`), blanking the whole
  // drill with no way to recover since nothing wraps it in an error boundary.
  it('renders without crashing when the reading cannot be matched to the kanji', () => {
    const mismatched = { id: 'w2', kanji: '経験', kana: 'ぜんぜんちがう', english: 'experience', listKey: 'x' }
    expect(() => renderToStaticMarkup(
      <VocabCard word={mismatched} flipped={false} onFlip={() => {}} animate={false} reviewMode="kanji-front" showFurigana showTranslation pixelFont={false} />
    )).not.toThrow()
  })
})

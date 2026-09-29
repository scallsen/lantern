import { describe, it, expect } from 'vitest'
import { cardSpeechText, speechTextOf } from './displayForm.js'

describe('cardSpeechText', () => {
  // Regression: the SRS drill keyed a card's clip on its raw reading, so a card
  // copied from a class list (しんこく（な）) asked for a clip the generator never
  // makes — it records the decoration-stripped text instead.
  it('says what the generator records for the same list word', () => {
    const word = { kanji: '深刻（な）', kana: 'しんこく（な）' }
    expect(cardSpeechText({ front: word.kanji, kana: word.kana })).toBe(speechTextOf(word, null))
    expect(cardSpeechText({ front: '～製', kana: '～せい' })).toBe('せい')
  })

  it('falls back to the front when a card has no reading', () => {
    expect(cardSpeechText({ front: 'すし' })).toBe('すし')
  })

  it('says nothing for a card with no content', () => {
    expect(cardSpeechText({})).toBeNull()
    expect(cardSpeechText(null)).toBeNull()
  })
})

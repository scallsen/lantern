import { describe, it, expect } from 'vitest'
import { tokenizeSentence } from './sentenceTokens.js'

// Real Tanaka sentences and the dictionary rows their dictionary_ids resolve to.
const entry = (id, primary_form, kana_forms, extra = {}) => ({ id, primary_form, kana_forms, preferred_form: null, misc0: [], ...extra })

const ENTRIES = {
  1350300: entry('1350300', '消費者', ['しょうひしゃ']),
  1350290: entry('1350290', '消費', ['しょうひ']),
  1350330: entry('1350330', '消費税', ['しょうひぜい']),
  1482970: entry('1482970', '反対', ['はんたい']),
  1597800: entry('1597800', '立ち上がる', ['たちあがる']),
  1586270: entry('1586270', '多く', ['おおく']),
  2028930: entry('2028930', 'の', ['の']),
}
const SENTENCE = '多くの消費者は消費税反対に立ち上がった。'
const CARD = { id: '1350300', form: '消費者', reading: 'しょうひしゃ' }

const text = tokens => tokens.map(t => t.t).join('')

describe('tokenizeSentence', () => {
  const tokens = tokenizeSentence(SENTENCE, ENTRIES, CARD)

  it('covers the whole sentence, in order', () => {
    expect(text(tokens)).toBe(SENTENCE)
  })

  it('marks the card’s word, with its reading', () => {
    const target = tokens.filter(t => t.target)
    expect(target.map(t => t.t)).toEqual(['消費者'])
    expect(target[0].parts).toEqual([{ type: 'kanji', text: '消費者', furigana: 'しょうひしゃ' }])
  })

  it('prefers the longest word, so 消費税 is not split into 消費 + 税', () => {
    expect(tokens.find(t => t.t.startsWith('消費税'))?.id).toBe('1350330')
  })

  it('matches an inflected verb by its stem and leaves the inflection plain', () => {
    const i = tokens.findIndex(t => t.id === '1597800')
    expect(tokens[i].t).toBe('立ち上が')
    expect(tokens[i].parts.map(p => p.furigana ?? p.text).join('')).toBe('たちあが')
    expect(tokens[i + 1].id).toBeUndefined()
  })

  it('never makes a word of a short kana-only entry like の', () => {
    expect(tokens.some(t => t.id === '2028930')).toBe(false)
  })

  it('finds the card’s word by its form when the sentence isn’t indexed to it', () => {
    const plain = tokenizeSentence('違法駐車の取り締まりを始めた。', {}, { id: '1433110', form: '駐車', reading: 'ちゅうしゃ' })
    expect(plain.find(t => t.target)?.t).toBe('駐車')
    expect(text(plain)).toBe('違法駐車の取り締まりを始めた。')
  })

  it('returns an empty list for no sentence', () => {
    expect(tokenizeSentence('', ENTRIES, CARD)).toEqual([])
  })
})

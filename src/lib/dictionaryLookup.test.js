import { describe, it, expect } from 'vitest'
import { resolveDecoratedMatches, matchKey } from './dictionaryLookup.js'

const ROWS = [
  { id: '1362730', primary_form: '深刻', kanji_forms: ['深刻'], kana_forms: ['しんこく'], common: true },
  { id: '1380580', primary_form: '製', kanji_forms: ['製'], kana_forms: ['せい'], common: true },
  { id: '1545790', primary_form: '様', kanji_forms: ['様'], kana_forms: ['さま'], common: true },
  { id: '1513940', primary_form: '保存', kanji_forms: ['保存'], kana_forms: ['ほぞん'], common: true },
  { id: '2835807', primary_form: 'さい', kanji_forms: [], kana_forms: ['さい'], common: false },
]

// Just enough of the Supabase query builder for resolveJmdictMatches:
// .from().select().in(column, values) and .overlaps(column, values).
function fakeClient(rows = ROWS) {
  const query = {
    select: () => query,
    in: (col, values) => Promise.resolve({ data: rows.filter(r => values.includes(r[col])), error: null }),
    overlaps: (col, values) => Promise.resolve({ data: rows.filter(r => r[col].some(v => values.includes(v))), error: null }),
  }
  return { from: () => query }
}

async function match(form, kana) {
  const result = await resolveDecoratedMatches(fakeClient(), [{ form, kana }])
  return result.get(matchKey(form, kana))?.id ?? null
}

describe('resolveDecoratedMatches', () => {
  it('matches a word through the decoration a list prints around it', async () => {
    expect(await match('深刻（な）', 'しんこく（な）')).toBe('1362730')
    expect(await match('～製', '～せい')).toBe('1380580')
  })

  it('treats a 〇〇 placeholder like 〜', async () => {
    expect(await match('〇〇様', '〇〇さま')).toBe('1545790')
  })

  it('falls back to the する-stem', async () => {
    expect(await match('保存する', 'ほぞんする')).toBe('1513940')
  })

  // Regression: stripping ～祭's 〜 left 祭, and the kana fallback accepted the
  // kana-only entry さい ("so; like that") on reading alone.
  it('never links a kanji form to an entry that does not list it', async () => {
    expect(await match('～祭', '～さい')).toBeNull()
  })

  it('still requires the reading to agree', async () => {
    expect(await match('深刻（な）', 'ふかい')).toBeNull()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
// best_sentences doesn't return a sentence's dictionary_ids; they're read
// from the table in the same request.
const WORDS = [{ id: 's1', dictionary_ids: ['1', '1008910'] }]
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    rpc: (...args) => rpc(...args),
    from: () => ({ select: () => ({ in: async () => ({ data: WORDS }) }) }),
  },
}))

const BEST = { dictionary_id: '1', id: 's1', japanese: '頼りにしている。', english: 'I rely on you.', quality: true }
const ROW = { ...BEST, dictionary_ids: ['1', '1008910'] }

// The module caches across calls, so each test gets a fresh copy.
async function freshLookup() {
  vi.resetModules()
  return (await import('./sentenceLookup.js')).fetchSentencesFor
}

beforeEach(() => { rpc.mockReset() })

describe('fetchSentencesFor', () => {
  // Regression: the card face and the drill's sentence audio both ask for a new
  // card's sentence in the same commit. The second caller used to read the
  // cache before the first request returned and was told there was no
  // sentence, so it showed but never autoplayed.
  it('gives a concurrent caller the sentence, not a premature null', async () => {
    let respond
    rpc.mockReturnValue(new Promise(r => { respond = r }))
    const fetchSentencesFor = await freshLookup()

    const first = fetchSentencesFor(['1'])
    const second = fetchSentencesFor(['1'])
    respond({ data: [BEST] })

    expect(await first).toEqual({ 1: ROW })
    expect(await second).toEqual({ 1: ROW })
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('caches a word with no sentence as null', async () => {
    rpc.mockResolvedValue({ data: [] })
    const fetchSentencesFor = await freshLookup()
    expect(await fetchSentencesFor(['2'])).toEqual({ 2: null })
    expect(await fetchSentencesFor(['2'])).toEqual({ 2: null })
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed request instead of caching the failure', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'offline' } }).mockResolvedValueOnce({ data: [BEST] })
    const fetchSentencesFor = await freshLookup()
    expect(await fetchSentencesFor(['1'])).toEqual({})
    expect(await fetchSentencesFor(['1'])).toEqual({ 1: ROW })
  })
})

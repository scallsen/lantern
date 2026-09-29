#!/usr/bin/env node
// Throwaway voice comparison lab. Picks 20 Genki I words that have a Tanaka
// example sentence, synthesizes the word and the sentence for each candidate
// voice on a local Voicevox engine, and writes MP3s + manifest.json next to
// voice-lab/index.html. Nothing is uploaded.
//
// Run: node --env-file=.env voice-lab/generate.mjs
// View: npm run dev, then open http://localhost:5173/voice-lab/

import { createClient } from '@supabase/supabase-js'
import { cardFormOf, speechTextOf, DISPLAY_FORM_COLUMNS } from '../src/lib/displayForm.js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)
const VOICEVOX_URL = process.env.VOICEVOX_URL ?? 'http://localhost:50021'
const OUT = 'voice-lab'
const WORD_COUNT = 20

const VOICES = [
  { id: 2, name: '四国めたん', romaji: 'Shikoku Metan', note: 'current female' },
  { id: 118, name: '夜語トバリ', romaji: 'Yogatari Tobari', note: 'new female' },
  { id: 9, name: '波音リツ', romaji: 'Namine Ritsu', note: '' },
  { id: 27, name: '後鬼', romaji: 'Goki', note: 'human ver.' },
  { id: 108, name: '東北きりたん', romaji: 'Tohoku Kiritan', note: '' },
  { id: 109, name: '東北イタコ', romaji: 'Tohoku Itako', note: '' },
  { id: 113, name: 'あんこもん', romaji: 'Ankomon', note: '' },
  { id: 11, name: '玄野武宏', romaji: 'Kurono Takehiro', note: 'current male, for reference' },
]

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
)

async function pickWords() {
  const words = JSON.parse(readFileSync('src/data/words/genki_1_vocab.json', 'utf8'))
    .filter(w => w.jmdictId && !/-l[12]-/.test(w.listKey))
  const ids = [...new Set(words.map(w => w.jmdictId))]

  const { data: entries, error } = await supabase.from('dictionary')
    .select(`id, gloss_en, ${DISPLAY_FORM_COLUMNS}`).in('id', ids)
  if (error) throw error
  const entryById = new Map(entries.map(e => [e.id, e]))

  const sentenceById = new Map()
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    const { data, error: sErr } = await supabase.from('sentences')
      .select('id, japanese, english, dictionary_ids, quality').overlaps('dictionary_ids', batch)
    if (sErr) throw sErr
    for (const id of batch) {
      const best = data.filter(r => r.dictionary_ids.includes(id) && r.quality && r.japanese.length >= 8 && r.japanese.length <= 28)
        .sort((a, b) => a.japanese.length - b.japanese.length)[0]
      if (best) sentenceById.set(id, best)
    }
  }

  const eligible = []
  const seen = new Set()
  for (const w of words) {
    const entry = entryById.get(w.jmdictId)
    const sentence = sentenceById.get(w.jmdictId)
    const reading = speechTextOf(w, entry)
    if (!entry || !sentence || !reading || seen.has(w.jmdictId)) continue
    seen.add(w.jmdictId)
    const gloss = Array.isArray(entry.gloss_en) ? entry.gloss_en.slice(0, 3).join('; ') : entry.gloss_en
    eligible.push({ id: w.id, lesson: w.listKey, form: cardFormOf(w, entry).form, reading, gloss, sentence: { japanese: sentence.japanese, english: sentence.english } })
  }
  // Spread across the book rather than taking one lesson's worth.
  const step = eligible.length / WORD_COUNT
  return Array.from({ length: WORD_COUNT }, (_, i) => eligible[Math.floor(i * step)])
}

async function synthesize(text, speaker) {
  const q = await fetch(`${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`, { method: 'POST' })
  if (!q.ok) throw new Error(`audio_query ${q.status}`)
  const s = await fetch(`${VOICEVOX_URL}/synthesis?speaker=${speaker}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(await q.json()),
  })
  if (!s.ok) throw new Error(`synthesis ${s.status}`)
  return Buffer.from(await s.arrayBuffer())
}

async function toMp3(wav, outPath) {
  const tmp = join(tmpdir(), `voice-lab-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`)
  writeFileSync(tmp, wav)
  await execFileAsync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-codec:a', 'libmp3lame', '-qscale:a', '4', outPath])
}

async function main() {
  const words = await pickWords()
  const jobs = []
  for (const v of VOICES) {
    mkdirSync(`${OUT}/audio/${v.id}`, { recursive: true })
    words.forEach((w, i) => {
      jobs.push({ text: w.reading, speaker: v.id, path: `${OUT}/audio/${v.id}/${i}-word.mp3` })
      jobs.push({ text: w.sentence.japanese, speaker: v.id, path: `${OUT}/audio/${v.id}/${i}-sentence.mp3` })
    })
  }
  const todo = jobs.filter(j => !existsSync(j.path))
  console.log(`${words.length} words, ${VOICES.length} voices: ${todo.length} clip(s) to make`)

  let next = 0
  let done = 0
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < todo.length) {
      const job = todo[next++]
      await toMp3(await synthesize(job.text, job.speaker), job.path)
      if (++done % 20 === 0 || done === todo.length) process.stdout.write(`\r  ${done}/${todo.length}`)
    }
  }))
  process.stdout.write('\n')

  writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ voices: VOICES, words }, null, 2))
  console.log(`Wrote ${OUT}/manifest.json`)
}

main().catch(err => { console.error(err); process.exit(1) })

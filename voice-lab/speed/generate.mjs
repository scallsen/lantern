#!/usr/bin/env node
// Throwaway speed comparison. Renders the voice lab's 20 example sentences at
// slower Voicevox speedScale values for the two production voices, next to
// voice-lab/speed/index.html. The 1.0 clips are reused from voice-lab/audio.
//
// Run: node voice-lab/speed/generate.mjs   (needs voice-lab/manifest.json)
// View: npm run dev, then open http://localhost:5173/voice-lab/speed/

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)
const VOICEVOX_URL = process.env.VOICEVOX_URL ?? 'http://localhost:50021'
const OUT = 'voice-lab/speed/audio'
const VOICES = [9, 11]
const SPEEDS = [0.9, 0.8, 0.75]

const { words } = JSON.parse(readFileSync('voice-lab/manifest.json', 'utf8'))

async function synthesize(text, speaker, speedScale) {
  const q = await fetch(`${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`, { method: 'POST' })
  if (!q.ok) throw new Error(`audio_query ${q.status}`)
  const query = { ...(await q.json()), speedScale }
  const s = await fetch(`${VOICEVOX_URL}/synthesis?speaker=${speaker}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(query),
  })
  if (!s.ok) throw new Error(`synthesis ${s.status}`)
  return Buffer.from(await s.arrayBuffer())
}

const jobs = []
for (const v of VOICES) {
  mkdirSync(`${OUT}/${v}`, { recursive: true })
  for (const speed of SPEEDS) {
    words.forEach((w, i) => jobs.push({ v, speed, text: w.sentence.japanese, path: `${OUT}/${v}/${i}-${speed}.mp3` }))
  }
}
const todo = jobs.filter(j => !existsSync(j.path))
console.log(`${todo.length} clip(s) to make`)
let next = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < todo.length) {
    const j = todo[next++]
    const tmp = join(tmpdir(), `speed-lab-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`)
    writeFileSync(tmp, await synthesize(j.text, j.v, j.speed))
    await execFileAsync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-codec:a', 'libmp3lame', '-qscale:a', '4', j.path])
  }
}))
writeFileSync('voice-lab/speed/manifest.json', JSON.stringify({ speeds: SPEEDS, words }, null, 2))
console.log('done')

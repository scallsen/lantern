#!/usr/bin/env node
/**
 * Backfills `jmdictId` onto Vocab SRS cards that have none.
 *
 * A card is a snapshot: addWordsToDeck copies the word's fields when the card
 * is made and never looks back. Cards made from a personal list before
 * backfill-custom-words-jmdict.mjs linked that list therefore stayed unlinked
 * even once the word itself was — and an unlinked card shows no Tanaka
 * sentence and has no sentence audio. Anki-imported cards start unlinked too.
 *
 * Each card is linked from, in order:
 *   1. the same account's custom_words word with the card's front (and
 *      reading) — the word the card was most likely made from, so it inherits
 *      exactly the link that list already carries;
 *   2. a reading-verified dictionary match on the card's front and reading,
 *      decoration stripped (resolveDecoratedMatches). A card with no reading
 *      is only matched when its front is itself kana.
 *
 * Skips a card marked `noJmdict: true`, and one whose list word is — both mean
 * someone checked and no entry fits.
 *
 * Only fills jmdictId where it's currently absent — never overwrites or clears
 * one. The write is conditional on the row's updated_at, so a save the app
 * made in the meantime is never overwritten; that account is simply retried on
 * the next run. An app tab left open with the old cards in memory can still
 * save over the new links, for the same reason — the nightly run
 * (generate-vocab-audio.yml) puts them back.
 *
 * Run: node --env-file=.env scripts/backfill-srs-jmdict.mjs [--dry-run]
 * Writes unmatched cards to backfill-srs-jmdict-report.json for manual review.
 *
 * Env vars required:
 *   SUPABASE_URL (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { resolveDecoratedMatches, matchKey } from '../src/lib/dictionaryLookup.js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const DRY_RUN = process.argv.includes('--dry-run')
const KANA_ONLY = /^[぀-ヿー]+$/u

async function fetchAll(table, columns, filter = q => q) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await filter(supabase.from(table).select(columns)).range(from, from + 999)
    if (error) throw error
    rows.push(...data)
    if (data.length < 1000) break
  }
  return rows
}

async function main() {
  const progressRows = await fetchAll('progress', 'user_id, payload, updated_at', q => q.eq('namespace', 'vocab-srs'))
  const customWords = await fetchAll('custom_words', 'user_id, payload')

  // Keyed by account, then by front+reading and front alone: a card's front is
  // the list word's kanji as printed, decoration and all.
  const listLinks = new Map()
  const listRejected = new Map()
  for (const { user_id, payload: w } of customWords) {
    if (w.noJmdict && w.kanji) {
      if (!listRejected.has(user_id)) listRejected.set(user_id, new Set())
      listRejected.get(user_id).add(w.kanji)
    }
    if (!w.jmdictId || !w.kanji) continue
    if (!listLinks.has(user_id)) listLinks.set(user_id, new Map())
    const links = listLinks.get(user_id)
    links.set(matchKey(w.kanji, w.kana ?? null), w.jmdictId)
    if (!links.has(w.kanji)) links.set(w.kanji, w.jmdictId)
  }

  const pending = []
  for (const row of progressRows) {
    for (const [key, card] of Object.entries(row.payload?.cards ?? {})) {
      if (card.jmdictId || card.noJmdict || !card.front) continue
      // Its list word was ruled out by hand; the dictionary would only find the
      // same homograph again.
      if (listRejected.get(row.user_id)?.has(card.front)) continue
      const links = listLinks.get(row.user_id)
      const fromList = links?.get(matchKey(card.front, card.kana ?? null)) ?? links?.get(card.front)
      pending.push({ row, key, card, fromList })
    }
  }
  console.log(`${progressRows.length} SRS account(s), ${pending.length} unlinked card(s)`)

  const toMatch = pending.filter(p => !p.fromList).map(p => {
    const kana = p.card.kana ?? (KANA_ONLY.test(p.card.front) ? p.card.front : null)
    return { form: p.card.front, kana }
  })
  const matches = await resolveDecoratedMatches(supabase, toMatch.filter(w => w.kana))

  const updatesByUser = new Map()
  const report = []
  let fromList = 0, fromDictionary = 0
  for (const p of pending) {
    const kana = p.card.kana ?? (KANA_ONLY.test(p.card.front) ? p.card.front : null)
    const id = p.fromList ?? (kana ? matches.get(matchKey(p.card.front, kana))?.id : null)
    if (!id) {
      report.push({ user_id: p.row.user_id, card: p.key, front: p.card.front, kana: p.card.kana ?? null })
      continue
    }
    p.fromList ? fromList++ : fromDictionary++
    if (!updatesByUser.has(p.row.user_id)) updatesByUser.set(p.row.user_id, { row: p.row, ids: {} })
    updatesByUser.get(p.row.user_id).ids[p.key] = id
  }

  console.log(`Linked ${fromList + fromDictionary}/${pending.length}: ${fromList} from their list word, ${fromDictionary} from the dictionary`)
  if (report.length) {
    writeFileSync('backfill-srs-jmdict-report.json', JSON.stringify(report, null, 2) + '\n')
    console.log(`${report.length} card(s) left unmatched — see backfill-srs-jmdict-report.json.`)
  }

  if (DRY_RUN) {
    console.log('Dry run — nothing written.')
    return
  }

  for (const [userId, { row, ids }] of updatesByUser) {
    const cards = { ...row.payload.cards }
    for (const [key, id] of Object.entries(ids)) cards[key] = { ...cards[key], jmdictId: id }
    const { data, error } = await supabase.from('progress')
      .update({ payload: { ...row.payload, cards }, updated_at: new Date().toISOString() })
      .eq('user_id', userId).eq('namespace', 'vocab-srs').eq('updated_at', row.updated_at)
      .select('user_id')
    if (error) { console.error(`Update failed for ${userId}: ${error.message}`); continue }
    if (!data.length) { console.warn(`Skipped ${userId}: their cards changed during the run — retried next time`); continue }
    console.log(`Wrote ${Object.keys(ids).length} link(s) for ${userId}`)
  }
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})

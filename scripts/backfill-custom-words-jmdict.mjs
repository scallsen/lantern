#!/usr/bin/env node
/**
 * Backfills `jmdictId` onto custom_words rows — a learner's own word lists,
 * moved out of the repo and into their account by upload-custom-words.mjs.
 *
 * scripts/backfill-vocab-jmdict.mjs no longer reaches these words: its
 * TARGETS list points at the local files those lists used to be, which no
 * longer exist, so it silently skips them rather than failing. This is the
 * equivalent pass against the table those files became.
 *
 * Only fills jmdictId where it's currently absent — never overwrites or
 * clears an existing value. Unlike a repo file, a wrong deletion here is a
 * learner's own account data with no source list left to regenerate it from.
 *
 * Run: node --env-file=.env scripts/backfill-custom-words-jmdict.mjs [--dry-run]
 * Writes unmatched entries to backfill-custom-words-jmdict-report.json for
 * manual review; does not fail the run.
 *
 * Env vars required:
 *   SUPABASE_URL (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { resolveJmdictMatches, matchKey } from '../src/lib/dictionaryLookup.js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const DRY_RUN = process.argv.includes('--dry-run')
const PAGE = 1000

// service_role bypasses RLS, so this sees every account's words, not just one.
async function fetchAllRows() {
  const rows = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('custom_words')
      .select('user_id, id, list_key, payload')
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return rows
}

async function main() {
  console.log('Fetching custom_words rows...')
  const rows = await fetchAllRows()
  console.log(`${rows.length} rows total`)

  // isSentenceVocab rows (sentence-vocab.json) carry jmdictId directly and have
  // no kanji/kana of their own to match against — nothing to do for those.
  const candidates = rows.filter(r => !r.payload.jmdictId && r.payload.kanji)
  console.log(`${candidates.length} rows missing jmdictId with a form to match`)

  const words = candidates.map(r => ({ form: r.payload.kanji, kana: r.payload.kana ?? r.payload.kanji }))
  const matches = await resolveJmdictMatches(supabase, words)

  const report = []
  const updates = []
  for (let i = 0; i < candidates.length; i++) {
    const row = candidates[i]
    const { form, kana } = words[i]
    const hit = matches.get(matchKey(form, kana))
    if (hit) {
      updates.push({ user_id: row.user_id, id: row.id, payload: { ...row.payload, jmdictId: hit.id } })
    } else {
      report.push({ user_id: row.user_id, id: row.id, list_key: row.list_key, kanji: form, kana })
    }
  }

  console.log(`Matched ${updates.length}/${candidates.length}`)
  if (report.length) {
    const reportPath = 'backfill-custom-words-jmdict-report.json'
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
    console.log(`${report.length} entries left unmatched — see ${reportPath} for manual review.`)
  }

  if (DRY_RUN) {
    console.log(`Dry run — ${updates.length} row(s) would be updated. Re-run without --dry-run to write.`)
    return
  }

  let written = 0
  for (const u of updates) {
    const { error } = await supabase.from('custom_words')
      .update({ payload: u.payload })
      .eq('user_id', u.user_id).eq('id', u.id)
    if (error) { console.error(`Update failed for ${u.user_id}/${u.id}: ${error.message}`); continue }
    written++
  }
  console.log(`Wrote ${written}/${updates.length} rows.`)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})

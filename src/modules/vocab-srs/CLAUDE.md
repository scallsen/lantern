## Vocab SRS (`#/vocab-srs`)

**Self-contained module** — all code under `src/modules/vocab-srs/`. Do not look elsewhere unless touching shared components.

Anki-style spaced repetition using [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs). **Sign-in required** — the module renders a sign-in gate when the user is logged out; progress is stored in Supabase only (no localStorage fallback for this module).

**Note:** `config.js` exists in the directory but is not imported anywhere — it is vestigial and can be ignored.

### Deck architecture

Cards come from two sources:

**Bundled decks** — static JSON files in `decks/`. Content lives in the JSON; only FSRS scheduling state is persisted to storage. New bundled decks start with no card entries in storage; entries are created on first activation via `initializeDeckCards`. **None currently ship** — `core3k`, `core2000`, and `keigo` were all retired (see below); `DECK_WORDS`/`DECK_FILES` are both empty objects until a new one is added.

**Imported decks** — created from Anki TSV exports, or from the "Import from text / image" flow (see Word import below). Content (front/back/audio/sentence fields) is stored inline on each card object in storage.

Both sources write to the same `cards{}` object, distinguished by `deckId`.

### Bundled deck content format

No bundled deck ships today, so this is the shape a future one would need — each entry in a `decks/*.json` file (also the shape `resolveCard` returns for a bundled card). Only `id`, `front` and `back` are required; the rest are optional:

```js
{
  "id": "example-001",
  "front": "いただく",
  "back": "to receive (humble)",
  "kana": "いただく",                     // optional
  "wordAudio": "8b0ee07c....mp3",        // optional — Supabase Storage filename
  "sentenceAudio": "c951babc....mp3",    // optional — Supabase Storage filename
  "sentence": "コーヒーをいただきます。",   // optional
  "sentenceEnglish": "I'll have a coffee." // optional
}
```

`sentenceEnglish` is shown below the Japanese sentence on the card back (smaller font).

**Retiring a bundled deck** — add its id to `RETIRED_DECKS` in `migrate.js` *and* delete its JSON, import, and `DECK_FILES`/`DECK_WORDS` entries. The `RETIRED_DECKS` filter is not optional tidying: a retired deck's cards keep their scheduling state in stored progress but can no longer resolve content, so without it they render as blank cards in the drill. `core3k`, `core2000`, and `keigo` were all retired this way (`core2000` in favour of using Core 2000 in the real Anki app; `keigo` had no such replacement, it was simply dropped), and `migrate.test.js` covers the behaviour.

### Audio playback

Recorded audio files live in Supabase Storage under `audio/imported/`. URL pattern:

```
${VITE_SUPABASE_URL}/storage/v1/object/public/audio/imported/${filename}
```

**That prefix is currently empty.** Its only occupant was Core 2000's 3,970 recordings, deleted when that deck was retired — checked first against every still-live reference, which found zero overlap because no surviving deck uses recorded audio at all (imported cards get Voicevox, under `audio/voicevox/`). The path and `AUDIO_BASE` stay because an imported Anki deck carrying its own `[sound:…]` media would land here again; a card simply falls through to Voicevox or browser TTS when it has no `wordAudio`/`sentenceAudio`.

### Word import (text / OCR)

"Import from text / image" in the home screen's Import section opens `WordImportPanel.jsx` — paste raw Japanese text, or upload/photograph an image, to bulk-add cards without an Anki export. The image tab offers two file-input triggers: "Take photo" (`capture="environment"`, opens the rear camera directly on mobile) and "Choose image" (gallery/file picker). `capture` is simply ignored on desktop browsers, so no feature-detection branch is needed — both buttons behave identically there. Client sends the input to the `word-import` edge function (`supabase/functions/word-import/index.ts`) and never touches the Anthropic API key directly.

**Pipeline** (`word-import` edge function):
1. *Image input only* — Claude (vision, default `claude-sonnet-5`, override via `WORD_IMPORT_MODEL`) OCRs the Japanese text out of the image via a `json_schema`-constrained `{ text }` response.
2. The resulting (or directly pasted) text is tokenized with the same `npm:@patdx/kuromoji` + jsDelivr dictionary setup `story-generate` uses (duplicated, not shared — see Edge functions section under Story generator for why duplication over abstraction is the norm here). Particles/symbols are dropped; content words are deduped by dictionary base form, capped at 60 (`MAX_WORDS`) with a `truncated` flag if the cap was hit.
3. Each unique base form is looked up against the `dictionary` table with the same two-stage query as `lookupVocabulary.js` (`primary_form` match, then `kana_forms` GIN overlap fallback) using a service-role Supabase client — the edge function's own copy, not the browser one. Words with no dictionary match are still returned (`jmdictId: null`, empty `meaning`) so OCR noise/proper nouns aren't silently dropped, just left for the user to fill in or discard.

Response: `{ words: [{ id, surface, reading, meaning, jmdictId }], truncated }`.

**Client flow**: `WordImportPanel` shows the returned words as a checklist (all pre-selected) with editable surface/reading/meaning fields per row — necessary since OCR and dictionary matching are both imperfect. On confirm, checked rows with both surface and meaning filled in become cards via `createCard(surface, meaning, `word-import-${ts}-${i}`, 'word-import', { kana, jmdictId })`, merged into a dedicated `word-import` deck (name "Imported Words", auto-created on first use — kept separate from the Anki-export `imported` deck so the two sources stay distinguishable in the deck list).

**Deploy**: needs its own `supabase functions deploy word-import` (see Edge functions deploy steps under Story generator) — reuses the same `ANTHROPIC_API_KEY` secret; `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are auto-provided to edge functions and don't need setting.

Built in `VocabSrsDrill.jsx` via the `AUDIO_BASE` constant. Autoplay sequence on flip: word audio first, then sentence audio. Autoplay can be toggled independently for front (on card load) and back (on flip).

### FSRS setup

- `fsrs(generatorParameters({ enable_fuzz: true }))`
- All four ratings are used: **Again** (1), **Hard** (2), **Good** (3), **Easy** (4). Hard/Easy can be hidden via `showHardEasy` setting — when hidden, only Again + Good are shown and keyboard shortcuts remap accordingly.
- `reviewCard` special-cases `New + Again` to keep the card in `State.New` (FSRS would normally transition it to Learning, but we handle new card re-queueing in session logic instead).
- `previewIntervals(card)` returns the projected due date for each rating, displayed as a hint below each rating button.

### Relearn steps

When a **review card** (non-New) is answered Again, `answerCard` pushes it to the end of the queue with `waitUntil = Date.now() + 10min`. When a **new card** is answered Again, it requeues at position 3 immediately (no wait).

**Learn ahead.** `getCurrentCard` skips a waiting card in favor of any other ready card — but once every remaining card in the queue is waiting, it returns the soonest-due one immediately rather than blocking the session on the real clock. This mirrors Anki's own "learn ahead limit" (default 20 minutes): a card in its relearn step is shown early when there's nothing else left to study, so a session with several lapsed cards can still be finished in one sitting instead of forcing the learner to wait out a real 10-minute timer per card. It only ever kicks in once nothing else is available — while other due/new cards remain, they're interleaved first, same as Anki. The countdown still applies for real if the learner exits mid-relearn: the persisted card's FSRS-computed `due` date is what `getTodaysQueue` checks on the next session, not anything session-local, so a card that hasn't hit its real due time yet simply won't appear until it does. There is no full-screen "waiting" state in the drill UI anymore — with a single fixed 10-minute step (well under Anki's 20-minute default), a waiting card is always eligible the moment it's the only thing left, so the block screen was unreachable and was removed. A card being re-shown this way (whether via learn-ahead or the ordinary interleaved wait) still carries the small orange corner dot on `FlipCard` that any repeat-appearance card gets (`isRequeue` in `VocabSrsDrill.jsx`).

### Session progress tracker

`VocabSrsDrill.jsx` renders its active-drill screen inside the shared `DrillHUD` component (`src/components/DrillHUD.jsx`) — the same one Vocab Drill uses — rather than a bespoke layout. `correct`/`troubled`/`remaining` come from `getSessionStats`'s `correctCount`/`troubledCount`/`remaining`; `streak`/`bestStreak` are now tracked on the session object itself (see `session.js exports` above) and only rendered when `showStreak` (wired to the existing `srs-show-streak` setting, previously unused by this drill) is on. Undo is `DrillHUD`'s own built-in button rather than a separate one.

### Leech detection

Configured via `leechThreshold` (default 8, localStorage key `srs-leech-threshold`). If `card.lapses >= leechThreshold` on an Again answer for a non-New card, `suspended: true` is added. `getTodaysQueue` skips suspended cards. The drill shows a toast. Suspended cards can be unsuspended by resetting their progress via `resetCardProgress`.

### Progress shape (`useProgress('vocab-srs')`)

```js
{
  decks: {
    [deckId]: {
      id: string,
      name: string,
      active: boolean,
      source: 'bundled' | 'imported',
      addedAt: timestamp,
    }
  },
  cards: {
    [cardId]: {
      id: string,
      deckId: string,
      suspended?: true,              // set by leech detection; absent means not suspended
      // imported decks only — bundled decks read content from static JSON:
      front?: string,
      back?: string,
      kana?: string,
      wordAudio?: string,
      sentenceAudio?: string,
      sentence?: string,
      sentenceEnglish?: string,
      jmdictId?: string,             // set on immersion-words cards when word matched JMdict
      voicevoxVoices?: number[],     // set on vocab-drill-words cards — speaker ids with generated audio, copied from the source word
      voicevoxId?: string,           // set alongside voicevoxVoices — original word id, since cardId is a synthetic vocab-drill-words-<ts>-<i> string and Voicevox storage paths are keyed by the original word id
      // FSRS scheduling fields (stability, difficulty, due, state, lapses, …):
      ...fsrsFields
    }
  },
  lastSession: string | null,
  totalReviews: number,
  newCardDay: {
    date: string,   // YYYY-MM-DD UTC — the date new cards were last introduced
    count: number,  // how many new cards were introduced on that date
  },
  reviewLog: {
    [date: string]: number,  // YYYY-MM-DD UTC → review count that day (Hard/Good/Easy answers, mirrors totalReviews' own goodCount accounting — Again answers aren't counted as completed reviews there either)
  },
}
```

`migrateProgress(raw)` handles three cases: fresh install, already-new shape (also drops retired `core3k` deck and its cards), and old shape (cards was an array). Always safe to call on load.

`initializeDeckCards(progress, deckId)` populates card entries for a bundled deck when it is first activated (skips cards that already exist).

`newCardDay` is missing from old data — always access as `progress.newCardDay ?? { date: '', count: 0 }`. `reviewLog` is missing the same way — always access as `progress.reviewLog ?? {}` — and is bumped once per completed session (`VocabSrsModule.jsx`'s `handleDrillDone`), not per card, same as `totalReviews`. Powers the dashboard's Activity heatmap (`DashboardPage.jsx`).

### Daily new card limit

`dailyNewCards` (localStorage key `srs-daily-new-cards`, default 10) caps how many new cards can be introduced per calendar day. Computed in `VocabSrsModule`:

```js
const todayStr = new Date().toISOString().split('T')[0]  // YYYY-MM-DD UTC
const newCardsIntroducedToday = newCardDay.date === todayStr ? newCardDay.count : 0
const effectiveNewPerDay = Math.max(0, dailyNewCards - newCardsIntroducedToday)
```

`newCardDay.count` reflects new cards **actually introduced** — cards that have been answered out of `State.New` — not cards merely pulled into a session. It is **not** bumped when a review starts: `handleStartReview` records the session's new-card ids and the day's baseline count in `sessionNewCardsRef`, and `computeNewCardDay` recounts on every card save (and on session done) as `baseline + (session new cards no longer in State.New)`. This way, starting a review of N new cards and quitting without studying them does not consume the daily allowance, and undo lowers the count back. (Historically the count was incremented up-front at session start, which made an abandoned session report "no new left".)

### Session flow

1. Compute `effectiveNewPerDay = max(0, dailyNewCards - newCardsIntroducedToday)`.
2. `getTodaysQueue(cardsObj, decks, { newPerDay: effectiveNewPerDay })` returns `{ due, newCards, rescheduled }`.
3. `canStart = due.length > 0 || newCards.length > 0 || rescheduled.length > 0`. Rescheduled cards are included so advancing many days doesn't produce "Nothing due".
4. On "Start review": the session's new-card ids + day baseline are stashed in `sessionNewCardsRef` (count is **not** bumped yet — see Daily new card limit); rescheduled cards merged into `due` (their updated due dates saved); all cards resolved via `resolveCard`.
5. `initSession(resolvedDue, resolvedNewCards)` creates the session object.
6. Drill calls `getCurrentCard(session)` each render — skips cards with a future `waitUntil`.
7. `answerCard(session, card, rating, { leechThreshold })` returns `{ session, updatedCard, isLeech }`.
8. `undoLastAnswer(session)` restores the previous snapshot; `revertedCard` is the pre-answer state.
9. Session ends when `isComplete(session)` (queue empty).
10. Drill returns the resolved session card array; module calls `resolvedArrayToCardsObj` to strip `front`/`back` from bundled cards before merging back into `cards{}`.

### SRS settings (localStorage)

All keys use `srs-` prefix. The VocabSrsModule reads these on mount; VocabSrsDrill receives them as props.

| Key | Default | Purpose |
|---|---|---|
| `srs-daily-new-cards` | `10` | New cards per calendar day |
| `srs-show-hard-easy` | `true` | Show Hard + Easy rating buttons (4-way vs 2-way) |
| `srs-leech-threshold` | `8` | Lapse count before card is suspended (0 = disabled) |
| `srs-front-audio` | `false` | Speak the word as the card arrives |
| `srs-back-audio` | `true` | Speak the word (then sentence) on flip |
| `srs-voice` | `'male'` | Recorded voice — `'male'` \| `'female'`, mapped to a Voicevox speaker by `audioSourceForVoice()` |
| `srs-backup-voice` | `''` | Browser speech voice name that reads words with no recording (`''` = device default) |
| `srs-sfx-enabled` | `true` | Sound effects (correct/wrong beeps) |
| `srs-show-furigana` | `false` | Show the reading on the card **front**. The back always shows it — see Furigana on the back, under Vocabulary Drill |
| `srs-show-translation` | `true` | Show English translation on card back |
| `srs-show-sentence` | `true` | Show example sentence on card back |
| `srs-show-kanji-meaning` | `true` | Show per-kanji meaning bar on card back (see Per-kanji meanings under Vocabulary Drill) |
| `srs-pixel-font` | `false` | Use DotGothic16 pixel font on cards |
| `srs-visual-effects` | `true` | Enable card visual effects |
| `srs-show-streak` | `false` | Show the streak counter |

The same suffixes and the same defaults exist under the `vocab-` prefix for Vocab Drill and Anime Vocab — `DRILL_SETTINGS_DEFAULTS` is one object, not one per drill.

**The defaults are a deliberate opening position, not an accumulation.** The front gives nothing away (no reading, no audio) so a card actually tests recall; the back gives everything (meaning, kanji breakdown, sentence, audio) so it explains itself once you've answered. Interface keeps the feedback that responds to an answer (sound effects, visual effects) and drops the two decorations (pixel font, streak counter). Changing a default only affects an install with no stored value for that key — everyone else keeps what they had, or what their old keys migrate to. **Retired:** `*-audio-enabled`, `*-autoplay-audio`, `*-autoplay-front`, `*-autoplay-back`, `*-audio-source`, `*-tts-voice`, `*-sentence-source` — all migrated on first read by `initialDrillSettings()`, then unused.

### Dev advance feature (DEV only)

Visible in the settings sidebar when `import.meta.env.DEV` and cards exist. "Advance N days" shifts all card `due` dates back by N days and resets `newCardDay: { date: '', count: 0 }` to grant a fresh daily new card allocation. Each click is cumulative. Rescheduled-card inclusion in sessions means advancing arbitrarily many days still surfaces all due cards correctly.

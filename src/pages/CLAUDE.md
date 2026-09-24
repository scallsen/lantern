# Pages — Home, Vocabulary Drill, Dictionary

Loaded when working under `src/pages/`. Word-list data format lives in `src/data/CLAUDE.md`; the drill settings panel in `src/components/CLAUDE.md`.

## Home page (`#/`) — textbook-led redesign (in progress, `design-system/home-redesign`)

The dashboard is organised around two primary actions, **New** (work through one textbook's chapters in the Vocab Drill) and **Review** (the SRS), with the other modules as secondary cards below and a global stats sidebar on the right. Rough pass only — the chapters page (`#/vocab`'s home screen rebuilt as "this book, featured, with its chapter list") and the end-of-lesson "send to SRS" prompt are not built yet.

**Model:** one textbook has chapters, nothing else. `src/data/textbooks.js` (`TEXTBOOKS`) is the config: `{ id, title, subtitle, icon, chapters: [{ id, label }] }`. A chapter's `id` is the `listKey` its words carry in `src/data/words/*.json`; chapter labels follow the book's own naming (Genki "Lesson 1", So-Matome "Week 1, Day 1"), never "Chapter N". Books with no word data yet still list their chapters (the picker shows "no words yet"). Only the two So-Matome entries have words today. Pixel-art covers live in `public/placeholder-svg/` (32×32, rendered with `image-rendering: pixelated`); a book with `icon: null` gets a plain spine placeholder. Every cover's artwork occupies x 5–27 of its 32-wide canvas, so 5/32 of each side is transparent gutter — `COVER_GUTTER_FRACTION` in `textbooks.js`, the one place that number lives; recheck it if a new cover is drawn to different bounds. Anything laying a cover out pulls that gutter off the margin so the *artwork's* edge lands where the box's edge would, not 5/32 inside it: `homeCards.jsx`'s `COVER_GUTTER` takes it off the right (cover sits at the card's right edge), and `TextbookPicker`'s `Cover` takes it off both sides (cover sits left of text, so the left edge must go flush and the right must not double up on the row's own flex gap). The spine placeholder for a book with `icon: null` is drawn to fill its box and takes no correction, which is what keeps the two kinds of cover aligned with each other.

**Progress:** stored in the existing `vocab-flashcard` progress namespace — `textbook: { id, currentChapterId }` plus the pre-existing per-list `sublists` drill records. `src/lib/textbookProgress.js` (`resolveTextbookState(progress, wordCountFor)`) derives everything the UI needs: chapters with `drilled`/`wordCount`, `current` (the pointer if it belongs to the book, else the first undrilled chapter), `next`, `doneCount`. A drilled current chapter renders as **[Start next] [Continue current]**; an undrilled one as **[Start current]**; a finished book replaces the chapter count with "Book completed" and the CTA with **[Pick new textbook]**. With no textbook chosen the card drifts a marquee of the available covers (`.textbook-marquee__track` in `global.css`). Changing textbook is the cover itself — hovering it reveals a link over the artwork (`.textbook-cover`), which is why there's no separate "Change textbook" link in the row. The dashboard's Start sets the pointer and deep-links to `#/vocab?chapter=<id>&start=1`; `VocabPage` seeds its source/sublist selection from that query, jumps straight into the drill, and strips the query. Drill results now save signed-out too (localStorage via `useProgress`), so the chapter pointer works without an account — this is the *anonymous* `progress-vocab-flashcard` key specifically (see the useProgress hook section's key-scoping note), and it's why `NewCard` shows a "Sign in to save this progress across devices" line under the chapter info whenever `signedOut` is true: the progress is real, but it's this-browser-only until an account claims it. A personal (`personal: true`) textbook can never reach this signed-out state itself — `wordCountFor` returns 0 for it with no account, so `TextbookPicker`'s `hasWords` filter keeps it out of the signed-out picker entirely — but the pointer can still be *looking at* one if it was chosen while signed in on the same browser and the account has since signed out; before the key-scoping fix this rendered as "No words for this book yet" on a book nobody signed out could have picked, which is what the fix in the useProgress section closes off.

**Review card:** signed-out → sign-in CTA; signed-in → due / new-today counts computed with the same `getTodaysQueue` maths as the SRS home (`summariseSrs` in `DashboardPage.jsx`), "Start reviews" deep-links to `#/vocab-srs?start=1` which `VocabSrsModule` honours once progress has loaded (then strips the query). "Manage decks" is the full SRS home.

**Stats sidebar:** Textbook (chapters done, words drilled, up next), Reviews (`DistributionBar` over active-deck card states + cards/learned/lifetime reviews), Reading (articles read from `immersion`, series tracked from `anime-vocab-tracking`). There is no per-day review log, so streaks/heatmaps would need new logging first.

**Responsive layout** — three bands, both driven by `useIsMobile`: above `SIDEBAR_BREAKPOINT` (1100) the stats are a 280px right-hand rail and the two primary cards sit beside it; between 769 and 1100 the rail moves *below* the cards as a full-width three-column strip (`StatsPanel columns={3}`) so the cards get their squarish proportions back instead of being squeezed into slivers; at 768 and under everything is one column and `PrimaryCard` drops its 250px min-height (with no neighbour to line up with it would only add dead air).

**Module config:** `tier: 'primary'` on `school-vocab` and `vocab-srs` marks the two big cards; everything else renders as a secondary `ModuleCard` (Conjugation Drill stays, marked external). Grammar Map was removed from the config (module slated for removal; its route still exists).

| File | Purpose |
|---|---|
| `src/pages/DashboardPage.jsx` | Home layout — card/stats/module composition, data loading, textbook picker wiring |
| `src/pages/homeCards.jsx` | `NewCard` / `ReviewCard` themselves (+ `PrimaryCard`) — kept out of the page so the Storybook stories below render the real components |
| `src/pages/NewCard.stories.jsx`, `ReviewCard.stories.jsx`, `HomeCardPairs.stories.jsx` | Storybook stories for every card state, plus realistic New+Review pairs with a width control. Fixtures in `src/pages/homeCardFixtures.js` — new-card states feed fabricated progress through the real `resolveTextbookState`; review-card summaries mirror `summariseSrs`'s shape, `estimatedMinutes` computed with `getGlobalStats`' own formula |
| `src/data/textbooks.js` | Textbook + chapter config — also `publisher`, `description` and `purchase` links (retailer *search* URLs, not product ids, so they don't rot) |
| `src/lib/textbookProgress.js` (+ `.test.js`) | Pure current/next-chapter resolver |
| `src/components/TextbookPicker.jsx` | "Change textbook" — `Modal` + the split browser (`TextbookBrowser`, internal to this file): book list beside the selected book's cover, description and buy links. On mobile the confirm button is Modal's own `footer` (outside the body scroll, so it never moves) — which is why selection state lives in `TextbookPicker`, not the browser. On mobile (`stacked`) the detail becomes a `position: sticky` block above the list — **not** a nested scroller: the sheet is max-height-driven, so a percentage-height child silently falls back to auto and pushes the confirm button below the fold. Measured budget on a 375×667 phone: 532px sheet, 261px pinned detail, ~210px (≈5 rows) of list visible; 393×852 gives ~8 rows |
| `src/data/modules.js` | Module config array — accents, hrefs, `tier` |
| `src/components/ModuleCard.jsx` | Secondary module card (hover via `.module-card` in `global.css`) |
| `src/App.jsx` | Hash router |

## Vocabulary Drill (`#/vocab`)

Mirrors katsuyou-drill's UI exactly. Speed-mode only (no text input). Card front: kanji, with furigana only if the Furigana setting is on. Card back: kanji + furigana (via `<ruby>/<rt>`, in-flow for correct vertical centering) + English meaning + optional example sentence.

**Furigana on the back is not a setting** — the back is the answer, so it always carries the reading; the setting only decides whether the *front* gives it away. `SrsCardFace` has always worked this way (`isBack || showFurigana`), but `VocabCard` gated both faces on the one flag and never annotated its front at all, so turning the setting off silently stripped the answer's reading. Pinned by `VocabCard.test.jsx`.

### Session flow — rounds, score, finish

A drill session (`src/engines/simpleQueue.js`) is a first pass over every word, then rounds over whatever was missed until nothing is. `mistakeCounts` is per round (it decides what comes back); `sessionMistakes` sums every round and survives `nextRound`, so the finish can still rank words that were hard early and clean later. `useDrill`'s `redoTroubled` continues the session; `restart`/`redoSelection` start a new one.

**The score is first-try only** (`src/lib/drillScore.js`): the share of the session's words never missed. It is saved **once per session, when the first pass ends** — the later rounds used to each overwrite the chapter's record with their own clean count (a meaningless 2/20). A session over just the troubled words isn't the lesson and isn't saved. Saved entries carry `firstTry`; older entries without it are never read as a score. `recentRuns` holds one slot — the lesson (and review mode) being drilled right now, last `HISTORY_LIMIT` runs — and is replaced outright when anything else is drilled, so it never grows into a log.

**Screens** (`src/pages/drillFinish.jsx`, stories under *Vocab Drill/Finish*): between rounds, `RoundBreak` — the loading-state lantern, a headline by round, the session's Correct · Troubled counts, and the next round starts by itself after `ROUND_BREAK_MS` (no answers shown: the learner goes in blind). At the end, `LessonCleared` — the score filling against the `READINESS_TARGET_PCT` (80%) tick, previous sessions, every word ranked by misses, and an Action Bar (one row on desktop, primary last; two rows on phones): at or above the target **Add all N to review** leads, below it **Drill again** does (each a `SegmentedPrimary` with the troubled-only variant in its menu), plus End drill. Adding opens the deck picker (Popover + OptionPicker, as `DeckComboBox`) from the split button, with the book's deck (`textbookDeck`, the one the advance gate fills) pinned first as Suggested even before it exists; any other deck, or a new one, works too. The screen is `CONTENT_STANDARD` wide rather than the narrow done-screen width, because three xl buttons don't fit on one row any narrower. Moving to the next lesson is deliberately **not** on this screen — the home card does it, leading with "Start next" only once the current lesson's score reaches the target (`chapterPrimaryAction`).

### Per-kanji meanings

`vocab-show-kanji-meaning` (default `false`) toggles a `KanjiMeaningBar` row on the card back showing each kanji character in the word alongside its first `kanji` table gloss (via `useKanjiMeanings`/`kanjiMeaningLookup.js`, see Key files above). `KanjiMeaningBar` is defined locally in both `VocabCard.jsx` and `VocabSrsDrill.jsx` (not extracted to a shared component). The SRS module has the equivalent `srs-show-kanji-meaning` setting (see SRS settings table below).

### Vocab audio (Voicevox)

Word audio is pre-generated via [Voicevox](https://voicevox.hiroshiba.jp/) (neural Japanese TTS) rather than relying solely on the browser's Speech Synthesis API, which varies wildly in quality by OS/browser. This applies to the Vocab drill word lists (and, were one ever to ship again, a bundled SRS deck — see Vocab SRS section) — not to Immersion, Story, or Dictionary (all dynamic/on-demand content a local Voicevox instance can't serve live).

**Voices** (`VOICEVOX_VOICES` in `src/utils/voicevoxAudio.js`, kept in sync with `VOICES` in `scripts/generate-audio.mjs`):
- Speaker id `2` — 四国めたん (Shikoku Metan), Normal style
- Speaker id `11` — 玄野武宏 (Kurono Takehiro), Normal style

**Storage layout**: `audio/voicevox/<speakerId>/<key>.mp3`, where the key is a hash of **the text spoken** (`audioKeyFor` in `src/lib/displayForm.js`), not of the word that wanted it. One reading is stored once however many lists teach it — 7,138 words reduce to 2,272 clips — while two cards of one dictionary entry that say different things (勉強, 勉強する) keep separate clips. A hash because Supabase Storage rejects a non-ASCII object key and decodes percent-escapes before validating; non-cryptographic because a card needs the URL synchronously while rendering. The generator asserts no two readings share a key rather than trusting the hash. Words carry **no** record of their own audio: a card derives the URL from its reading and falls back to browser TTS when the clip 404s, which is also why a word list leaving the repo can no longer orphan audio another list still speaks. `scripts/rekey-audio.mjs` performed the one-off move from the old per-word layout. Formerly `audio/voicevox/<speakerId>/<entryId>.mp3` in the same public Supabase Storage `audio` bucket used by Vocab SRS's `audio/imported/` (Anki-uploaded audio) — kept in a separate prefix so the two can never collide or interfere with each other's cleanup.

**Generation** (`scripts/generate-audio.mjs`): reads `src/data/words/*.json` (plus a learner's own `custom_words`), synthesizes audio for any spoken reading that doesn't already have a stored clip for a given voice, and uploads it to Storage keyed by that reading (see Storage layout above — nothing is written back into the source JSON). Every run also **reconciles** each voice folder against the current entries and deletes any orphaned file — this is what makes removing a word/card from the JSON automatically delete its audio too, no separate cleanup step needed. Requires a running Voicevox engine (desktop app, or the headless `voicevox/voicevox_engine` Docker image) reachable at `VOICEVOX_URL` (default `http://localhost:50021`).

**Automation** (`.github/workflows/generate-vocab-audio.yml`): runs the script automatically on every push to `main` touching `src/data/words/**` (plus manual `workflow_dispatch`), using the official headless Voicevox Docker image spun up just for the job. Commits any changed word-list JSON straight back to `main` with a bot identity — no PR step. The repo is public, so GitHub Actions minutes are free regardless of run frequency.

**Processing status**: the workflow flips a single-row Supabase table, `audio_generation_status` (`id='vocab-audio'`, `status: 'idle'|'processing'`), to `'processing'` while it runs and back to `'idle'` when done (both in the script's own `try/finally` and, as a backstop against runner-level failures, an `if: always()` workflow step). `useAudioGenerationStatus()` polls this row and drives the "Audio is being generated" note shown under the audio-source picker in both the Vocab and SRS settings drawers.

```sql
create table if not exists audio_generation_status (
  id text primary key default 'vocab-audio',
  status text not null default 'idle', -- 'idle' | 'processing'
  updated_at timestamptz not null default now()
);
grant select on audio_generation_status to anon, authenticated;
grant all on audio_generation_status to service_role;
```

**Attribution**: Voicevox's license requires a discoverable text credit for each character voice used, and its own examples credit the Japanese character name (e.g. "VOICEVOX:四国めたん") — an intentional exception to the "no Japanese in the UI" convention. Each voice's credit segments (`ATTRIBUTIONS['voicevox-2']`/`['voicevox-11']` in `src/data/attributions.js`, e.g. "Text to speech powered by VOICEVOX (四国めたん)" with "VOICEVOX" linking to the project — see Attribution system section under Vocabulary Drill for the full segment/link mechanism) render as their own line directly below the "Text to speech" select (`getVoicevoxCredit(audioSource)` in `voicevoxAudio.js`, via `renderAttributionSegments`) — not as the select's `subtext` (that renders above the control, which would read as a field description rather than a credit) — and only while that voice is the selected option, hidden entirely when "Browser TTS" is selected. The same credit is also folded into the drill-screen `AttributionFooter` while that voice is actively speaking (see Attribution system section).

**Playback priority** (both Vocab drill and Vocab SRS): recorded file audio (an imported Anki deck's own recordings, SRS-only) → Voicevox audio for the selected voice, if generated → browser TTS. The audio-source picker (`AUDIO_SOURCE_OPTIONS` in `src/utils/voicevoxAudio.js`, labeled "Text to speech" in both settings drawers) offers "Female (Shikoku Metan)", "Male (Kurono Takehiro)" (`DEFAULT_AUDIO_SOURCE`, `'voicevox-11'`), and "Browser TTS"; picking a Voicevox voice still silently falls back to browser TTS for any entry that voice hasn't been generated for yet.

**Audio preload** (Vocab drill only): a `useEffect` in `VocabPage.jsx` preloads the current card's Voicevox audio plus the next few upcoming cards (`AUDIO_PRELOAD_COUNT`) into an `Audio` object cache keyed by URL, so flipping to a card doesn't wait on a network fetch. The cache is trimmed to the current window (current + upcoming) on every card change/audio-source change.

### Layout
- Desktop: main content area + chevron toggle + collapsible sidebar (420px wide)
- Mobile: full-screen overlay triggered by "Show options" button in header
- `useIsMobile(768)` and `useIsShort(680)` hooks defined inline in `VocabPage.jsx`

## Dictionary (`#/dictionary`)

**Page-based** — two routes: `#/dictionary` → `DictionaryPage.jsx` (search) and `#/dictionary/entry/:id` → `DictionaryEntryPage.jsx` (full entry detail). JMdict-backed dictionary with inline kanji lookup. Searches the Supabase `dictionary` table (JMdict) and the `kanji` table (KANJIDIC2).

Each word result row on `DictionaryPage` (`EntryRow`) is a link to `#/dictionary/entry/${entry.id}`, not an inline expansion. `DictionaryEntryPage` re-fetches the full row (including `senses` and `kanji_forms`) plus `kanji` table rows for every kanji character in `primary_form`, and renders: the word with alternate forms, a grouped-by-part-of-speech sense list (via `SensesSection`, using the `senses` jsonb column — falls back to the flat `gloss_en` string for pre-`senses` rows), a "Word Lists" section, a "Your Decks" section, a "Kanji" breakdown section listing each component kanji's readings/meanings/grade/JLPT/stroke count/frequency (reusing the same visual card style as the search page's kanji carousel), and an "Example Sentences" section.

**"Word Lists" and "Your Decks" are two separate sections** (split from one combined "Your Decks" list — they answer different questions: "is this word taught anywhere" vs. "am I reviewing it"). Both match by `entry.id` = `jmdictId`.
- **Word Lists** — every list (bundled or personal) that teaches this word. `WORD_DATA.filter(w => w.jmdictId === entry.id)` covers the three bundled files; a `custom_words` query (`.eq('payload->>jmdictId', entryId)`, signed-in only — a learner's own lists live in their account, not the bundle) covers personal ones. Both resolve to human labels via `labelForListKey`/`WORD_SOURCES` and merge into one list, deduped by listKey. Renders only when non-empty — no "not in any list" message, same as before the split. Clicking a row opens `WordListModal` in place (`navigate.onClick`, not `href` — see the comment above `deckRowContent`).
- **Your Decks** — this word's SRS cards. Renders whenever the user is signed in (unlike Word Lists, this one always renders once signed in, with a "Not in any of your review decks yet." fallback when there are no matches — it's the section that's meaningfully "empty" rather than absent). `useProgress('vocab-srs')` → `migrateProgress` → for every card, `resolveCard(card).jmdictId === entry.id`, **or**, when a card has no `jmdictId` at all (a plain Anki import, or a source word whose own `jmdictId` was only backfilled after the card already existed — see the custom_words section below), its resolved `front` matches one of this entry's own `kanji_forms`/`kana_forms`. Shows deck name + `cardStateLabel(card)` from `srs.js`, linking to `#/vocab-srs`.

Signed-out visitors with no Word List match see neither section — no nagging every word to sign in.

**"Example Sentences" section** — up to 5 rows from the `sentences` table (`.overlaps('dictionary_ids', [entry.id])`, quality-flagged first), each showing the Japanese sentence + English translation. Attribution is handled by the page-level `AttributionFooter`, not per-sentence — see Attribution system section under Vocabulary Drill for the full `sentences` table schema and import pipeline.

### Search branches

`doSearch` in `DictionaryPage.jsx` has three branches based on input:

1. **Japanese typed** (`isJapanese(trimmed)`, offset 0) — two queries merged: `primary_form` prefix + `kana_forms` GIN containment. Results deduped and sorted by `relevanceScore`.
2. **Romaji input** (converts via wanakana's `toKana()` to a valid kana string, offset 0) — four parallel queries: kana_forms containment + three word-boundary English gloss queries. Merged, deduped, sorted.
3. **Pure English** (no kana conversion, offset 0) — three word-boundary English gloss queries (first, middle, last gloss position). Merged, deduped, sorted.
4. **Pagination** (offset > 0) — single range query, DB order only.

**Word-boundary gloss matching**: English gloss queries use word-boundary patterns rather than substring `%term%`, preventing "car" from matching "carriage", "carpet", etc. Patterns for each term:
- `term + '; %'` — term is first gloss item
- `'%; ' + term + '; %'` — term is middle gloss item
- `'%; ' + term` — term is last gloss item

### Kanji carousel

When results include common kanji (from `vocabulary_ja` in the articles table or direct KANJIDIC2 lookup), a horizontal carousel appears above the word results showing kanji cards. Each card shows the character, readings, and meaning and can be expanded in place for full detail (stroke count, JLPT level, frequency, all readings/meanings).

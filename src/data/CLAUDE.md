# Word data, word lists and attribution

Loaded when working under `src/data/`.

### Word source / list structure (`src/data/wordLists.js`)

`WORD_SOURCES` is an array of sources. Each source is either **flat** (no sublists) or **hierarchical** (has sublists):

```js
// Flat source — the source id is the listKey used in word data
{ id: 'sample', label: 'Sample Words', lists: null }

// Hierarchical source — each sublist id is a listKey used in word data
{
  id: 'nsm-n3',
  label: 'Nihongo So-Matome N3',
  lists: [
    { id: 'nsm-n3-w1d1', label: 'Week 1, Day 1' },
    { id: 'nsm-n3-w1d2', label: 'Week 1, Day 2' },
    // ...
  ],
}
```

**UI behavior:** `#/vocab`'s home screen is the textbook chapter path (`TextbookHomeScreen`) once a textbook is active. Everything else on this page — picking a different list to drill, and browsing any list's actual words — lives in one modal, `WordExplorerModal`, with two internal steps: **Picker** (titled "Drill any list" — a `Select` of sources plus a `DataList` multi-select of the chosen source's sublists, reached via the "Free drill" button) and **Words** (titled "View words" — the word list itself, kanji breakdown, sentences, grouped under each list's own `SectionHeader`, rendered via the shared `WordListContent`/`WordListModal.jsx`). A Back button on Words returns to Picker rather than closing the modal, so exploring one list, going back, and picking another is one continuous flow. Both entry points into this modal — "Free drill" (Picker) and a chapter row's "View words" (straight to Words, pre-seeded) — only fire from a click on this page itself, and only reachable once a textbook is already active (`showTextbookScreen`). There is no bare source-picker page any more — the old full-page `HomeScreen`/`SubListTile` grid was deleted once nothing in the app's own navigation reached `#/vocab` without a textbook already chosen (the dashboard's card gates that behind `TextbookPicker`); a visit to `#/vocab` with no textbook chosen redirects home instead.

**A Dictionary entry's "Vocab Drill match" row never navigates to `#/vocab` at all** — it opens its own copy of the word list view (`WordListModal`, same shared component `WordExplorerModal`'s Words step uses) directly inside `DictionaryEntryPage`, pre-loaded with that word's chapter, plus a "Practice this list" button that deep-links to `#/vocab?chapter=<listKey>&start=1` for whoever actually wants to drill it. This is `DataList`'s `navigate.onClick` (not `href`, per settled decision #9's own logic in reverse: this row is deliberately *not* a link to another route) so looking up a word never leaves the dictionary, and closing the sheet is just closing a sheet — no page changes underneath it.

### Word data format

**New word lists carry `{ id, listKey, jmdictId }`, plus an optional `kanji`** —
no gloss, reading or sentence. The `dictionary` table is already the source of truth
for all of those (see the Dictionary linkage section), so storing them again
duplicates data that would then drift, and the raw textbook lists they come from
are the publisher's content while this repo is public. `src/data/words/genki_1_vocab.json`
and `genki_2_vocab.json` are the reference examples; the older So-Matome files
still carry the fuller shape below and are read the same way, since every field
is an override with a dictionary fallback rather than a required value.

An override in `scripts/textbook-vocab-overrides.json` may also carry `form`
(and `reading`), which is the **only** way a form JMdict does not list reaches a
card, and is deliberately human-only. JMdict files lexemes, so a textbook's
歩いて or いらっしゃいます has no entry and never will — it does carry
いらっしゃいませ and いらっしゃい, which have lexicalised, which is the line it
draws. Supplementing `dictionary` instead was rejected twice over: a new row
needs an invented id that leaks through `jmdictId` into SRS cards and
`#/dictionary/entry/:id`, while widening `kana_forms` would redefine the column
that `backfill-vocab-jmdict.mjs`, `resolveJmdictIds.js` and the story lookup all
reading-verify against — and `import-jmdict.mjs` is a destructive full refresh,
so either would vanish on the next import. Five cards use it.

`sense` names which of the entry's senses the textbook teaches. JMdict orders
senses by general prominence rather than by what a beginner course wants —
あげる's "to give" is sense 5 of 上げる, behind "to raise; to elevate" — so the
leading glosses often answer a question the book never asked. 85 cards carry
one; `cardGloss(word, entry)` in `dictionaryEntryLookup.js` renders it, falling
back to `briefGloss` when no sense is named.

`mark` carries the decoration a textbook puts around a word to show how it is
used — 〜枚 for a counter, そんな〜 for a prenominal, きれい（な） for a
na-adjective. Matching has to strip that to find the word, so it is stored as a
template (`〜{}`, `{}（な）`) and re-applied at render time: whatever was
stripped, back where the book had it. A template rather than per-shape flags
because the decoration leads, trails or wraps depending on the word.

`suru` marks a word the book teaches as a する-verb. JMdict files those under
the bare noun (勉強 covers 勉強する), so the entry is right but the stored form is
a stem; the card appends する to both form and reading, which is what stops
勉強する being drilled as the noun 勉強. `src/lib/displayForm.js`'s
`cardFormOf(word, entry)` is the one place that resolves a card's form and
reading — use it rather than reading `kanji`/`kana` directly.

`kanji` is present only when the textbook writes the word as one of the
*several forms JMdict already lists for that entry* — のぼる is 上る/登る/昇る and
Genki teaches 登る; 五日 and ５日 are one entry. Keeping the book's spelling makes
the card match the book while still pointing at the same entry for reading and
meaning, so it selects among JMdict's forms rather than storing textbook text,
and the resolver revalidates it on every run. A card therefore has three
possible renderings from one id — the book's spelling, JMdict's canonical form
(`displayFormOf`), and the plain reading — which is the plumbing a display
setting needs. `modified: true` marks the opposite case: nothing the entry lists
is written the way the book writes it (勉強する against 勉強), and the card shows
an M so the difference is stated rather than hidden.

Two consequences worth knowing before adding a list this way: an entry with no
`jmdictId` cannot render at all (there is nothing to fall back to), and a
する-verb resolves to its noun entry, so 勉強する is stored — and displayed — as
勉強. See `scripts/resolve-textbook-vocab.mjs` for the import pipeline and
`scripts/textbook-vocab-overrides.json` for the human decisions it defers to.

Each word object in an older `src/data/words/*.json` file:

```js
{
  "id": "nsm-n3-w1d1-001",  // unique stable key — suggest "{listKey}-{index}"
  "kanji": "魚",              // display form (front of card); use kana if no kanji form
  "kana": "さかな",           // full hiragana/katakana reading — spoken by TTS on flip
  "english": "fish",          // meaning — shown on back of card (concise, 1–5 words)
  "sentence": "...",          // optional example sentence — shown on back when "Show sentence" is on
  "listKey": "nsm-n3-w1d1",  // must match a source id (flat) or sublist id (hierarchical)
  "voicevoxVoices": [2, 11], // set by scripts/generate-audio.mjs — speaker ids with generated audio; absent/empty until generated
  "jmdictId": "1426920"      // set by scripts/backfill-vocab-jmdict.mjs — links to the `dictionary` table row for this word; absent if unmatched (see Dictionary linkage section)
}
```

### Attribution system (`src/data/attributions.js` + `AttributionFooter.jsx`)

Third-party data/asset credits (JMdict/EDICT, KANJIDIC2, Tanaka Corpus, Voicevox) are centralized rather than hand-copied per call site:

- `src/data/attributions.js` — `ATTRIBUTIONS`, a `{ id: segments[] }` registry. Each credit is an array of text segments — `{ text }` for plain text, `{ text, href }` for a clickable piece — rather than one flat string, so file names can link to their EDRDG project page inline within the sentence (their licence page explicitly permits linking or quoting those URLs as the acknowledgement — https://www.edrdg.org/edrdg/licence.html). `dictionary` covers JMdict/EDICT + KANJIDIC together (short, own wording — not EDRDG's full suggested sample text, which is verbose; the requirement is "a general acknowledgement of the sources", not that exact wording); `tanaka-corpus` covers the Tanaka Corpus (CC BY); `voicevox-2`/`voicevox-11` cover the two Voicevox voices (plain text, no link). Adding a new data source (e.g. a future bundled word list with its own attribution requirement) means adding one entry here.
- `src/utils/attributionSegments.jsx` — `renderAttributionSegments(segments)` turns a segment array into inline JSX (`<a>` for linked segments, `<span>` otherwise). Kept out of `AttributionFooter.jsx` to satisfy react-refresh lint (same reasoning as `vocabMap.js`) since it's used both by `AttributionFooter.jsx` and the contextual Voicevox credit line under the "Text to speech" picker (`VocabPage.jsx`/`VocabSrsModule.jsx`, via `getVoicevoxCredit(audioSource)` in `voicevoxAudio.js` — that function now returns segments, not a string).
- `src/components/AttributionFooter.jsx` — `<AttributionFooter sources={['dictionary', 'tanaka-corpus']} />`. Each page/screen declares which credits it actually needs (explicit per-page list, not auto-detected) and the footer renders them (via `renderAttributionSegments`) joined at the foot of the page. It's a normal in-flow block, not `position: fixed`/`sticky` — deliberately, so it never overlaps scrolled content. Each host page uses the classic flexbox "sticky footer" trick instead: the scrollable container is a flex column, and its content is wrapped in an inner `flex: 1` div with the footer as a trailing sibling — short content stretches the wrapper and pushes the footer to the bottom of the viewport, tall content just overflows normally with the footer trailing after it. Preserve that `flex: 1` wrapper when editing these pages' layout, or the footer will stop behaving correctly.
- **Rendered everywhere JMdict/KANJIDIC2/Tanaka-sourced text can actually appear on screen**, including the drill/review screens — not just deck-management/browse screens. The distinction isn't "is this the dictionary module", it's "does this screen ever show text pulled from `dictionary`/`kanji`/`sentences`": `VocabCard.jsx`'s `resolvedEnglish` and `SrsCardFace`'s `resolvedBackText` render JMdict's own gloss text (not just link to it) whenever a word has a `jmdictId` match, `showKanjiMeaning`'s `KanjiMeaningBar` renders KANJIDIC2 meanings, and both can show a Tanaka sentence — so `ActiveDrill`/`DoneScreen` in `VocabPage.jsx` and `VocabSrsDrill.jsx` (both its in-session view and its done-screen return) all carry `['dictionary', 'tanaka-corpus']` too, computed once per component as `footerSources`/inline in the JSX rather than gated off. (Individual flashcards themselves still never render attribution text — it's page/screen-level, not per-card.) Elsewhere: `DictionaryPage.jsx` (`['dictionary']`), `DictionaryEntryPage.jsx` (`['dictionary']`, plus `'tanaka-corpus'` when `sentences.length > 0`).
- **Voicevox** is added into that same footer array *conditionally*, on top of staying in its existing contextual spot: its credit depends on *which voice is currently selected*, not "this page uses this data source", so it stays rendered directly under the "Text to speech" picker in `VocabPage.jsx`/`VocabSrsModule.jsx` (`getVoicevoxCredit(audioSource)` in `voicevoxAudio.js`) for whenever the settings drawer is open. Independently of that, every screen's `AttributionFooter` (Home, Glance, and the drill/review screens — every place the footer renders at all) also appends `` `voicevox-${speakerId}` `` (via `speakerIdFromAudioSource(audioSource)`) whenever audio is enabled and a Voicevox voice is the active source — not gated to only-while-drilling — so the credit is visible whenever the *setting* is on, whether or not audio happens to be playing at that instant or the drawer is open. `VOICEVOX_VOICES`' `credit` fields pull their text from `ATTRIBUTIONS` instead of owning their own copy.

**Scripts:**
| Script | Purpose |
|---|---|
| `scripts/backfill-vocab-jmdict.mjs` | One-off — matches every Vocab Drill word (`src/data/words/*.json`) against `dictionary`, writing `jmdictId` back into the JSON. Reading-verified (rejects a match if the candidate's `kana_forms` don't include the word's own reading) to avoid linking the wrong homograph — e.g. it deliberately leaves `する`/`ある` unmatched rather than guessing among 為る/刷る/剃る/擦る/掏る. Writes unmatched entries to `backfill-vocab-jmdict-report.json` for manual review; not all entries will ever auto-match (compound/decorated forms like `〇〇向き`, `正確（な）`). |
| `scripts/import-tanaka.mjs` | Downloads/parses the Tanaka Corpus (`examples.utf.gz` from `https://www.edrdg.org/pub/Nihongo/examples.utf.gz` — the `ftp://` URL EDRDG's own docs reference isn't reachable from every network), resolves each sentence's per-word index tags to `dictionary.id`, populates `sentences`. Destructive full-refresh like `import-jmdict.mjs`. |

`jmdictId` write sites for SRS cards (all pass it through `createCard`'s `extras`): `VocabPage.jsx`'s `handleAddToSrs`, `WordImportPanel.jsx`, `ImmersionReader.jsx`, `StoryReviewPage.jsx`. `IMPORTED_CONTENT_FIELDS` in `srs.js` includes `jmdictId` so it survives `resetCardProgress`.

### Personal word lists (`custom_words`)

A learner's own course material — one class's re-chunking of a book, with its
own example sentences and review markers — belongs to an account, not to the
bundle. It lives in `custom_words` (one row per word, `payload` holding the word
itself) rather than in `src/data/words/`, so it is not downloaded by every
visitor: moving 5,277 of these words out took 1.1 MB of JSON off the bundle.

| File | Purpose |
|---|---|
| `supabase/migrations/*_add_custom_words.sql` | Table + RLS. `user_id` cascades from `auth.users`, so `delete-account` needs no change |
| `supabase/migrations/*_custom_word_counts.sql` | `custom_word_counts()` — per-chapter counts for the picker, so drawing 36 tiles doesn't fetch 5,277 rows |
| `scripts/upload-custom-words.mjs` | Moves lists from the repo into an account. Idempotent; keyed `(user_id, id)` |
| `scripts/backfill-custom-words-jmdict.mjs` | Matches `custom_words` rows missing `jmdictId` against `dictionary`, across every account (service role). `backfill-vocab-jmdict.mjs`'s own `TARGETS` are the local files these words used to be — once a list moves here, that script silently stops reaching it (its `existsSync` guard just skips the missing path), so this is the one thing that still backfills a personal word's link. Fills only what's missing; never clears an existing match |
| `src/hooks/useCustomWords.js` | `useCustomWordCounts()` for the picker, `useCustomWords(listKeys)` for the chapters actually selected |

A source in `WORD_SOURCES` marked `personal: true` has no words in the bundle.
`visibleSources(customCounts)` decides whether to offer it, and ownership
answers itself — the source appears when the viewer has words in it, so there is
no identity to configure. `VocabPage` loads the whole selected personal source
(a few hundred words) so counts, the review toggles and the drill all read one
pool; `DashboardPage` uses the counts RPC alone.

**`scripts/audio-keep.json` is what stops this deleting audio.**
`generate-audio.mjs` reconciles storage by *absence* — any file without a
matching word in `src/data/words/*.json` is pruned — and these words are no
longer there. That file names their ids (ids only, no content) and
reconciliation unions them in. Without it the next push to `main` deletes
~10,000 generated files. Any future list that leaves the repo needs the same
treatment **before** it goes.

Note the maintenance scripts that hard-code word-file paths
(`backfill-vocab-jmdict`, `validate-word-lists`, `strip-redundant-vocab-english`,
`extract-sentence-vocab`) now skip paths that no longer exist rather than
failing to start.

### Adding a word list

**Flat source (no sublists):**
1. Create `src/data/words/mylist.json` with words using `"listKey": "mylist"`.
2. Import the JSON in `VocabPage.jsx` and spread it into `WORD_DATA`.
3. Add `{ id: 'mylist', label: 'My List', lists: null }` to `WORD_SOURCES` in `wordLists.js`.

**Hierarchical source (with sublists):**
1. Create one JSON file per sublist: `src/data/words/nsm-n3-w1d1.json`, etc.
   - Each file is an array of word objects with the matching `listKey`.
2. Import all JSON files in `VocabPage.jsx` and spread them into `WORD_DATA`.
3. Add the source entry (with its `lists` array) to `WORD_SOURCES` in `wordLists.js`.
   - If adding a new sublist to an existing source, append to its `lists` array and add the import.

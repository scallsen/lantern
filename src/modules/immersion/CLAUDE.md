## Immersion (`#/immersion`)

**Self-contained module** — all code under `src/modules/immersion/`. NHK-style Japanese reading articles generated nightly by a GitHub Actions pipeline.

### Key files

| File | Purpose |
|---|---|
| `src/modules/immersion/ImmersionModule.jsx` | Article list screen — fetches from Supabase, reading history, auto-marks the opened article read |
| `src/modules/immersion/ImmersionReader.jsx` | Reader — renders inside the shared `NewspaperLayout`, word popup, furigana toggle, SRS bridge |
| `src/modules/immersion/sourceLabels.js` | `SOURCE_LABEL` — shared between the list's `ArticleCard` badge and the reader's `NewspaperLayout` masthead |
| `scripts/fetch-nhk.mjs` | Nightly pipeline — discovers current news topics across a broad range of sources via Claude's web search tool, generates articles via Claude Haiku, tokenizes with Kuromoji, looks up JMdict definitions |
| `scripts/import-jmdict.mjs` | One-time import — downloads jmdict-simplified JSON and populates the Supabase `dictionary` table |
| `scripts/backfill-jmdict.mjs` | One-off backfill — re-tokenizes existing articles and regenerates `vocabulary_ja` from JMdict |
| `scripts/backfill-definitions.mjs` | Legacy — original Claude Haiku definition backfill, superseded by `backfill-jmdict.mjs` |
| `.github/workflows/fetch-articles.yml` | GHA cron — runs `fetch-nhk.mjs` nightly at 01:00 UTC; requires Node 22 (for native WebSocket in `@supabase/realtime-js`) |

### Supabase `articles` table

```sql
create table if not exists articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  source       text,
  title        text not null,   -- N4-level headline, pairs with body_ja (pre-taxonomy rows carried the real headline verbatim; see scripts/regenerate-article-titles.mjs)
  title_simple text,            -- N5-level headline, pairs with body_simple; reader/list fall back to `title` when null
  title_en     text,
  published_at timestamptz not null,
  body_ja      text not null,
  body_simple  text,
  summary_en   text,
  questions    jsonb,   -- [{q, a}] x3
  difficulty   smallint,
  category     text,    -- fixed taxonomy assigned at generation time (ARTICLE_CATEGORIES in fetch-nhk.mjs / CATEGORIES in src/modules/immersion/categories.js); null on pre-taxonomy rows — scripts/backfill-article-category.mjs fills them
  tokens_ja    jsonb,   -- [{t, r, w}] — Kuromoji tokens for body_ja
  tokens_simple jsonb,  -- [{t, r, w}] — Kuromoji tokens for body_simple
  vocabulary_ja jsonb,  -- [{word, reading, meaning, jmdictId, pos}] — JMdict entry per content token
  active       boolean not null default true
);
grant select on articles to anon, authenticated;
```

Token shape: `{ t: "surface", r: "hiragana-reading|null", w: boolean }` — `w: false` for particles, auxiliary verbs, punctuation, BOS/EOS.

`vocabulary_ja` entry shape: `{ word, reading, meaning, jmdictId, pos }` — `jmdictId` and `pos` are null for words not found in JMdict (proper nouns, new slang, etc).

### Word popup / definitions

Every content token (`w: true`) in `tokens_ja`/`tokens_simple` is clickable in the reader. Clicking shows a popup with the word, its reading, part of speech, and an English definition sourced from `vocabulary_ja`. Run `backfill-jmdict.mjs` to regenerate definitions for existing articles.

### Reader layout

The article (title, `title_en` as a subtitle, date, body) renders inside the shared `NewspaperLayout` (`src/components/NewspaperLayout.jsx`, promoted from Story's `news` format so both modules render real reading content the same way) — `masthead` is the article's source label, `edition` is "Simple edition" / "Intermediate edition" from the active toggle. The version toggle is labelled **Simple / Intermediate**, not Original/Simplified — `body_simple` is the beginner rewrite, `body_ja` (the "original") is the intermediate one; a true beginner tier would need a `fetch-nhk.mjs` pipeline change, not a UI one. The toggle and furigana `ToggleButton` sit in a row above the paper; the English-summary `Disclosure` sits below it.

### Article retention

Articles accumulate indefinitely — there is no cleanup job. The reader fetches the 10 most recent (`limit(10)` ordered by `published_at desc`), so old articles are invisible to users but stay in the database. At ~5 articles/day × ~10 KB each (with JSONB tokens), growth is ~18 MB/year — well within Supabase free tier limits. If storage ever becomes a concern, add a post-upsert delete to `fetch-nhk.mjs` that removes rows beyond the newest N.

### `useProgress('immersion')` payload

```js
{ read: { [slug]: { readAt: ISO string, score: null } } }
```

Marked automatically — `ImmersionModule` calls `markRead` in a `useEffect` keyed on `selectedArticle`, gated on `user` (signed-out visitors never mark; the same gating the old explicit button had). There is no "Mark as read" control; opening an article is the action. `markRead` itself de-dupes against `readSet`, so re-opening an already-read article is a no-op.

### SRS bridge

`ImmersionReader` imports `createCard` from `../vocab-srs/srs.js` and writes directly to the `vocab-srs` progress namespace, appending words to an `immersion-words` imported deck (created on first add). Story generator does the same thing with a `story-words` deck (see Story generator section) — together these are the only cross-module writes in the codebase.

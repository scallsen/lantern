## Story generator (`#/story`, `#/story/:id`)

**Self-contained module** — `src/modules/story/`. Generates original Japanese written content (stories, fake news articles, dialogue transcripts) constrained to vocabulary the learner already knows.

Two routes, two components:
- `#/story` → `StoryModule.jsx` — the overview: vocabulary source / format / length / grammar picker, "Generate", and a single "Stories" section merging the signed-in user's own stories with curated shared examples into one recency-ordered list (visible whether signed in or not — signed-out visitors see just the examples).
- `#/story/:id` → `StoryReviewPage.jsx` — the reading + comprehension-question view for one generated story. Breadcrumb is `Japanese Study / Story generator / Review story`.

**Generation requires sign-in** — the Generate button is disabled (with an inline "Sign in to generate stories" hint) until `useAuth()` returns a `user`; everything else on the page (source/format pickers, context preview, browsing recent stories) works signed out. On generate, `StoryModule` inserts the result directly into the `stories` table (see below) with `user_id: user.id` and a client-generated `crypto.randomUUID()`, then navigates to `#/story/<id>` (`window.location.hash = ...`, the same cross-page navigation pattern used by breadcrumb links — `App.jsx`'s `hashchange` listener picks it up). `StoryReviewPage` fetches the story by id directly from `stories` (`supabase.from('stories').select(...).eq('id', storyId).maybeSingle()`) — it does not refetch or regenerate anything, and works for any visitor regardless of who generated the story. "New content" on the review page navigates back to `#/story`.

### Formats

`FORMATS` in `StoryModule.jsx` and `FORMAT_HINTS` in `supabase/functions/story-generate/index.ts` must stay in sync (one entry per format id). Current formats: `story`, `news`, `dialogue`, `diary`, `interview`, `letter`, `postcard`. Every format still returns the same `{ title, story, questions, tokens }` shape — new formats are just a different `FORMAT_HINTS` prompt (register/genre/structural convention) plus, optionally, a dedicated layout component. No new format should require a second LLM call or a schema change; if one seems to, that's a sign to lean on a prompt convention + client-side parsing instead (as `dialogue`/`interview` do with 名前「セリフ」 and `diary` does with the date-line header).

`StoryReviewPage.jsx` dispatches on `story.format` via a `FORMAT_LAYOUTS` lookup object (`{ news: NewspaperLayout, dialogue: ChatLayout, diary: DiaryLayout, interview: InterviewLayout, letter: LetterLayout, postcard: PostcardLayout }`); formats not in the map (`story`) fall back to a plain `TokenizedBody` block. A format with a mapped layout is expected to render its own title internally — the page only renders the generic `<h2>` title when there's no matching layout.

- **`diary`** — the prompt requires the very first line to be only the date (e.g. `6月3日（火）`) followed by a single `\n`, then the entry body with no blank line in between. `DiaryLayout` finds the first token with `t === '\n'` (exact single newline, distinct from the `'\n\n'` paragraph-break token) to split header tokens from body tokens, preserving global token indices for popup/highlight correctness (same offset-tracking pattern as `ChatLayout`). If the model doesn't follow the convention, `breakIdx` comes back `-1` and the whole thing renders as body with no header — safe degradation, no crash.
- **`interview`** — reuses the exact `dialogue` convention and `parseDialogue()`, just a different register prompt (two named speakers, interviewer/subject) and a different layout: a printed Q&A column (colored left-border per speaker) instead of chat bubbles. First speaker encountered is treated as the interviewer for accent-color purposes.
- **`letter`** — no structural parsing at all; the whole `story` field renders as continuous prose in an envelope-styled card (mincho serif). No stamp — that visual belongs to `postcard` now; `letter` is just a plain paper letter, horizontal writing.
- **`postcard`** — the one format using vertical writing (`writing-mode: vertical-rl` + `text-orientation: mixed` on the message container). `PostcardLayout` is a fixed-portrait card (~380px wide) with a horizontal header row (7-box postal code grid, 3+4 split, plus a CSS-only perforated stamp — see below) and the message below in vertical columns flowing right-to-left. The prompt tells the model to keep postcard content brief regardless of the selected length, specifically so the fixed-height message area (`height: 300–340px`, `overflowX: auto`) rarely needs to scroll. Vertical writing needed **no changes** to `TokenizedBody`, `WordPopup`, click handling, or furigana rendering — `getBoundingClientRect()`-based popup positioning and ruby annotations both honor the ancestor's `writing-mode` automatically; furigana actually reads more authentically here (it lands to the right of each character column, matching real vertical typesetting) than it does in the horizontal layouts. The only real constraint vertical writing imposes: a bounded-height container with horizontal scroll instead of the page's usual vertical scroll — scoped entirely to this one component, not a page-wide change.
  - **Stamp**: `Stamp()` in `StoryLayouts.jsx` draws a perforated edge with four absolutely-positioned strips, each a repeating `radial-gradient` of the card's own background color, straddling the face's true boundary (half outside the box, half overlapping the colored face) so the visible "bite" is whichever half overlaps. Deliberately abstract/non-representational — no resemblance to any real, copyrighted Japan Post stamp design, consistent with how we've treated other "real-world asset" requests (see the LINE-sticker discussion — same reasoning, not implemented, but the precedent holds here too).

### Supabase `stories` table

Stories are **not** stored via `useProgress` — they live in their own table, unlike every other module's private per-user `progress` payload. Only the owner (`user_id`) can insert; there is no update/delete policy (no edit/delete UI).

**A story is private to its author unless `shared` is set.** This was not always so — the table originally had a `using (true)` select policy and the module showed one "Recent stories" feed of *everyone's* stories, which is wrong once the app has more than one user. `shared` is a curation flag, flipped by hand in the SQL editor on the handful of stories meant as public examples (seeded via `scripts/seed-example-stories.mjs`); there is deliberately no UI for it, since users are not publishing to each other. `StoryModule` fetches the two sets via separate queries (so a long example list can't push the user's own recent stories out of the top N before the merge happens), then merges and re-sorts them by `created_at` into one "Stories" list — there is no separate "Examples" section. Signed-out visitors see only the examples, which RLS enforces on its own — the client does no filtering of its own for access.

```sql
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  story text not null,
  tokens jsonb,
  questions jsonb not null,
  format text not null,
  created_at timestamptz not null default now(),
  shared boolean not null default false  -- curated public examples only
);

alter table stories enable row level security;

create policy "select own or shared stories" on stories for select
  using (shared or auth.uid() = user_id);

create index if not exists stories_shared_idx on stories (shared) where shared;

create policy "insert own stories" on stories for insert
  with check (auth.uid() = user_id);

grant select on stories to anon, authenticated;
grant insert on stories to authenticated;
-- same reason as progress: the delete-account edge function needs both.
grant select, delete on stories to service_role;

create index if not exists stories_created_at_idx on stories (created_at desc);
```

`StoryModule.jsx` runs two queries, each for the newest `MAX_RECENT_STORIES` (20) rows (`id, title, format, created_at` only — full content is fetched lazily per-story by `StoryReviewPage`) ordered by `created_at desc`: one filtered to `user_id`, one to `shared`. The two results are deduped (an own story flagged `shared` counts once), merged, re-sorted by `created_at`, and truncated back to `MAX_RECENT_STORIES` for display as one list under a single `SectionHeader title="Stories"`. Older stories are simply excluded from the list, not deleted — there is no cleanup job (same reasoning as `articles`, see Immersion section).

### learnerContext contract

- `sourceType: 'vocab-list'` — `sourceId` is a `WORD_SOURCES` source id (expands to all sublists) or a single listKey. Reads bundled word JSON.
- `sourceType: 'srs-deck'` — `sourceId` is a deckId. Caller must pass `options.cards` as **resolved** cards (run bundled cards through `resolveCard` first — scheduling-only state has no front/back). Options: `maturity: 'all' | 'seen' | 'graduated'`, `minStabilityDays`.
- `options.grammarLevel` ('N5'–'N1', default 'N3') appends a grammar directive line; `null` omits it.
- Output is dense one-word-per-line text (`魚 (さかな) — fish`) to control prompt token cost. A bundled or imported card with no separate `kana` field falls back to `front — back`.

### Story settings (localStorage)

`story-source`, `story-maturity`, `story-grammar`, `story-format` — note `safeLocalStorageGet(key)` takes no fallback argument; use `?? default`.

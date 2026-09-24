# Codebase guide

Japanese study dashboard. Vite + React, no TypeScript. Houses multiple learning modules behind a single landing page.

## Worktree dev server
When working in a git worktree (`.claude/worktrees/<name>/`), two things must be done before the dev server will work correctly:

1. **Symlink `.env`** — the worktree has no `.env` file. Without it, Supabase is unconfigured and all DB queries fail silently or throw. Fix:
   ```
   ln -s /Users/simoncallsen/Documents/GitHub/japanese-study/.env \
         /Users/simoncallsen/Documents/GitHub/japanese-study/.claude/worktrees/<name>/.env
   ```
2. **Run `npm run dev` from the worktree directory**, not from the repo root. Running from root serves committed files, not the worktree's edits.

Both issues have occurred in previous sessions and caused confusing bugs (search failures, edits appearing to have no effect).

## Conventions
- **Inline styles only** — no CSS modules, no Tailwind. CSS files only for things that can't be expressed inline (e.g. keyframe animations, scrollbar styles, `:hover` / `:focus` pseudo-selectors).
- **Never use `useState` for hover** — the app runs in React StrictMode which double-invokes renders; `onMouseEnter`/`onMouseLeave` + `useState` causes crashes in dev. Use a CSS class + a `:hover` rule in `global.css` instead.
- **No comments** unless the WHY is non-obvious (a hidden constraint, a workaround, a subtle invariant).
- **No TypeScript** — plain JS throughout.
- **No i18n** — all strings hardcoded in English.
- **No Japanese text in the UI** — labels, buttons, headings, and all other UI strings must be in English. Japanese text belongs only in word/card data (e.g. `kanji`, `kana`, `front` fields). `public/favicon.svg` (a rendered 文 glyph) is a deliberate exception — it's a logomark, not a string a learner has to read to use the app, the same distinction that already carves out Voicevox's Japanese voice-name credit.
- **Every real Japanese text run renders through `<Japanese>` (`src/components/Japanese.jsx`)** — a `lang="ja" translate="no"` wrapper (`as` prop to reuse the host element instead of adding a nested one). `index.html` declares the page `lang="en"` (since the UI is English per the rule above) and opts out of browser translation site-wide (`translate="no"`, `notranslate` meta) — without per-run `lang="ja"` marking, that mismatch is exactly what once made Chrome's translate feature silently corrupt Japanese content (mistranslating some words but not others, previously misdiagnosed as a race condition). Any word/kana/kanji/sentence/token value ever gets rendered raw again, the bug comes back. Checklist for new code: a value that's Japanese-only content (not mixed with English in the same element) — wrap it; a `DataList` column that's entirely Japanese — pass `lang: 'ja'` on the column instead (DataList applies it to both the display cell and an editable input). Never mark an element containing a mix of Japanese and English (badges, glosses, meanings) — mark only the Japanese-only descendant. There is no automated check for this (no lint rule, no render test) — it's convention only, so a review pass on any new component touching `kanji`/`kana`/`reading`/`front`/`back`/`token.t`/dictionary `primary_form`/`kana_forms` fields should confirm the Japanese-only leaf goes through `<Japanese>`.
- Hash-based routing — `window.location.hash` read in `App.jsx`. No third-party router.
- **A page's scroll container sets `scrollbarGutter: 'stable both-edges'`.** The document never scrolls (`index.html` pins `html, body, #root` at `overflow: hidden`); each screen scrolls its own `flex: 1; overflowY: 'auto'` region. Without the gutter, content jumps sideways whenever the scrollbar appears — a loading state that doesn't overflow becoming a loaded list that does, or navigating between a short page and a long one. `both-edges`, not plain `stable`, so centred content stays aligned with the header above the scroller. No effect with macOS overlay scrollbars, which take no space anyway.
- **`PageHeader`'s `children` slot is absolutely positioned just above the header's bottom border** (never across it) instead of sitting in flow — it holds `TopProgressBar`, and a bar that comes and goes in flow shifts the whole page by its height.

## App architecture

Two patterns for internal modules. Pick the right one before looking for code:

**Page-based** (`src/pages/`) — for simpler modules. The page component lives in `src/pages/`, pulls from shared components in `src/components/` and `src/hooks/`. Example: `VocabPage`.

**Self-contained module** (`src/modules/<name>/`) — for complex modules with their own logic, data, and UI. Everything lives under the module directory; the only cross-module imports are from `src/components/`, `src/hooks/`, `src/data/theme.js`, `src/FlipCard.jsx`, and `src/lib/supabase.js`. Example: `vocab-srs`.

**Quick lookup — where to look for a given task:**

| Task area | Files to look at |
|---|---|
| Dashboard layout / module cards | `src/pages/DashboardPage.jsx`, `src/data/modules.js`, `src/components/ModuleCard.jsx` |
| Vocabulary drill (`#/vocab`) | `src/pages/VocabPage.jsx` + its components listed below |
| Vocab SRS (`#/vocab-srs`) | `src/modules/vocab-srs/` only |
| Grammar Map (`#/grammar-map`) | `src/modules/grammar-map/` only |
| Auth / sign-in flow | `src/context/AuthContext.jsx`, `src/components/AuthSlot.jsx` |
| Progress sync (Supabase / localStorage) | `src/hooks/useProgress.js` |
| Shared UI components | `src/components/` |
| Design tokens | `src/data/theme.js` |

**Database:** Three Supabase tables: `progress` (user learning state, schema in `supabase/CLAUDE.md`), `dictionary` (JMdict central dictionary), and `kanji` (KANJIDIC2 kanji data) — all three schemas are in `supabase/CLAUDE.md`. All word/card content lives in static JSON files in the repo — never in the database.

## Adding a module
1. Add an entry to `src/data/modules.js`.
2. **Page-based:** add a branch in `App.jsx` and create `src/pages/YourPage.jsx`.
3. **Self-contained:** create `src/modules/<name>/`, add a branch in `App.jsx` importing your root component from `src/modules/<name>/`.

## Design system & Storybook

The component library lives in **Storybook** — `npm run storybook` (port 6006) to browse, `npm run build-storybook` for a static build in `storybook-static/` (gitignored and lint-ignored). It's a separate site, never part of `vite build`, so dev tooling stays out of the production bundle. It isn't deployed anywhere yet — deliberately deferred. It replaced the in-app Style Guide at `#/dev/style-guide` (PR #130). **Status (Sep 2026): every module is ported** to the design system — Anime Vocab, Dictionary, Immersion, Story, Vocab Drill, Vocab SRS (Grammar Map skipped: being removed). The branch-by-branch decision log, every shared-component change and every judgement call that wants a second opinion, is in `docs/design-system-rebuild-review.md` — read it before relitigating anything below.

**Where stories live:** next to their component as `src/components/<Name>.stories.jsx`; the Type/Spacing/Color token pages in `src/data/Foundations.stories.jsx`; the home page's card states in `src/pages/NewCard.stories.jsx`, `ReviewCard.stories.jsx` and `HomeCardPairs.stories.jsx`, whose fixtures (`homeCardFixtures.js`) go through the real `resolveTextbookState` so they can't drift from production. Config: `.storybook/main.js` (serves `public/` for fonts and covers) and `.storybook/preview.jsx` (imports `global.css`, wraps every story in the app's dark background — filling the canvas on a story's own page but hugging its content on Docs pages — and sets the dark docs theme).

**Stories are tests.** `@storybook/addon-vitest` mounts every story in headless Chromium as part of `npm test` (the `storybook` project in `vite.config.js`), failing on any render error. The first run after a dependency or preview change can fail whole files with "Vitest failed to find the current suite" while Vite re-optimises — rerun before debugging. CI only runs lint, so this stays local.

**Story conventions:**
- **Every component's docs open with the same four parts**, in `parameters.docs.description.component`: one sentence on what it's for; **Use when**; **Don't use**, naming the alternative by its Storybook title; and an optional *Build note* for the one thing that matters in code. Product language only — no rebuild history, no "settled decision #N". The Don't-use line is what separates look-alikes (Switch / Toggle Button / Checkbox / Chip Selector, Card / Data List / Feed Card, Modal / Popover / Toast).
- **Any component a description names must have its own Storybook entry** — ConfirmDialog, PageHeader and TopProgressBar were added for exactly that reason.
- **Ground story data in the app**, same rule as components: labels, examples and fixtures come from real call sites, not invented placeholders.
- Stateful demos are a named, capitalised component (`function ChipStory(args) { useState… }`) rendered via `render: args => <ChipStory {...args} />`, so rules-of-hooks lint passes.
- Anything `position: fixed` (overlays, Action Bar, Settings Sidebar) sets `parameters.docs.story: { inline: false, iframeHeight }` so it renders in its own frame instead of escaping the docs page.
- A component that reads `useAuth()` needs an `<AuthProvider>` decorator — `useAuth` returns `null` outside one and destructuring it crashes. Storybook has no signed-in session, so signed-in-only views show their signed-out state.
- A new shared component gets a story in the same change.

**Retired design explorations live on `archive/design-labs`** — a permanent, never-merged, never-deleted branch that runs on its own (`npm install && npm run dev`, no `.env`: the one lab that showed dictionary data reads a frozen snapshot instead of Supabase). Its home page indexes the 11 exploration labs (`HomeFlowLabPage`, `TextbookFlowLabPage`, `TextbookPickerLabPage`, `CoverRotationLabPage`, `SecondaryButtonLabPage`, `SettingsLabPage`, `DrillFlipLabPage`, `ToastLabPage`, `TrackedStatLabPage`, `SegmentColorLabPage`, `AccentPolishLabPage`), each at its old `#/dev/*` path; the branch holds only those and what they import, not the app. All 13 former `#/dev/*` pages were removed from `main` in PR #130 after being checked identical on that branch — `StyleGuideLabPage` and `HomeCardsLabPage` became Storybook stories, and their original pages survive in the archive branch's history rather than at its tip. Comments that cite a lab ("explored at `SegmentColorLabPage`") point at that branch. Explore new directions as stories or on a branch rather than as routes in the app. If a lab page ever lands on `main` again, **copy it onto `archive/design-labs` before deleting it** (with anything it imports that the branch lacks — see its README) — `main`'s own history isn't enough once a route is removed and later squashed away. `DeckPickerLabPage` was retired before this convention existed (see settled decision #4) and is not on the archive branch.

**Key files:** design-system components live in `src/components/`: `Button.jsx`, `Badge.jsx`, `Card.jsx`, `TextInput.jsx`, `NumberField.jsx`, `Select.jsx`, `Checkbox.jsx`, `FileButton.jsx`, `SectionHeader.jsx`, `SignInGate.jsx`, `ActionBar.jsx`, `FilterCard.jsx` (+ `FilterRow`), `Disclosure.jsx`, `Chip.jsx`, `DataList.jsx`, `Modal.jsx`, `ConfirmDialog.jsx`, `Toast.jsx`, `FeedCard.jsx`, `ToggleButton.jsx`, `DistributionBar.jsx`, `Popover.jsx`, `OptionPicker.jsx`, `DeckComboBox.jsx`, `DrillButton.jsx`, `SpeedModeControls.jsx` (a named composition of DrillButton), `DrillHUD.jsx`, `SettingsSidebar.jsx` (+ its `SidebarHeaderToggle` export), `NewspaperLayout.jsx` (promoted from Story, shared with Immersion), `PageHeader.jsx`, `TopProgressBar.jsx`. Module accent context: `src/context/ModuleThemeContext.jsx`. Shared hook: `src/hooks/useIsMobile.js`. Semantic colour tokens `SUCCESS`/`WARNING`/`DANGER` and `KANJI_FONT` live in `theme.js`.

**Conventions established while building this — follow for every remaining component:**
- **Ground every value in real code, never invent.** Before designing a component, read the actual call sites it's meant to unify and extract real pixel values/colors/behavior rather than guessing something "reasonable." Where real call sites disagree, reconcile deliberately and say so in a comment (e.g. `Button`'s `danger-outline` fixed `ConfirmDialog`'s mismatched background/text hue instead of copying the bug forward).
- **Token discipline:** `FS_BASE` (15px) and `SPACE_12` are the defaults — use them unless a specific, stated reason calls for something else. `theme.js`'s `SPACE_4/8/12/16/24/32` and the `FS_*` constants are the sanctioned scale; a literal is fine when it's a faithful port of a real historical value (comment why) or must stay byte-identical to another component's own default (e.g. `DataList`'s row padding matching `SelectableRow`'s). Simplify token scales rather than cataloguing every pixel value already in use — colors should be grounded in exact real values since they carry identity, but a spacing/type scale exists to *constrain* choice.
- **Component API shape:** prop names describe what they configure, not a generic `mode` enum — see `DataList`'s independently-combinable `selection`/`navigate`/`expand` instead of one flat mode string. Variant-style components (`Button`, `Badge`) use a `variant`/`tone` string prop against a lookup object.
- **Hover states are CSS classes in `global.css`, never `useState`** — the StrictMode double-invoke rule above applies to every new component too. Reuse the existing `filter: brightness()` idiom for colored/tinted elements (`.btn-tint`); explicit background-shift for near-transparent ones (`.btn-neutral`, `.btn-ghost`, `.data-list-row`).

**Deliberate non-components** — these were on the roster and were *removed* after examination, not skipped. Don't re-add them (full reasoning in `docs/design-system-rebuild-review.md`'s "Deliberate non-components — full reasoning"):
- **Info Row** — is `DataList` with no `selection`/`navigate`/`expand`.
- **Verdict Buttons / Rating Button** — one component, `DrillButton`, not two.
- **Icon Button** — is `Button` with an `icon` and no children (`variant="ghost-muted"` for dismiss/remove).

**Gotcha — inline styles outrank hover classes.** A component that sets `background` inline (`transparent`, a tint) needs `!important` on the matching `:hover` rule in `global.css` or the hover silently does nothing. This has now bitten `.btn-neutral`, `.chip--off`, and `.track-toggle`. Check hover actually fires when adding a component that styles `background` inline.

**Component roster** — every row has a Storybook entry, as do Checkbox, Action Bar, Filter Card, Disclosure, Settings Sidebar, Newspaper Layout, Speed Mode Controls, Confirm Dialog, Page Header and Top Progress Bar. Full call-site detail per component is in `docs/design-system-rebuild-review.md`'s "Component roster — full call-site detail":

| Component | Status |
|---|---|
| Type, Spacing, Color | Built (Foundations) |
| Button, Badge, Card, Text Input, Number Field | Built (Atoms) |
| Chip Selector | Built, migrated everywhere |
| Data List | Built, migrated everywhere — `navigate.href`, `rowState`, `selection.bulkHeader: { selectFirst }`, per-column `placeholder` for editable cells |
| Modal | Built — `ConfirmDialog` now composes it |
| Toast | Built (pre-existing component) |
| Feed Card | Built, migrated everywhere — `image?: {src?, aspectRatio?}` cover slot + `disabled` boolean |
| Toggle Button | Built, migrated everywhere — composes Chip; tones `accent` / `success` / `neutral` |
| Distribution Bar | Built, migrated |
| Switch | Built |
| Drill Button | Built, migrated |
| Drill HUD | Built (pre-existing component) |
| Popover, Option Picker | Built |
| Deck Picker | Built — `DeckComboBox`, now a thin wrapper over Popover + OptionPicker |
| Select | Built — `size` sm/md, `variant` default/inline, grouped options → `<optgroup>` |
| File Button | Built |
| Section Header | Built — the **one** section heading. `action` slot (done screens), `marginTop` for stacked in-page groups, the older `hasSelections`/`onClearAll` pair for settings drawers. `SectionLabel` is **deleted** — see settled decision #19 |
| Sign-in Gate | Built |
| Definition Popover | Built — `WordPopup`, now Popover + an in-place view switch |

**Settled design decisions — don't relitigate.** Full reasoning for each (same numbering) is in `docs/design-system-rebuild-review.md`'s "Settled design decisions — full reasoning" section — read there before relitigating; this index exists so in-file references like "settled decision #14" stay meaningful without paying for the full text every session.
1. Drill palette (`DRILL_COLORS`) stays separate from the semantic tokens — different visual role, not interchangeable.
2. Module accents come from context (`ModuleThemeProvider`/`useAccent()`), not props — outside any provider, core teal applies.
3. Components are named for role, not location — no `Drawer*`-prefixed names.
4. `DeckComboBox` is the one deck picker — the old sheet/lab variants are deleted.
5. Atoms forward refs (`Button`, `TextInput`) so callers can measure/focus them.
6. `Popover` (anchoring) and `OptionPicker` (search/list/create) are separate composable components — don't reimplement either.
7. A stateful toggle is `ToggleButton`, not a `Button` variant — hover means something different for each.
8. Every color-bearing shared component must verify its own accent-awareness before a module rebuild — grep for hardcoded teal first, don't discover it one broken button at a time.
9. `DataList`'s `navigate` supports `href(row)` alongside `onClick(row)` — use `href` for a genuine cross-route link, `onClick` for a same-app navigation side effect.
10. A hover/focus CSS rule fighting an inline style needs `!important` — and check it actually fires.
11. A module's accent is `modules.js`'s, even when the page disagreed — that file is the source of truth.
12. Grammar Map is not ported — it's being removed.
13. Cards are for content, lists are for data — don't render word lists as cards or articles as list rows.
14. A screen's primary actions live in `ActionBar`, the sticky bottom bar.
15. Module headers are the plain `PageHeader` + `AuthSlot` — no per-module header buttons.
16. Comprehension checks are gone for good — don't reinstate the data without a reader to display it.
17. A screen's `ActionBar` buttons are `size="xl"`, one step up from a bare primary CTA elsewhere.
18. `Select`'s `inline` variant is for use inside a `FilterCard`/`FilterRow` next to chip rows; `default` stays for settings drawers.
19. One section heading, not two — `SectionLabel` is deleted; `SectionHeader` absorbed it.

**Still open:**
- **Six greens.** `#4ade80` (success), `#6BCB6B` (read/tracked), `#7fe0c8` (mature), `#27AE60` (drill correct), `#5eb6a2` (young), `#4c8a7d` (learning). The last three are the validated CVD ramp and are legitimate; `#6BCB6B` vs `#4ade80` looks like plain drift and probably wants merging.
- **Feed card title font.** `ArticleCard` used `FONT` (DotGothic16), `RecentCard` used `KANJI_FONT` (Hiragino), both for Japanese titles. `FeedCard` currently standardises on `FONT`.

## Dictionary as source of truth (jmdictId linkage) & Tanaka Corpus sentences

Every word/card that carries a `jmdictId` field is linked to a row in the Supabase `dictionary` table (schema in `supabase/CLAUDE.md`), which is the **authoritative source for definitions and readings** — not a fallback preference, a hard rule. The static `english`/`back` text on a word or card is used only when there's no `jmdictId` or the dictionary lookup returns nothing (legacy/unmatched entries). This applies identically to Vocab Drill words and Vocab SRS cards (bundled and imported).

Resolution is **live-query + cache**, never denormalized into JSON/storage:
- `src/utils/dictionaryEntryLookup.js` (`fetchDictionaryEntries(ids)`) + `src/hooks/useDictionaryEntries.js` (`useDictionaryEntries`/`useDictionaryEntry`) — batched, module-cached lookup by `jmdictId`, mirroring the `kanjiMeaningLookup.js`/`useKanjiMeanings.js` pattern above. Used by `VocabCard.jsx`, `VocabPage.jsx`'s `GlanceScreen`, and `VocabSrsDrill.jsx`'s `SrsCardFace`.
- `src/lib/dictionaryLookup.js` (`lookupDictionaryEntries`, `pickBestDictionaryMatch`) — the shared two-stage `dictionary` lookup (primary_form exact match, then kana_forms GIN overlap, tie-broken by common+shortest) used by `lookupVocabulary.js`, the backfill/import scripts below, and (in spirit — Deno can't share the module) `supabase/functions/word-import/index.ts`.

**Example sentences** come from the Tanaka Corpus (EDRDG, CC-BY licensed), imported into a Supabase `sentences` table:
```sql
create table if not exists sentences (
  id             text primary key,        -- Tanaka/Tatoeba sentence id
  japanese       text not null,
  english        text not null,
  dictionary_ids text[] not null default '{}',
  quality        boolean not null default false  -- Tanaka Corpus '~' "recommended example" flag
);
create index sentences_dictionary_ids_gin on sentences using gin (dictionary_ids);
grant select on sentences to anon, authenticated;
grant all on sentences to service_role;
-- RLS is enabled on every new table automatically — without a policy,
-- anon/authenticated reads silently return zero rows (no error):
alter table sentences enable row level security;
create policy "public read" on sentences for select using (true);
```
`src/utils/sentenceLookup.js` (`fetchSentencesFor`) + `src/hooks/useSentenceForWord.js` (`useSentenceForWord`, `useSentencesForWords`) resolve the best sentence per `jmdictId` (quality-flagged first, then shortest), same cached-batch pattern as above.

**Sentence resolution has the opposite priority rule from definitions** — a word/card's own curated `sentence` wins by default; a Tanaka sentence only fills the gap when there isn't one. That rule is now **fixed behaviour, not a setting** — the "Sentence source" picker was removed from the drill settings drawer (it asked the learner to have an opinion about provenance mid-drill). The `sentenceSource` prop survives on `VocabCard`/`SrsCardFace`/`GlanceScreen`, defaulting to `'custom'`, so the Tanaka-wins path is still reachable if a caller ever wants it. Attribution for Tanaka-sourced sentences is handled at the page level, not per-card — see Attribution system below.

## Database safety net: `rls_auto_enable`

An **event trigger** in the database enables row-level security on every table created in `public`, automatically. It exists only in the database — not in this repo, and not in any migration — so it is easy to be surprised by. It is why a freshly created table already has RLS on, and therefore why a new table returns **zero rows with no error** until you add a policy (the trap called out in the `sentences` schema above).

Safe to leave alone: it `RETURNS event_trigger`, so it cannot be invoked directly even though `PUBLIC` holds EXECUTE on it; it is `SECURITY DEFINER` with `search_path` pinned to `pg_catalog`, which closes the usual escalation vector; and the most it can do is *enable* RLS, swallowing errors so it can never break a migration.

An audit of `anon`/`authenticated` grants (2026-09-05) was otherwise clean: no write access to any reference table, RLS on across the board, and no EXECUTE on the quota functions. The only expected write grants are `progress` (INSERT/UPDATE) and `stories` (INSERT) for `authenticated`, both confined to the caller's own rows by RLS.

## Auth

Multi-provider auth via Supabase: GitHub and Google OAuth, plus passwordless email magic link. There is deliberately **no password anywhere** — magic link instead, which avoids owning a password-reset flow.

`signIn()` stays **parameterless** and opens `SignInDialog` rather than redirecting. With more than one provider available "Sign in" can no longer mean "go to GitHub", and keeping the signature meant the six existing call sites (`AuthSlot`, `VocabSrsModule`, `StoryModule`, `EpisodeDrill`, …) needed no change to gain the chooser. `signInWithProvider(id)` is the actual redirect.

| File | Purpose |
|---|---|
| `src/lib/supabase.js` | Supabase client (reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) |
| `src/context/AuthContext.jsx` | `AuthProvider` + `useAuth()` — exposes `{ user, loading, signIn, signInWithProvider, signInWithEmail, signOut, linkProvider, unlinkProvider, refreshUser }`; also renders `SignInDialog` |
| `src/components/SignInDialog.jsx` | Provider chooser + magic-link field — composes `Modal`, opened by `signIn()` |
| `src/data/authProviders.js` | `AUTH_PROVIDERS` — the one provider list shared by the dialog and the account page's linking UI |
| `src/pages/AccountPage.jsx` | `#/account` — profile, linked accounts (link/unlink), sign out, delete account |
| `supabase/functions/delete-account/index.ts` | Deletes the caller's rows then their auth user — see below |
| `src/components/AuthSlot.jsx` | Sign in / sign out control; the initials link to `#/account` |
| `src/hooks/useProgress.js` | `useProgress(namespace)` — Supabase-backed progress hook (see below) |

**`refreshUser()` exists because `onAuthStateChange` deliberately keeps the previous user object when the id is unchanged** (to avoid a `useProgress` reload flash on every token refresh). Linking or unlinking an identity changes `user.identities` but *not* the id, so without an explicit refresh the account page would never re-render. Any future change to something inside the user object rather than the user itself needs the same call.

**`Avatar` is a deliberate exception to settled decision #2** (module accents come from context). It used `useAccent()`, which recoloured the header badge on every navigation — teal on the dashboard, pink in anime vocab, red in the news reader. It now uses a fixed `AVATAR_COLOR`; the badge stands for the *user*, and that doesn't change with the route. Its `accent` prop survives as an explicit per-instance override. Don't "fix" it back to `useAccent` on the grounds that every other colour-bearing component reads the ambient accent.

**The account page is one centred column of `DataList`s**, not bespoke rows: profile details and linked accounts are both lists. The linked-accounts list has a row for *every* provider whether connected or not — a connected row offers `Unlink` (`ghost-muted`, the documented remove affordance: quiet until hovered, then red), an unconnected one `Link` (`neutral`). That way the list is also where you add a provider, instead of a separate button cluster below it. A magic-link `email` identity only appears once it exists, since it has no OAuth button to offer.

**Account deletion goes through the `delete-account` edge function**, because `auth.admin.deleteUser` needs the service role and must never reach the browser. The function takes **no user id** — it resolves the caller from their own token via `requireUser`, so a caller can only ever delete themselves. `progress.user_id` and `stories.user_id` both reference `auth.users` with no cascade, so those rows are deleted first or the foreign key rejects the user delete; consequently **deleting an account also removes that user's public stories from everyone's feed**. Adding another user-scoped table means adding it to that function.

**Data export** (`src/utils/exportData.js`, tested in `exportData.test.js`) offers two files from the account page's "Your data" section:

- **`buildBackupJson`** — every `progress` row plus the user's `stories`, scheduling included. This is the lossless one, and the only one that can restore a user's state.
- **`buildAnkiTsv`** — card content only, with the deck name as an Anki tag. **Scheduling is deliberately absent and cannot be added:** Anki's text importer only ever writes note fields and tags — never due dates, intervals, ease, or FSRS memory state — and a review card's due date is a day offset from the collection's creation day, which a browser cannot know. A real `.apkg` would need zip + a full SQLite collection in the browser and *still* wouldn't solve the creation-day problem. Don't accept a bug report asking for "full" Anki export without re-reading this. Audio is omitted too: an imported deck's recordings are third-party files, and Anki won't fetch a URL from a field.

Both go through `downloadFile`, which revokes its blob URL on a later tick — revoking in the same tick cancels the download in some browsers. Fields are flattened with `cell()` before joining, since a tab or newline inside a field would silently shift every column after it and produce a file that imports without error and is quietly wrong.

Adding a provider is: one entry in `AUTH_PROVIDERS` **and** enabling it in the Supabase dashboard. The code ships ahead of the dashboard toggle by design — an unconfigured provider's button simply errors, which is also the real launch gate for opening signups. Account linking additionally requires **Manual linking** to be enabled for the project.

`AuthProvider` wraps the entire app in `main.jsx`. `loading` is true until the initial session resolves; the header auth slot renders nothing during this window to avoid a flash.

### useProgress hook

```js
const { data, save, loading } = useProgress('my-module-namespace')
```

- **Logged in**: Supabase is the source of truth. Waits for auth to resolve before setting `loading = false` (prevents the init-effect race where `data = null` triggers a fresh-state overwrite before Supabase has responded). Writes to both Supabase and localStorage on every `save()`; localStorage is a write-through cache for fast display on the next load and a fallback if a read fails.
- **Logged out**: reads and writes localStorage only under the key `progress-{namespace}` — the **anonymous** key. This is the only key a signed-out session ever touches.
- **Two separate localStorage keys, never one.** `progress-{namespace}` is the anonymous store; a signed-in session's cache lives under `progress-{namespace}-u{userId}` instead. They used to be the same key, and that was a bug, not a simplification: a signed-in save wrote through to the plain key as a "fast display" cache, so anything picked while signed in — including an account-only textbook nobody else can even select — was still sitting in the plain key after sign-out and rendered as if it were anonymous state. Worse, a second account signing in on the same browser would have inherited the first account's cache. Scoping the cache key to the user id makes that structurally impossible: signed-out mode can only ever see what an anonymous session itself wrote.
- **The anonymous key is retired the moment it's adopted.** On every authenticated load/save, the account's own `-u{userId}` cache is what gets written, and `progress-{namespace}` is explicitly removed — whether that anonymous data was just migrated in (see below) or was simply sitting there stale from before this account signed in. This is also what makes "sign out and get a clean slate" actually true: once you've signed in at least once, there's no leftover anonymous snapshot left to resurface. A visitor who never signs in keeps their anonymous progress across visits as before (e.g. the Vocab Drill textbook picker/pointer, see `src/pages/CLAUDE.md`) — this only retires it once an account has claimed it.
- **First sign-in migration**: if Supabase has no row but the anonymous key has data, that data is automatically upserted to Supabase and used as the starting state, written into the new `-u{userId}` cache, and the anonymous key is cleared.
- `data` is the stored payload (any JSON-serialisable value), or `null` if nothing saved yet.
- `save(payload)` upserts the full payload and optimistically updates local state.
- Supabase errors are logged as `[useProgress] Supabase save/load/migration failed: …`; localStorage (the caller's own `-u{userId}` cache) is used as fallback on load errors.

## Where the rest lives

Module- and area-specific guidance is in folder-level `CLAUDE.md` files, which load when you work with files in that folder. Read the relevant one before changing code in an area you haven't touched this session:

| File | Covers |
|---|---|
| `src/pages/CLAUDE.md` | Home page (textbook-led), Vocabulary Drill (layout, audio, Voicevox), Dictionary pages |
| `src/data/CLAUDE.md` | Word sources and word data format, personal word lists (`custom_words`, `audio-keep.json`), adding a word list, attribution system |
| `src/components/CLAUDE.md` | Shared components table, drill settings panel (`DrillSettingsPanel` / `useDrillSettings`) |
| `src/modules/vocab-srs/CLAUDE.md` | Vocab SRS — decks, FSRS, sessions, progress shape, settings |
| `src/modules/immersion/CLAUDE.md` | Immersion reader and nightly article pipeline |
| `src/modules/story/CLAUDE.md` | Story generator — formats, `stories` table, learnerContext |
| `src/modules/grammar-map/CLAUDE.md` | Grammar Map (being removed) |
| `supabase/CLAUDE.md` | `progress` / `dictionary` / `kanji` schemas, edge functions, AI quotas, bring-your-own key, rate limiting, app-wide AI ceiling |

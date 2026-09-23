# Supabase — schemas, edge functions, quotas, rate limits

Loaded when working under `supabase/`. Most tables were created in the SQL editor, not by a migration, so the SQL below is the only record of them in the repo.

### Supabase schema

The `progress` table. All card/word content lives in static JSON in the repo.

```sql
create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  namespace text not null,
  payload jsonb not null,
  updated_at timestamptz not null,
  unique (user_id, namespace)
);

alter table progress enable row level security;

create policy "select own rows" on progress for select
  using (auth.uid() = user_id);

create policy "insert own rows" on progress for insert
  with check (auth.uid() = user_id);

create policy "update own rows" on progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on progress to authenticated;
-- delete is for the delete-account edge function only; without it that
-- function fails with 42501 and account deletion silently can't work.
grant select, update, delete on progress to service_role;
```

### Supabase `dictionary` table

Central dictionary backed by [jmdict-simplified](https://github.com/scriptin/jmdict-simplified). 217,625 entries; `common = true` on ~22,610 entries (ichi1/ichi2/news1/news2/spec1/spec2 priority markers). To prune to common-only: `DELETE FROM dictionary WHERE NOT common;`

```sql
create table if not exists dictionary (
  id           text primary key,       -- JMdict entry id
  primary_form text not null,          -- first kanji form, or first kana form if no kanji
  kanji_forms  text[] not null default '{}',
  kana_forms   text[] not null default '{}',
  gloss_en     text,                   -- all English glosses joined with '; ' (flattened, for search/preview)
  pos          text[],                 -- partOfSpeech codes across all senses
  common       boolean not null default false,
  senses       jsonb,                  -- full per-sense breakdown, see below
  jlpt_level   text,                   -- 'N5'..'N1', community-estimated (see below) — null for unmatched entries
  jlpt_level_inferred boolean not null default false -- true when jlpt_level came from suffix-stripping inference, not a direct source match
);
create index dictionary_primary_form_idx on dictionary (primary_form);
create index dictionary_kana_forms_gin   on dictionary using gin (kana_forms);
create index dictionary_common_idx       on dictionary (common);
create index dictionary_jlpt_level_idx   on dictionary (jlpt_level);
grant select on dictionary to anon, authenticated;
grant all on dictionary to service_role;
```

`senses` is an array of `{ gloss[], pos?[], field?[], misc?[], info?[], dialect?[], languageSource?[{lang, text?, wasei?}], related?[], antonym?[] }` — one entry per JMdict sense, built by `transformEntry()` in `scripts/import-jmdict.mjs`. It powers the full-detail view in `DictionaryEntryPage.jsx` (grouped by part-of-speech, with field/misc/dialect tags and cross-references); rows imported before this column existed fall back to rendering `gloss_en` as a flat block.

**`jlpt_level`** — no official JLPT vocabulary list exists (the Japan Foundation stopped publishing one when the test moved from 4 levels to N1–N5 in 2010; this is also why JMdict's own former JLPT field was dropped), so this is a **community-estimated approximation**, populated by `scripts/import-jlpt-vocab.mjs` from [stephenmk/yomitan-jlpt-vocab](https://github.com/stephenmk/yomitan-jlpt-vocab) (CC BY-SA 4.0 — a JMdict-id-matched conversion of Jonathan Waller's JLPT Resources list, tanos.co.uk, CC BY; same de-facto list Jisho.org uses). Matching is a direct `jmdict_seq` → `dictionary.id` join, reading-verified against `kana_forms` the same way `backfill-vocab-jmdict.mjs` verifies matches elsewhere, since JMdict snapshots can drift between when this app's `dictionary` table was built and when the JLPT source list was last generated — mismatches are skipped and logged rather than trusted. UI copy referencing this data should say "estimated"/"approximate", never "official". Attribution: `ATTRIBUTIONS['jlpt-vocab']` in `src/data/attributions.js`. If this source is ever swapped, the next-best fallback found during research was [elzup/jlpt-word-list](https://github.com/elzup/jlpt-word-list) (MIT, same Waller/tanos.co.uk root data) — no JMdict ids though, so it would need the same reading-verified matching pipeline the Jiten integration below already uses rather than a direct id join.

Waller's list only tags root vocabulary, not derived/compound forms (e.g. 刺激 is N3 but 刺激的/刺激性/刺激剤 aren't listed at all — confirmed live, only ~60% of a real anime episode's content words get a direct tag). `scripts/infer-jlpt-vocab.mjs` fills in some of the gap by stripping 1–2 trailing characters off an untagged word's kanji forms and checking whether the remainder is a directly-tagged root — reading-verified against `kana_forms` (not just a kanji-substring match), since the same kanji can carry very different levels across different dictionary entries (confirmed live: 人 ranges N5 as a standalone noun to N1 as a counter-suffix; 私 has 11 entries from N5 to N1 depending on reading). If multiple reading-verified candidates disagree on level, the word is left untagged rather than guessed. Matches are written with `jlpt_level_inferred = true` and rendered dimmer/prefixed `~` wherever `jlpt_level` is shown (`EpisodeVocabBrowser.jsx`), since it's an approximation of an already-unofficial approximation. Never chains through another inferred row — only directly-sourced (`jlpt_level_inferred = false`) rows are used as strip targets.

Lookup in the pipeline uses a two-stage query: stage 1 matches `primary_form` against Kuromoji `basic_form`; stage 2 uses GIN array overlap on `kana_forms` for entries where the basic form is kana but the JMdict primary form is kanji (e.g. `ある` → `有る`).

### Supabase `kanji` table

```sql
create table if not exists kanji (
  literal     text primary key,
  grade       smallint,
  stroke_count smallint,
  jlpt        smallint,
  frequency   smallint,
  meanings    text not null default '',  -- English meanings joined with '; ' (plain text, not array)
  on_readings text[] not null default '{}',
  kun_readings text[] not null default '{}',
  common      boolean not null default false
);
grant select on kanji to anon, authenticated;
grant all on kanji to service_role;
```

Populated by `scripts/import-kanjidic2.mjs` (accepts raw XML zip or pre-converted JSON).

### Edge functions

The Anthropic API key never reaches the client — all calls go through Supabase Edge Functions. The learner-context system block carries `cache_control: {type: 'ephemeral'}` so repeated generations in a session reuse the prompt cache (very small word lists may fall below the minimum cacheable prefix and silently not cache — harmless). Structured output via `output_config.format` json_schema — responses are parsed JSON, never prose.

**Every function that spends money must call `requireUser(req)` first** (`supabase/functions/_shared/auth.ts`). The platform's `verify_jwt` is *not* an identity check: the anon key is itself a valid project JWT and ships in every browser bundle, so it clears the gateway and reaches the function body. `requireUser` resolves the bearer token to a real user via `auth.getUser()` and throws an `AuthError` otherwise; pair it with `authErrorResponse(err, jsonResponse)` in the function's `catch` so the rejection keeps that function's own error contract. In `story-generate` the call must stay **ahead of the ReadableStream** — once the stream opens the response is committed to `200 text/plain` and a real status code is no longer possible. This helper is deliberately shared rather than duplicated per function (the norm for the tokenizer setup below): an auth check that drifts between copies is worse than no check at all. Applied to `story-generate`, `word-import`, `user-api-key`, `delete-account`. The four `anime-*` functions work signed out by design and are rate-limited instead — see below.

### AI usage quotas

Requiring an account is **not** a cost control — once signups are open, an account is free and instant. `supabase/functions/_shared/quota.ts` is what actually caps the Anthropic bill: `consumeQuota(userId, feature)` before the model call, `refundQuota` if the work then fails, `quotaErrorResponse` in the `catch` (chain it after `authErrorResponse` with `??`). In `story-generate` the consume call has the same constraint as `requireUser` — it must precede the `ReadableStream`, or a 429 can't be expressed.

`DAILY_LIMITS` is keyed by **unit of cost, not function name**: `story-generate` (5/day), `word-import-image` (10/day), plus a server-only `key-validation` (10/day) bucket. Per-feature rather than one shared pool because features differ in cost by more than an order of magnitude, and a single counter would let the expensive one silently eat the cheap one's budget. `word-import`'s **text** mode makes no Anthropic call and is deliberately absent from the table, so it is free.

`story-generate` and `word-import`'s OCR refund on failure, because losing one of five daily generations to a server error is the difference between a limit and a punishment.

```sql
create table if not exists ai_usage (
  user_id uuid references auth.users on delete cascade not null,
  feature text not null,   -- a key of DAILY_LIMITS
  day date not null,       -- UTC
  count integer not null default 0,
  primary key (user_id, feature, day)
);

alter table ai_usage enable row level security;
create policy "read own usage" on ai_usage for select using (auth.uid() = user_id);
grant select on ai_usage to authenticated;
grant all on ai_usage to service_role;

-- Increment and check in ONE statement. A read-then-write pair would let two
-- concurrent requests both observe "under the limit" and both proceed.
-- Returns the new count, or NULL when the user is already at the limit.
create or replace function consume_ai_quota(p_user uuid, p_feature text, p_limit int)
returns int language sql as $$
  insert into ai_usage (user_id, feature, day, count)
  values (p_user, p_feature, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, feature, day) do update
    set count = ai_usage.count + 1
    where ai_usage.count < p_limit
  returning count;
$$;

-- Counts without capping: the path for a user on their own key. They aren't
-- metered, but their usage is still shown back to them, and recording it here
-- means "today" and "lifetime" come from one table for everyone.
create or replace function record_ai_usage(p_user uuid, p_feature text)
returns int language sql as $$
  insert into ai_usage (user_id, feature, day, count)
  values (p_user, p_feature, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, feature, day) do update
    set count = ai_usage.count + 1
  returning count;
$$;

create or replace function refund_ai_quota(p_user uuid, p_feature text)
returns void language sql as $$
  update ai_usage set count = greatest(count - 1, 0)
  where user_id = p_user and feature = p_feature
    and day = (now() at time zone 'utc')::date;
$$;

-- REQUIRED, not tidiness: Postgres grants EXECUTE on new functions to PUBLIC
-- by default. Without this, any signed-in user could call refund_ai_quota over
-- PostgREST's /rpc/ endpoint and hand themselves unlimited usage.
revoke execute on function consume_ai_quota(uuid, text, int) from public, anon, authenticated;
revoke execute on function refund_ai_quota(uuid, text) from public, anon, authenticated;
revoke execute on function record_ai_usage(uuid, text) from public, anon, authenticated;
grant execute on function consume_ai_quota(uuid, text, int) to service_role;
grant execute on function refund_ai_quota(uuid, text) to service_role;
grant execute on function record_ai_usage(uuid, text) to service_role;
```

`ai_usage.user_id` cascades on delete, so account deletion needs no change to `delete-account` — unlike `progress` and `stories`, which don't cascade and must be deleted explicitly there. Prefer the cascade for any new user-scoped table.

### Bring your own API key

A user can supply their own Anthropic key, in which case they are **not metered**: `getUserApiKey(user.id)` (`supabase/functions/_shared/userKey.ts`) runs before `consumeQuota`, and a key present means the quota call — and its refund — are skipped entirely, with the key passed to `new Anthropic({ apiKey })` instead of the app's own. That branch is the whole integration; it is deliberately one `if` at each of the three call sites rather than a wrapper.

**The key is never readable by the client — including by its owner.** That is structural, not a promise: `user_api_keys` has RLS enabled and **no policy and no grant for `anon`/`authenticated` at all**, so PostgREST cannot return it to anybody. Every access goes through an edge function on the service role, and the only thing any response ever carries is `key_hint`, the last four characters. Don't add a select policy "for convenience" — there is no client-side use for the key.

It's also encrypted at rest on top of the platform's own encryption (AES-GCM, fresh IV per write, secret in `API_KEY_ENCRYPTION_SECRET`), so a leaked database dump alone doesn't yield working keys. A row that fails to decrypt — rotated secret, corruption — falls back to the app key and quota rather than failing the request. On save the key is checked against Anthropic's `/v1/models` (which costs no tokens) so a typo fails at the point of entry rather than silently breaking the next generation.

```sql
create table if not exists user_api_keys (
  user_id uuid primary key references auth.users on delete cascade,
  encrypted_key text not null,
  key_hint text not null,   -- last 4 chars; the only part ever returned
  created_at timestamptz not null default now()
);

alter table user_api_keys enable row level security;
-- No policy and no grant for anon/authenticated, deliberately: see above.
grant all on user_api_keys to service_role;
```

Needs `supabase secrets set API_KEY_ENCRYPTION_SECRET=...` (generate with `openssl rand -base64 32`). **Rotating that secret orphans every stored key** — users would silently fall back to the shared quota and have to re-enter theirs.

Client side, `useAiUsage()` (`src/hooks/useAiUsage.js`) returns today's counts keyed by feature, plus a `refresh` for callers that just spent quota. `AccountPage` lists every feature; `StoryModule` shows `QuotaPips` — one pip per daily generation, filled while unspent, coloured by the module accent — and **disables Generate at zero rather than letting the server 429**, so an exhausted quota reads as a visibly disabled button instead of a wasted round trip and a raw error. Both read `AI_DAILY_LIMITS` (`src/data/aiLimits.js`), the hand-synced mirror of the server's table; the server stays authoritative, so drift shows a wrong number rather than letting anyone past a limit.

### Rate limiting the anonymous anime endpoints

The four `anime-*` functions **work signed out on purpose** — only following a series and sending words to SRS need an account — so per-user quotas don't apply to them. What still needs bounding is that they proxy Jiten with *our* `JITEN_API_KEY`: unmetered, a scraper spends our private Jiten allowance (rate-limiting our own users, since an anonymous caller would otherwise only burn Jiten's shared pool) and our **Supabase invocation quota**, which is shared with every other function including the AI ones. That second one is the real reason this exists — sustained spam against an anime endpoint could degrade the whole app.

`enforceRateLimit(req, feature, { cost })` (`supabase/functions/_shared/rateLimit.ts`) applies **two windows, and neither substitutes for the other**: per-minute stops a burst or a runaway client loop; per-day stops the patient scraper who stays under the minute limit forever.

**Limits are denominated in Jiten requests, not in calls to us**, which is the only unit comparable to Jiten's own published numbers. One call fans out to a variable number of upstream requests, so counting invocations gave figures that looked safe and weren't — a cap of "10 syncs a minute" is really up to 100 upstream requests a minute against an endpoint Jiten caps at ~10/min anonymously. Each call declares its `cost`: `anime-lookup` charges `externalIds.length` (one upstream request per id, issued in parallel, and the array is capped at `MAX_LOOKUP_IDS` since otherwise one request becomes arbitrarily many), `anime-vocab-sync` charges `VOCAB_SYNC_COST` as a worst-case page count, and the rest charge 1.

**`anime-browse` gets the tightest limit, which is the opposite of what raw fan-out suggests.** It is a live, uncached search that fires as the user types, and the only one of the four whose load grows with the number of users. `anime-vocab-sync` looks alarming — 200-row pages, 10+ upstream calls — but is idempotent: it early-returns on `episode.synced_at`, so an episode is fetched from Jiten **exactly once ever, across all users**, and repeat requests cost nothing upstream. Caching, not rate limiting, is what keeps total Jiten traffic flat as the user base grows.

**Jiten's actual limits**, read from their source (`Jiten.Api/Program.cs`, [github.com/Sirush/Jiten](https://github.com/Sirush/Jiten)) rather than inferred: named ASP.NET policies, all 60-second windows. `fixed` = **300/min** and covers **every endpoint we call** (`get-media-decks`, `{id}/detail`, `{id}/vocabulary`). `download` = 10/min and covers deck downloads, frequency lists and the custom-deck parser — **none of which we call**. `heavy` = 20/min anonymous, 45 keyed, for search-by-description and example sentences — also not ours.

**Correcting a belief that was wrong here for a long time:** this codebase recorded "~10 req/min for the vocabulary endpoint". That was the `download` policy misattributed. Vocabulary inherits `fixed` at 300/min, so the real ceiling is 30× what was assumed.

**`JITEN_API_KEY` is not set**, and the functions only attach `X-Api-Key` when it is. That matters less for the *number* than for the *partition*: Jiten keys its buckets on `user:{userId}` when a key or JWT is present and `ip:{clientIp}` otherwise, and `fixed` is 300/min either way. So today **every one of our users shares one partition keyed on Supabase's egress IP** — possibly alongside unrelated Supabase tenants on the same address. A key buys an isolated partition, which for a server-side proxy is worth considerably more than a larger number would be.

**What the limiter achieves and what it doesn't.** It stops one caller monopolising the allowance, and the per-user numbers are a fraction of 300 so no single user can drain it. It does **not** bound the total, because Jiten meters our egress rather than our users. A global ceiling is the only mechanism that would. Mitigating that today: sync is idempotent (each episode fetched once ever), and a Jiten 429 surfaces as a clean error — note its body is `text/plain`, not JSON, and every call site checks the status before parsing. Small overshoots **queue rather than reject**, so the symptom is a request hanging for up to a minute rather than a visible error.

The bucket is `user:<id>` when signed in, otherwise `ip:<salted hash>`. **The hash is salted deliberately:** an unsalted hash of an IPv4 is trivially reversible, so it would still be personal data — salting with a secret the database never sees keeps the stored value non-identifying, which is also why PRIVACY.md doesn't have to claim we store IP addresses. The salt is derived from `API_KEY_ENCRYPTION_SECRET` with a purpose string rather than reusing it directly.

**It fails open.** If the limiter itself errors, the request proceeds — anime browsing staying up matters more than protecting a third-party rate limit. That also means deploying before the SQL below exists is safe; it simply doesn't limit yet.

```sql
create table if not exists rate_limit (
  bucket text not null,       -- 'user:<uuid>' or 'ip:<salted hash>'
  feature text not null,
  window_key text not null,   -- 'min:2026-09-05T18:32' | 'day:2026-09-05'
  count integer not null default 0,
  expires_at timestamptz not null,
  primary key (bucket, feature, window_key)
);
create index if not exists rate_limit_expires_idx on rate_limit (expires_at);

alter table rate_limit enable row level security;
-- No policy and no grant for anon/authenticated: only edge functions touch it.
grant all on rate_limit to service_role;

-- Increment and check in one statement, same reason as consume_ai_quota.
-- Returns the new count, or NULL when that window is already full.
create or replace function consume_rate_limit(
  p_bucket text, p_feature text, p_window_key text,
  p_limit int, p_cost int, p_expires timestamptz
) returns int language plpgsql as $$
declare v_count int;
begin
  -- A single call whose cost exceeds the whole window can never fit, and
  -- without this the first insert would let it through.
  if p_cost > p_limit then return null; end if;

  -- Opportunistic cleanup, scoped to this bucket so it stays cheap.
  delete from rate_limit where bucket = p_bucket and expires_at < now();

  insert into rate_limit (bucket, feature, window_key, count, expires_at)
  values (p_bucket, p_feature, p_window_key, p_cost, p_expires)
  on conflict (bucket, feature, window_key) do update
    set count = rate_limit.count + p_cost
    where rate_limit.count + p_cost <= p_limit
  returning count into v_count;

  return v_count;
end $$;

revoke execute on function consume_rate_limit(text, text, text, int, int, timestamptz) from public, anon, authenticated;
grant execute on function consume_rate_limit(text, text, text, int, int, timestamptz) to service_role;

-- Releases a reserved unit when the work that took it failed. Unconditional
-- arithmetic, so unlike consume_rate_limit it needs no atomicity guard; the
-- greatest() floor stops a double refund pushing the counter negative.
create or replace function refund_rate_limit(
  p_bucket text, p_feature text, p_window_key text, p_cost int
) returns void language sql as $$
  update rate_limit set count = greatest(0, count - p_cost)
  where bucket = p_bucket and feature = p_feature and window_key = p_window_key;
$$;

revoke execute on function refund_rate_limit(text, text, text, int) from public, anon, authenticated;
grant execute on function refund_rate_limit(text, text, text, int) to service_role;
```

### App-wide AI ceiling (`bucket = 'global'`)

Per-user quotas bound what one person can spend; nothing bounded the *sum*, so N users × 5 stories was unbounded in N. `GLOBAL_DAILY_LIMITS` in `_shared/quota.ts` adds a ceiling across all users combined, reusing the `rate_limit` table above with the bucket literal `'global'` rather than introducing a second mechanism. The spend limit set on the Anthropic key itself is the backstop *behind* this — the difference is that hitting the app's ceiling produces "AI generation is temporarily unavailable", whereas hitting Anthropic's produces a raw provider error.

`consumeAiBudget(userId, feature, ownKey)` is the single entry point and encodes the ordering, which is easy to get wrong in a way nothing surfaces: **charge the user first, then the global pool, refunding the user if the pool is full.** The other order charges the app for a request the user's own limit then rejects. A user on their own key skips the ceiling entirely — they aren't spending the app's budget — and only has their usage recorded. `refundAiBudget` is the matching release for a generation that fails after being charged.

**The banner.** `rate_limit` is service_role-only and must stay that way, so the client can't read the counters directly. `ai_availability()` is the one narrow read-only window: today's global counters plus whether the caller is on their own key. It deliberately returns **raw counts, not a ready-made boolean**, so the limits themselves stay out of SQL — there are two copies to keep in step (`GLOBAL_DAILY_LIMITS` server-side, `GLOBAL_AI_DAILY_LIMITS` in `src/data/aiLimits.js`) rather than three. `useAiAvailability(feature)` compares them and **fails open**, returning available on any error, missing function, or signed-out visitor, matching the edge function's own fail-open behaviour so the two can't disagree in the direction that blocks someone unnecessarily.

```sql
create or replace function ai_availability()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'usage', coalesce((
      select jsonb_object_agg(feature, count)
      from rate_limit
      where bucket = 'global'
        and window_key = 'day:' || to_char(timezone('utc', now())::date, 'YYYY-MM-DD')
    ), '{}'::jsonb),
    -- Only ever a boolean about the caller's own row, keyed on auth.uid().
    'ownKey', auth.uid() is not null
              and exists (select 1 from user_api_keys where user_id = auth.uid())
  );
$$;

-- EXECUTE defaults to PUBLIC, so this revoke is not redundant.
revoke execute on function ai_availability() from public;
grant execute on function ai_availability() to anon, authenticated;
```

Deploy (one-time setup):

```
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <project-ref>   # ref is in the Supabase dashboard URL
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy story-generate word-import
```

Generation response shape: `{ title, story, tokens, questions: [{ id, question, correct_answer, acceptable_variations }] }`. Grading: `{ pass, feedback }` — questions and answers are in Japanese; feedback is English.

Generation is **streamed** server-side (`client.messages.stream` + `finalMessage`) with `max_tokens: 16000` and `output_config.effort: 'medium'`. The model outputs only `{ title, story, questions }` (~900 output tokens, ~20s wall clock); the tokens array is built server-side with Kuromoji, NOT by the model — an earlier version had the model emit it, which ballooned output to ~16k tokens and ~130s per generation. Do not add `tokens` back to STORY_SCHEMA.

**Kuromoji in the edge function:** `npm:@patdx/kuromoji` (ESM fork with a fetch-based custom loader) reading uncompressed dictionary files from jsDelivr (`@aiktb/kuromoji@1.0.2/dict/`, ~18 MB) at cold start, cached per warm instance. The tokenizer build starts before the Claude call, so the dictionary download overlaps generation and adds no latency. The token mapping mirrors `tokenizeTextRich` in `scripts/fetch-nhk.mjs`, except `r` is set only for tokens containing kanji (no redundant furigana over kana-only words) and `b` is null for w:false tokens. Tokenization failure is non-fatal: `tokens` comes back null and the reader falls back to a plain text block.

**story-generate response is a heartbeat stream, not plain JSON.** The edge gateway kills any request that sends no bytes for 150s (IDLE_TIMEOUT), so the function returns `text/plain` and streams a space every 10s while Claude works, then the JSON payload as the final line. Typical generations now finish in ~20-40s, but the heartbeat stays as insurance. Consequences: HTTP status is 200 even for post-header failures (errors arrive as `{ error }` in the payload), and `generateStory()` in `api.js` trims the heartbeats and parses the text — keep both sides in sync if the wire format changes.

`tokens` is Kuromoji segmentation: `[{ t, r, w, b }]` — surface, hiragana reading (kanji tokens only, else null), content-word flag, and dictionary base form (e.g. 向かいました → 向かう; null for w:false). Newlines are their own tokens (required by `parseDialogue`). Concatenated `t` values reproduce `story` exactly. The reader renders tokens through the shared `TokenizedBody` (now themeable: `vocabHighlight`, `hoverBg`, `rtColor` props — needed for the light newspaper background); clicking a word looks up its base form via `lookupVocabulary` and shows the JMdict gloss in `WordPopup`. The reading layout switches on the generation format: `news` → NewspaperLayout, `dialogue` → ChatLayout, anything else (or missing tokens) → plain text block. Hover/focus styles for Story buttons, fields, and recent-story cards live in `global.css` (`.story-btn`, `.story-field`, `.story-recent-card`) per the no-useState-hover rule. "Add to SRS" writes to a `story-words` imported deck in the vocab-srs namespace (second cross-module write, same pattern as immersion-words).

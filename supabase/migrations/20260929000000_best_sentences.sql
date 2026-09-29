-- The one example sentence each dictionary entry shows: quality-flagged first,
-- then shortest, then lowest id.
--
-- Picked here rather than in the browser because the browser could not pick
-- it reliably. A common word (する, 行く) matches more than the 1,000 rows a
-- query returns, so the client chose the "best" of an arbitrary subset, and
-- equal-length candidates tied on whatever order the rows arrived in — the
-- sentence under a card could change between sessions. It now has to be
-- stable, because generate-audio.mjs pre-records exactly this sentence and
-- the drills play the clip keyed by its text.
create or replace function best_sentences(ids text[])
returns table (dictionary_id text, id text, japanese text, english text, quality boolean)
language sql
stable
set search_path = public
as $$
  select distinct on (d.id) d.id, s.id, s.japanese, s.english, s.quality
  from unnest(ids) as d(id)
  join sentences s on s.dictionary_ids @> array[d.id]
  order by d.id, s.quality desc, char_length(s.japanese), s.id;
$$;

revoke execute on function best_sentences(text[]) from public;
grant execute on function best_sentences(text[]) to anon, authenticated, service_role;

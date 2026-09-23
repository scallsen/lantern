# Shared components

Loaded when working under `src/components/`. The design-system conventions and settled decisions stay in the root `CLAUDE.md`.

## Shared components (`src/components/`)

Used by multiple modules/pages:

| Component | Usage |
|---|---|
| `PageHeader.jsx` | Breadcrumb header — all pages |
| `AuthSlot.jsx` | Sign in / sign out control — dashboard header and module headers |
| `SectionHeader.jsx` / `Checkbox.jsx` / `Select.jsx` | Settings-drawer primitives (formerly `Drawer*`) — see the Design system & Storybook section |
| `SettingsSidebar.jsx` | The desktop chevron-rail / mobile-overlay settings panel — Vocab Drill, Anime Vocab, Vocab SRS. Exports `SidebarHeaderToggle`, the mobile header chevron that opens it |
| `ActionBar.jsx` | Sticky bottom bar for a screen's primary actions (see settled decision #14) |
| `FilterCard.jsx` | Card of labelled control rows — Anime Vocab's search filters, Story's generator form |
| `ModuleCard.jsx` | Dashboard module card |
| `Switch.jsx` | On/off control for a settings row — accent-aware, `role="switch"`, hover lit from the row |
| `DrillSettingsPanel.jsx` | The drill settings drawer shared by Vocab Drill, Anime Vocab and SRS — see Drill settings section |
| `AttributionFooter.jsx` | Third-party data credit line at the foot of a page — `<AttributionFooter sources={['dictionary', 'tanaka-corpus']} />`. See Attribution system section below |
| `Japanese.jsx` | Wraps a Japanese-only text run in `lang="ja" translate="no"` (`as` prop to pick the host tag) — stops the browser's own translate feature from mistranslating it. See the "No Japanese text in the UI" convention above for when to use it |
| `WordListModal.jsx` | `WordListContent` (kanji breakdown, sentences, dictionary link per word, grouped by list) + `WordListErrorBoundary`, extracted from VocabPage's old `GlanceScreen` — plus a `Modal`-wrapped default export for a caller (Dictionary) that doesn't already own its own Modal chrome. Used by VocabPage's `WordExplorerModal` and `DictionaryEntryPage`'s "View words" — see the Vocabulary Drill section |

### Drill settings — one panel, one hook

Vocab Drill, Anime Vocab and Vocab SRS render **the same settings drawer**: `src/components/DrillSettingsPanel.jsx`, fed by `useDrillSettings(prefix)` from `src/hooks/useDrillSettings.js`. They previously kept three hand-maintained copies of a checkbox list, and the labels had already drifted ("Show furigana" vs "Show furigana on front"). Don't add a fourth — a new drill calls the same hook and renders the same panel.

**Grouped by the part of the card each setting changes**, which is the question being asked when the drawer opens:

| Group | Rows |
|---|---|
| Card front | Furigana, Audio |
| Card back | Meaning, Kanji breakdown, Sentence, Audio |
| Audio | Voice (Male / Female), Backup voice |
| Interface | Sound effects, Visual effects, Pixel font, Streak counter |

Audio is **not** a group of its own: playing the word is one of the things a face does, so `frontAudio` (plays as the card arrives) and `backAudio` (plays on flip) are rows in the two faces, and the audio group keeps only the global decision of which voice speaks. That replaced a master `audio-enabled` switch plus SRS's `autoplay-audio` / `-front` / `-back` trio.

**Voice vs backup voice.** `voice` (`'male'` | `'female'`) picks between the two recorded Voicevox voices — `audioSourceForVoice()` maps it onto the `voicevox-11` / `voicevox-2` speaker strings the rest of the audio code still speaks. `backupVoice` is a browser speech-synthesis voice name, and it reads **any word with no recording** — the drills now fall through to it unconditionally, where they used to only speak when the user had explicitly picked the retired "Browser TTS" source. Consequences: there is no longer a way to force browser TTS over an existing recording, and a card that used to be silent now gets spoken.

Since clips are keyed by what is spoken rather than recorded per word, neither drill can tell in advance whether one exists, so **the fallback fires on playback failure, not on a missing URL**. Both drills go through the shared `useVoicevoxPlayer` hook (`src/hooks/useVoicevoxPlayer.js`) — Web Audio API (`AudioContext` + `AudioBufferSourceNode`), not `HTMLMediaElement.play()`, because the latter re-checks the browser's autoplay/user-activation policy on *every* call, and a gamepad button press never grants user activation per spec, so `play()` intermittently rejected and silently fell back to TTS even when the clip existed — this hit mobile browsers hardest, since `setTimeout`-deferred autoplay (the front-of-card audio) also loses the activation chain from the tap that triggered it. An `AudioContext` only needs activation once, at `resume()` time, and then stays usable for any later scheduled playback regardless of trigger. `play()` resolves false when a clip 404s or decode fails, which is what `speakCard()` (`VocabSrsDrill.jsx`) / `playWordAudio()` (`VocabPage.jsx`) check to fall back to the backup voice. `play(url, { onEnded })` is how SRS chains sentence audio after the word finishes — `onEnded` is guarded by the same token-based supersede check `stop()`/a newer `play()` already use, so an aborted/replaced clip doesn't fire a stale chain. **`VocabSrsDrill` used to have its own separate `HTMLAudioElement`-based path** (`started()`, raw `new Audio()`) — that was the actual cause of a long-standing bug where SRS review, especially on mobile and with a Bluetooth controller, would intermittently play the backup voice instead of an existing Voicevox clip (and could still play the wrong/stale audio after Undo, since pausing an in-flight `<audio>` before its `playing` event fired aborted its `play()` promise and looked exactly like a failed clip). Migrated to `useVoicevoxPlayer` to fix it — a new audio call site should go through this hook rather than calling `HTMLMediaElement.play()` directly and ignoring the result.

**Rows that don't apply are not rendered** — never disabled-with-an-explanation. `hasRecordedVoices={false}` drops the Voice row (Anime Vocab pulls its words from subtitles, so no recordings exist for any of them); an empty `backupVoices` drops the Backup voice row (a device with no speech voices has nothing to choose between). There is no help text under any row, and no indenting: a sub-setting is sequenced by position and by appearing at all.

Storage keys keep their `vocab-` / `srs-` prefixes and are listed in the SRS settings table below (the same suffixes apply to `vocab-`). **Vocab Drill and Anime Vocab deliberately share the `vocab-` namespace** — they always have; they are the same drill over different words. `initialDrillSettings(prefix)` migrates the old keys on first read (see `useDrillSettings.test.js` for the exact mapping) and the new keys are written from then on; the retired keys are left in place rather than deleted.

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import VocabCard from '../components/VocabCard.jsx'
import DrillHUD from '../components/DrillHUD.jsx'
import CenteredLoadingMessage from '../components/CenteredLoadingMessage.jsx'
import { WordListContent, WordListErrorBoundary } from '../components/WordListModal.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import Checkbox from '../components/Checkbox.jsx'
import Select from '../components/Select.jsx'
import Button from '../components/Button.jsx'
import DataList from '../components/DataList.jsx'
import Modal from '../components/Modal.jsx'
import TextbookPicker from '../components/TextbookPicker.jsx'
import SrsGateDialog from '../components/SrsGateDialog.jsx'
import SpeedModeControls from '../components/SpeedModeControls.jsx'
import PageHeader from '../components/PageHeader.jsx'
import AuthSlot from '../components/AuthSlot.jsx'
import SettingsSidebar, { SidebarHeaderToggle } from '../components/SettingsSidebar.jsx'
import DrillSettingsPanel from '../components/DrillSettingsPanel.jsx'
import { useDrillSettings, audioSourceForVoice } from '../hooks/useDrillSettings.js'
import {
  FONT, TRACKING, TEXT, TEXT_MUTED, FS_BASE, FS_CAPTION, FS_CONTENT_HEADING, BRAND, CONTENT_STANDARD,
} from '../data/theme.js'
import { ModuleThemeProvider, useAccent } from '../context/ModuleThemeContext.jsx'
import { WORD_SOURCES, visibleSources } from '../data/wordLists.js'
import { useDrill } from '../hooks/useDrill.js'
import { useTTS, useJaVoices } from '../hooks/useTTS.js'
import { useSFX } from '../hooks/useSFX.js'
import { useVoicevoxPlayer } from '../hooks/useVoicevoxPlayer.js'
import { useGamepad } from '../hooks/useGamepad.js'
import { useProgress } from '../hooks/useProgress.js'
import { useAudioGenerationStatus } from '../hooks/useAudioGenerationStatus.js'
import { useDictionaryEntries, useSenseGlosses } from '../hooks/useDictionaryEntries.js'
import { speechTextOf } from '../lib/displayForm.js'
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storage.js'
import * as SimpleQueue from '../engines/simpleQueue.js'
import { WORD_DATA, bundledWordCountFor } from '../data/wordData.js'
import { useCustomWords, useCustomWordCounts } from '../hooks/useCustomWords.js'
import { createDeck, deleteCards } from '../modules/vocab-srs/deckUtils.js'
import { addWordsToSrs, textbookDeck } from '../modules/vocab-srs/addWordsToDeck.js'
import { getVoicevoxAudioUrl, getVoicevoxCredit, speakerIdFromAudioSource } from '../utils/voicevoxAudio.js'
import AttributionFooter from '../components/AttributionFooter.jsx'
import { renderAttributionSegments } from '../utils/attributionSegments.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { useTextbookAdvance } from '../hooks/useTextbookAdvance.js'
import { resolveTextbookState } from '../lib/textbookProgress.js'
import { getTextbook, TEXTBOOKS } from '../data/textbooks.js'
import { sessionScore, recordFirstPass } from '../lib/drillScore.js'
import { RoundBreak, LessonCleared } from './drillFinish.jsx'
import { chapterPrimaryAction } from './chapterAction.jsx'
import { SegmentedPrimary, TextbookCover } from './homeCards.jsx'

const VOCAB_ACCENT = BRAND

const REVIEW_MODE_OPTIONS = [
  { value: 'kanji-front', label: 'Japanese → English' },
  { value: 'meaning-front', label: 'English → Japanese' },
]


// The dashboard's "Start Lesson N" deep-links here as
// `#/vocab?chapter=<listKey>&start=1`. The query is read once at mount to
// seed the source/sublist selection (and optionally jump straight into the
// drill), then stripped so a reload or a return from the drill lands on the
// plain home screen.
function hashQuery() {
  return new URLSearchParams(window.location.hash.split('?')[1] ?? '')
}

// Validated against WORD_SOURCES' config rather than WORD_DATA's bundled
// words: a personal source's chapters have no entry in WORD_DATA at all
// (their words live in the learner's account, loaded async by
// useCustomWords), so checking WORD_DATA here made every personal-textbook
// deep link — "Start current chapter" / "Next chapter" from the dashboard,
// for every book that actually has words today — silently fail to select a
// chapter or start the drill, landing back on the chapter overview instead.
function chapterFromHash() {
  const chapter = hashQuery().get('chapter')
  if (!chapter) return null
  return WORD_SOURCES.some(s => s.id === chapter || s.lists?.some(l => l.id === chapter)) ? chapter : null
}

// A textbook chapter's listKey is also a WORD_SOURCES sublist id (or, for a
// flat source, the source id itself) — this is what lets a personal source's
// words (useCustomWords) load correctly when a chapter row starts or
// previews a chapter that belongs to one.
function sourceIdForListKey(listKey) {
  const source = WORD_SOURCES.find(s => s.id === listKey || s.lists?.some(l => l.id === listKey))
  return source?.id ?? listKey
}

function defaultSelectedSource() {
  const chapter = chapterFromHash()
  if (chapter) return sourceIdForListKey(chapter)
  return safeLocalStorageGet('vocab-selected-source') ?? WORD_SOURCES[0].id
}

function useIsShort(breakpoint = 680) {
  const [isShort, setIsShort] = useState(() => window.innerHeight <= breakpoint)
  useEffect(() => {
    const mq = window.matchMedia(`(max-height: ${breakpoint}px)`)
    const handler = e => setIsShort(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])
  return isShort
}

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

// ── ActiveDrill ───────────────────────────────────────────────────────────────

const AUDIO_PRELOAD_COUNT = 3

function ActiveDrill({ drill, audioSource, playOnFront, playOnBack, sfxEnabled, ttsVoice, showStreak, reviewMode, showFurigana, showTranslation, showSentence, showKanjiMeaning, pixelFont, showVisualEffects, onPulse, isShort }) {
  const [flippedCardId, setFlippedCardId] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [exitDir, setExitDir] = useState(null)
  const [undoEntering, setUndoEntering] = useState(false)
  const { currentCard, upcoming, streak, bestStreak, correct, troubled, remaining, canUndo, onUndo } = drill
  const isFlipped = flippedCardId === currentCard.id
  const tts = useTTS(ttsVoice)
  const voicevox = useVoicevoxPlayer()

  const nearbyJmdictIds = useMemo(
    () => [currentCard, ...upcoming].map(c => c.word.jmdictId).filter(Boolean),
    [currentCard, upcoming]
  )
  const { entries: nearbyDictEntries } = useDictionaryEntries(nearbyJmdictIds, true)

  function resolveReading(word) {
    return word.kana ?? (word.jmdictId ? nearbyDictEntries[word.jmdictId]?.kana_forms?.[0] : undefined)
  }

  // A word no longer records which clips exist for it: the clip is keyed by
  // what the card says, so the URL is derivable and a miss falls back to speech
  // synthesis rather than being predicted in advance.
  function voicevoxUrlForWord(word) {
    const speakerId = speakerIdFromAudioSource(audioSource)
    if (!speakerId) return null
    const entry = word.jmdictId ? nearbyDictEntries[word.jmdictId] : null
    return getVoicevoxAudioUrl(speakerId, speechTextOf(word, entry) ?? word.kana)
  }

  function speakWord(word) {
    const reading = resolveReading(word)
    if (reading) tts.speak(reading)
  }

  async function playWordAudio(word) {
    voicevox.stop()
    const url = voicevoxUrlForWord(word)
    // No clip for this word — the backup voice reads it, rather than the
    // silence you got unless you had picked the old 'Browser TTS' source.
    if (!url) { speakWord(word); return }
    // Falls through to speech synthesis when a clip has not been generated yet,
    // which is what the old voicevoxVoices check was really guarding against.
    if (!await voicevox.play(url)) speakWord(word)
  }

  function stopWordAudio() {
    tts.cancel()
    voicevox.stop()
  }

  // Preload the current card's audio plus the next few upcoming cards so flipping
  // doesn't wait on a network fetch. Cache is trimmed to the current window each run.
  useEffect(() => {
    const desiredUrls = [currentCard, ...upcoming.slice(0, AUDIO_PRELOAD_COUNT)]
      .map(c => voicevoxUrlForWord(c.word))
      .filter(Boolean)
    voicevox.trimPreload(desiredUrls)
    desiredUrls.forEach(url => voicevox.preload(url))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard.id, audioSource])

  const [localStreak,     setLocalStreak]     = useState(streak)
  const [localBestStreak, setLocalBestStreak] = useState(bestStreak)
  useEffect(() => { setLocalStreak(streak) },     [streak])
  useEffect(() => { setLocalBestStreak(bestStreak) }, [bestStreak])

  const prevLocalStreakRef = useRef(localStreak)
  const [localStreakLost, setLocalStreakLost] = useState(null)
  useEffect(() => {
    const prev = prevLocalStreakRef.current
    prevLocalStreakRef.current = localStreak
    if (prev > 0 && localStreak === 0) {
      setLocalStreakLost('visible')
      const t1 = setTimeout(() => setLocalStreakLost('fading'), 250)
      const t2 = setTimeout(() => setLocalStreakLost(null), 400)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [localStreak])

  const isFlippedRef = useRef(isFlipped)
  const transitioningRef = useRef(false)
  useEffect(() => { isFlippedRef.current = isFlipped }, [isFlipped])
  useEffect(() => { transitioningRef.current = transitioning }, [transitioning])
  const sfx = useSFX()

  const handleVerdictRef = useRef()
  handleVerdictRef.current = (isCorrect) => {
    if (transitioningRef.current) return
    const action = isCorrect ? drill.onCorrect : drill.onWrong
    const breaksBest = !isCorrect && localStreak > 0 && localStreak === localBestStreak
    if (sfxEnabled) sfx.play(
      isCorrect ? 'flip_card_correct' : breaksBest ? 'best_streak_broken' : 'flip_card_wrong',
      isCorrect ? { pitchFactor: 1 + Math.min(localStreak + 1, 20) * 0.03 } : {}
    )
    if (isCorrect) {
      const next = localStreak + 1
      setLocalStreak(next)
      setLocalBestStreak(prev => Math.max(prev, next))
    } else {
      setLocalStreak(0)
    }
    setTransitioning(true)
    setExitDir(isCorrect ? 'up' : 'down')
    onPulse(isCorrect ? 'correct' : 'wrong')
    const exitDelay  = showVisualEffects ? 280 : 0
    const clearDelay = showVisualEffects ? 600 : 0
    setTimeout(() => { action(); setExitDir(null) }, exitDelay)
    setTimeout(() => { setTransitioning(false); onPulse(null) }, clearDelay)
  }

  useEffect(() => {
    if (isFlipped && playOnBack) {
      playWordAudio(currentCard.word)
    } else {
      stopWordAudio()
    }
    return () => stopWordAudio()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped, currentCard.id, audioSource, playOnBack])

  // Front audio speaks the word as the card arrives. Off by default for this
  // drill: the front is the kanji and the reading is what you are recalling,
  // so hearing it unprompted hands over the answer.
  useEffect(() => {
    if (!playOnFront) return
    playWordAudio(currentCard.word)
    return () => stopWordAudio()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard.id, audioSource, playOnFront])

  useEffect(() => { setFlippedCardId(null) }, [currentCard.id])

  function handleFlip(next) {
    if (sfxEnabled) sfx.play('flip_card')
    setFlippedCardId(next ? currentCard.id : null)
  }

  function handleUndo() {
    if (transitioningRef.current || !canUndo) return
    if (sfxEnabled) sfx.play('undo')
    setFlippedCardId(null)
    setTransitioning(true)
    setExitDir('undo')
    const undoExitDelay  = showVisualEffects ? 200 : 0
    const undoClearDelay = showVisualEffects ? 580 : 0
    setTimeout(() => { onUndo(); setExitDir(null); setUndoEntering(true) }, undoExitDelay)
    setTimeout(() => { setTransitioning(false); setUndoEntering(false) }, undoClearDelay)
  }

  useEffect(() => {
    function onKey(e) {
      if (transitioningRef.current) return
      const t = e.target
      const focusedInteractive = t.tagName === 'BUTTON' || t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA'
      if (focusedInteractive) return
      if (t.classList.contains('fc-hover') && (e.code === 'Space' || e.code === 'Enter')) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (sfxEnabled) sfx.play('flip_card')
        setFlippedCardId(prev => prev === currentCard.id ? null : currentCard.id)
      } else if (e.code === 'KeyZ' && isFlippedRef.current) {
        handleVerdictRef.current(false)
      } else if (e.code === 'KeyX' && isFlippedRef.current) {
        handleVerdictRef.current(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard.id, drill])

  useGamepad({
    onA: () => {
      if (transitioningRef.current) return
      if (isFlippedRef.current) {
        handleVerdictRef.current(true)
      } else {
        if (sfxEnabled) sfx.play('flip_card')
        setFlippedCardId(currentCard.id)
      }
    },
    onB: () => {
      if (transitioningRef.current || !isFlippedRef.current) return
      handleVerdictRef.current(false)
    },
    onLeftShoulder: () => handleUndo(),
    onRightShoulder: () => playWordAudio(currentCard.word),
  })

  let cardClass = ''
  if (showVisualEffects) {
    if (exitDir === 'up') cardClass = 'card-exit-up'
    else if (exitDir === 'down') cardClass = 'card-exit-down'
    else if (exitDir === 'undo') cardClass = 'card-exit-undo'
    else if (undoEntering) cardClass = 'card-entering-undo'
    else if (transitioning) cardClass = 'card-entering'
  }

  return (
    <DrillHUD
      streak={localStreak}
      bestStreak={localBestStreak}
      streakLost={localStreakLost}
      correct={correct}
      troubled={troubled}
      remaining={remaining}
      canUndo={canUndo}
      onUndo={handleUndo}
      showStreak={showStreak}
      showVisualEffects={showVisualEffects}
      isShort={isShort}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isShort ? 8 : 15 }}>
        <div key={currentCard.id} className={cardClass} style={{ transition: 'width 200ms ease' }}>
          <VocabCard
            word={currentCard.word}
            flipped={isFlipped}
            onFlip={handleFlip}
            animate={showVisualEffects}
            reviewMode={reviewMode}
            showFurigana={showFurigana}
            showTranslation={showTranslation}
            showSentence={showSentence}
            showKanjiMeaning={showKanjiMeaning}
            pixelFont={pixelFont}
          />
        </div>
        <SpeedModeControls
          isFlipped={isFlipped}
          transitioning={transitioning}
          onVerdict={v => handleVerdictRef.current(v)}
        />
      </div>
    </DrillHUD>
  )
}

// ── Textbook chapter path ────────────────────────────────────────────────────
//
// The book-featured landing screen for #/vocab once a textbook is chosen —
// this book, its progress, and its chapter list, rather than a bare source
// picker. Ported from the TextbookFlowLabPage concept bench (archive/design-labs): cropped cover,
// the segmented primary (redo lives in its chevron menu), and a gate dialog
// before advancing past a chapter with words still unsent to the SRS.

const HAIRLINE = 'rgba(255,255,255,0.08)'
const DONE_GREY = '#8A8A8A'

function ChapterGlyph({ kind, accent }) {
  const size = 12
  const base = { width: size, height: size, borderRadius: '50%', boxSizing: 'border-box', flexShrink: 0 }
  if (kind === 'done') return <span style={{ ...base, background: DONE_GREY }} />
  if (kind === 'todo') return <span style={{ ...base, border: '1.5px solid rgba(255,255,255,0.3)' }} />
  return <span style={{ ...base, background: accent, boxShadow: `0 0 0 5px ${accent}40` }} />
}

// One chapter row, expandable to its actions — "Continue to next lesson"
// only ever appears on the current row (that's the same gated advance the
// header's segmented primary triggers), and "Set as current" only on a row
// that isn't already the tracker's own.
function ChapterRow({ chapter, isCurrent, hasNext, accent, open, onToggleOpen, onStart, onAdvance, onSetCurrent, onViewWords }) {
  const kind = isCurrent ? 'current' : chapter.drilled ? 'done' : 'todo'
  const meta = [`${chapter.wordCount} words`, chapter.drilled ? 'drilled' : null].filter(Boolean).join(' · ')
  const primaryLabel = isCurrent ? (chapter.drilled ? 'Drill again' : 'Start chapter') : 'Drill chapter'
  return (
    <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
      <div
        className="data-list-row"
        onClick={onToggleOpen}
        style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) auto', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChapterGlyph kind={kind} accent={accent} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: FS_BASE, color: chapter.drilled || isCurrent ? TEXT : TEXT_MUTED }}>{chapter.label}</div>
          <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED, marginTop: 2 }}>{meta}</div>
        </div>
        <span style={{
          display: 'inline-block', color: TEXT_MUTED, fontSize: FS_CAPTION,
          transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 120ms',
        }}>›</span>
      </div>
      {open && (
        <div style={{ padding: '0 14px 12px 54px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button size="sm" onClick={() => onStart(chapter)}>{primaryLabel}</Button>
          <Button size="sm" variant="neutral" onClick={() => onViewWords(chapter)}>View words</Button>
          {isCurrent && chapter.drilled && hasNext && (
            <Button size="sm" variant="accent-outline" onClick={onAdvance}>Continue to next lesson</Button>
          )}
          {!isCurrent && <Button size="sm" variant="ghost" onClick={() => onSetCurrent(chapter.id)}>Set as current</Button>}
        </div>
      )}
    </div>
  )
}

function ChapterList({ chapters, current, hasNext, accent, onStart, onAdvance, onSetCurrent, onViewWords }) {
  const [openId, setOpenId] = useState(current.id)
  return (
    <div style={{ background: '#2A2A2A', border: `1px solid ${HAIRLINE}`, borderRadius: 8, overflow: 'hidden' }}>
      {chapters.map(chapter => (
        <ChapterRow
          key={chapter.id}
          chapter={chapter}
          isCurrent={chapter.id === current.id}
          hasNext={hasNext}
          accent={accent}
          open={openId === chapter.id}
          onToggleOpen={() => setOpenId(id => (id === chapter.id ? null : chapter.id))}
          onStart={onStart}
          onAdvance={onAdvance}
          onSetCurrent={onSetCurrent}
          onViewWords={onViewWords}
        />
      ))}
    </div>
  )
}

function TextbookHomeScreen({ state, accent, onStart, onAdvance, onSetCurrent, onViewWords, onChangeTextbook, onOpenFreeDrill }) {
  const { textbook, chapters, current, next, doneCount, wordsDrilled } = state
  const { label, onClick, menuItems } = chapterPrimaryAction(state, { onStart, onAdvance, onChangeTextbook })

  return (
    <div style={{ width: '100%', maxWidth: 820, margin: '0 auto', padding: '32px 24px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1, minWidth: 260 }}>
          <TextbookCover icon={textbook.icon} accent={accent} onChangeTextbook={onChangeTextbook} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: FS_CONTENT_HEADING, color: TEXT }}>{textbook.title}</div>
            <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, marginTop: 4 }}>
              {doneCount} of {chapters.length} chapters · {wordsDrilled} words drilled
            </div>
            <div style={{ height: 4, borderRadius: 2, background: HAIRLINE, overflow: 'hidden', marginTop: 12 }}>
              <div style={{ height: '100%', width: `${Math.round((doneCount / chapters.length) * 100)}%`, background: accent }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button variant="ghost" size="lg" onClick={onOpenFreeDrill}>Free drill</Button>
          <SegmentedPrimary size="lg" label={label} onClick={onClick} menuItems={menuItems} />
        </div>
      </div>

      <div>
        <SectionHeader title="Chapters" />
        <ChapterList
          chapters={chapters}
          current={current}
          hasNext={!!next}
          accent={accent}
          onStart={onStart}
          onAdvance={onAdvance}
          onSetCurrent={onSetCurrent}
          onViewWords={onViewWords}
        />
      </div>
    </div>
  )
}

// ── Word explorer ─────────────────────────────────────────────────────────────
//
// One modal, two steps: Picker (choose a source + sublists to drill —
// anything other than the featured textbook's own chapters) and Words
// (browse the selected sublists' actual words, kanji breakdown, sentences,
// via the shared WordListContent — see WordListModal.jsx). Previously two
// separate UIs: this same modal picker, whose own Preview button closed
// the modal and swapped the whole page to a full-page GlanceScreen with no
// way back into the picker from there; and a chapter row's "View words",
// which swapped to that same full page directly. Merging them into one
// sheet with a Back button on Words fixes both. Only ever opened from
// within this page (Free drill / a chapter row's View words) — a
// Dictionary entry's "Vocab Drill match" link opens its own copy of
// WordListModal directly in DictionaryEntryPage instead, so looking up a
// word never navigates here at all.
function WordExplorerModal({
  open, step, onClose, onBack, isMobile,
  sourceOptions, selectedSourceId, onSelectSource,
  reviewMode, onChangeReviewMode,
  availableSubLists, selectedSubLists, onToggleSubList,
  wordCountByList, reviewWordCount, includeReview, onToggleIncludeReview,
  sentenceVocabWordCount, includeSentenceVocab, onToggleIncludeSentenceVocab,
  glanceWords, onPreview, onStart,
}) {
  const rows = availableSubLists.map(l => ({ ...l, wordCount: wordCountByList[l.id] ?? 0 }))
  const selected = useMemo(() => new Set(selectedSubLists), [selectedSubLists])
  const totalWords = selectedSubLists.reduce((sum, id) => sum + (wordCountByList[id] ?? 0), 0)
  const canStart = selectedSubLists.length > 0
  const isWords = step === 'words'

  const groups = useMemo(() => {
    const order = selectedSubLists.length > 0 ? selectedSubLists : availableSubLists.map(l => l.id)
    return order.map(listId => ({
      id: listId,
      label: availableSubLists.find(l => l.id === listId)?.label ?? listId,
      words: glanceWords.filter(w => w.listKey === listId),
    }))
  }, [glanceWords, selectedSubLists, availableSubLists])

  const columns = [
    { key: 'label', flex: 1, render: l => l.label },
    { key: 'count', width: 90, align: 'right', tone: 'muted', render: l => `${l.wordCount ?? 0} words` },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isWords ? 'View words' : 'Drill any list'}
      size={isWords ? 'xl' : 'md'}
      isMobile={isMobile}
      footer={
        <>
          {isWords ? (
            <Button variant="neutral" onClick={onBack}>Back</Button>
          ) : (
            <Button variant="neutral" disabled={!canStart} onClick={onPreview}>Preview</Button>
          )}
          <Button disabled={!canStart} onClick={onStart}>
            Start{totalWords ? ` (${totalWords} words)` : ''}
          </Button>
        </>
      }
    >
      {isWords ? (
        <WordListErrorBoundary>
          <WordListContent groups={groups} />
        </WordListErrorBoundary>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED, marginBottom: 4 }}>Word list</div>
              <Select size="md" value={selectedSourceId} onChange={onSelectSource} options={sourceOptions} />
            </div>
            <div>
              <div style={{ fontSize: FS_CAPTION, color: TEXT_MUTED, marginBottom: 4 }}>Drill mode</div>
              <Select size="md" value={reviewMode} onChange={onChangeReviewMode} options={REVIEW_MODE_OPTIONS} />
            </div>
          </div>
          <DataList
            columns={columns}
            rows={rows}
            rowKey={l => l.id}
            selection={{ selected, onToggle: onToggleSubList, bulkHeader: true }}
            maxWidth="100%"
          />
          {reviewWordCount > 0 && (
            <Checkbox checked={includeReview} onChange={onToggleIncludeReview} label={`Include review words (${reviewWordCount})`} />
          )}
          {sentenceVocabWordCount > 0 && (
            <Checkbox checked={includeSentenceVocab} onChange={onToggleIncludeSentenceVocab} label={`Include sentence review words (${sentenceVocabWordCount})`} />
          )}
        </div>
      )}
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
//
// HomeScreen/SubListTile (the source-select + sublist-grid picker that used
// to be #/vocab's unconditional home screen) were deleted here: the only
// live route to them was a textbook-less visit, and nothing in the app's
// own navigation produces one any more — the dashboard's primary card
// gates #/vocab behind picking a textbook first, and a Dictionary entry's
// "Vocab Drill match" link no longer navigates here at all (it opens its
// own copy of the word explorer sheet in place — see WordListModal.jsx).
// VocabPageScreens redirects home for a textbook-less visit, matching
// docs/home-flow-concepts.md's own recommendation ("Bare #/vocab …
// Redirect is simplest").

export default function VocabPage() {
  return (
    <ModuleThemeProvider accent={VOCAB_ACCENT}>
      <VocabPageScreens />
    </ModuleThemeProvider>
  )
}

function VocabPageScreens() {
  const ACCENT = useAccent()
  // A personal source belongs to one account, so the list of sources on offer
  // depends on who is signed in.
  const customCounts = useCustomWordCounts()
  const sourceOptions = useMemo(
    () => visibleSources(customCounts).map(source => ({ value: source.id, label: source.label })),
    [customCounts],
  )
  const { data: vocabProgress, save: saveVocabProgress, loading: vocabProgressLoading } = useProgress('vocab-flashcard')
  const { data: srsData, save: saveSrs } = useProgress('vocab-srs')

  // A learner's own chapters are counted from their account rather than the
  // bundle; everything else comes from the bundled lists — same helper the
  // dashboard's textbook state uses, so the two never disagree on a count.
  const wordCountFor = useCallback(
    id => bundledWordCountFor(id) || (customCounts[id] ?? 0),
    [customCounts],
  )
  // While progress is still loading, vocabProgress is null the same way it
  // would be for a signed-in user with no textbook chosen — without this
  // gate (same pattern as DashboardPage's vocabLoading), a direct visit to
  // #/vocab would incorrectly redirect home (see the effect below) before
  // swapping to the real textbook screen once Supabase responds.
  const textbookState = useMemo(
    () => (vocabProgressLoading ? null : resolveTextbookState(vocabProgress, wordCountFor)),
    [vocabProgressLoading, vocabProgress, wordCountFor],
  )
  const showTextbookScreen = !!textbookState && textbookState.hasWords
  const { gate, unsentWords, suggestedDeck, requestAdvance, skipGate, sendAndAdvance, closeGate, setCurrent: setCurrentChapter } = useTextbookAdvance({
    state: textbookState,
    vocabProgress,
    saveVocabProgress,
    srsData,
    saveSrs,
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  // Free/View-words explorer sheet — see WordExplorerModal. Only ever
  // opened by an explicit click on this page itself (Free drill / View
  // words); a Dictionary entry's "Vocab Drill match" link opens its own
  // copy of this same sheet directly in DictionaryEntryPage instead of
  // navigating here at all (see WordListModal.jsx).
  const [freeDrillOpen, setFreeDrillOpen] = useState(false)
  const [freeDrillStep, setFreeDrillStep] = useState('picker')

  const [showOptions,       setShowOptions]       = useState(() => window.innerWidth > 768)
  const [selectedSourceId,  setSelectedSourceId]  = useState(defaultSelectedSource)
  const [selectedSubLists,  setSelectedSubLists]  = useState(() => {
    const chapter = chapterFromHash()
    return chapter ? [chapter] : []
  })
  const [reviewMode,       setReviewMode]       = useState(() => safeLocalStorageGet('vocab-review-mode') ?? 'kanji-front')
  const [isDrilling,       setIsDrilling]       = useState(() => !!chapterFromHash() && hashQuery().get('start') === '1')
  const { settings, set: setSetting } = useDrillSettings('vocab')
  const anyAudio = settings.frontAudio || settings.backAudio
  const audioSource = anyAudio ? audioSourceForVoice(settings.voice) : 'none'
  const voicevoxCredit = anyAudio ? getVoicevoxCredit(audioSource) : null
  const [includeReview, setIncludeReview] = useState(() => {
    const s = safeLocalStorageGet('vocab-include-review'); return s === null ? true : s === 'true'
  })
  const [includeSentenceVocab, setIncludeSentenceVocab] = useState(() => {
    const s = safeLocalStorageGet('vocab-include-sentence-vocab'); return s === null ? false : s === 'true'
  })
  const [pulseColor,       setPulseColor]       = useState(null)
  const [headerHeight,     setHeaderHeight]     = useState(72)
  const headerRef   = useRef(null)
  const isMobile = useIsMobile()
  const isShort  = useIsShort()
  const jaVoices = useJaVoices()
  const { isProcessing: audioProcessing } = useAudioGenerationStatus()

  useEffect(() => { safeLocalStorageSet('vocab-selected-source', selectedSourceId) }, [selectedSourceId])
  useEffect(() => { safeLocalStorageSet('vocab-review-mode',     reviewMode) },       [reviewMode])
  useEffect(() => { safeLocalStorageSet('vocab-include-review', includeReview) }, [includeReview])
  useEffect(() => { safeLocalStorageSet('vocab-include-sentence-vocab', includeSentenceVocab) }, [includeSentenceVocab])

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeaderHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const availableSubLists = useMemo(() => {
    const source = WORD_SOURCES.find(s => s.id === selectedSourceId)
    return source?.lists ?? [{ id: source?.id, label: source?.label }]
  }, [selectedSourceId])

  // A personal source's words live in the learner's account, not the bundle.
  // The whole selected source is loaded at once — a few hundred words — so
  // counts, the review toggles and the drill all read one pool.
  const personalSource = useMemo(
    () => WORD_SOURCES.find(s => s.id === selectedSourceId)?.personal ?? false,
    [selectedSourceId],
  )
  const customListKeys = useMemo(
    () => (personalSource ? availableSubLists.map(l => l.id) : []),
    [personalSource, availableSubLists],
  )
  const { words: customWords, loading: customWordsLoading } = useCustomWords(customListKeys)
  const wordPool = useMemo(
    () => (customWords.length ? [...WORD_DATA, ...customWords] : WORD_DATA),
    [customWords],
  )

  const reviewWordCount = useMemo(() =>
    wordPool.filter(w => selectedSubLists.includes(w.listKey) && w.isReview).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSubLists.join(','), wordPool]
  )

  const sentenceVocabWordCount = useMemo(() =>
    wordPool.filter(w => selectedSubLists.includes(w.listKey) && w.isSentenceVocab).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSubLists.join(','), wordPool]
  )

  const wordCountByList = useMemo(() => {
    const map = {}
    for (const w of wordPool) {
      if (!includeReview && w.isReview) continue
      if (!includeSentenceVocab && w.isSentenceVocab) continue
      map[w.listKey] = (map[w.listKey] ?? 0) + 1
    }
    return map
  }, [includeReview, includeSentenceVocab, wordPool])

  const glanceWords = useMemo(() =>
    wordPool.filter(w => selectedSubLists.includes(w.listKey) && (includeReview || !w.isReview) && (includeSentenceVocab || !w.isSentenceVocab)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSubLists.join(','), includeReview, includeSentenceVocab, wordPool]
  )

  // Depends on glanceWords itself, not on what glanceWords is derived from: a
  // personal source's words arrive asynchronously, and keying on the selection
  // alone would leave the drill holding the pool from before they loaded.
  const pool = useMemo(() =>
    glanceWords.map(w => ({ id: w.id, word: w })),
    [glanceWords]
  )

  const drill = useDrill(pool, { engine: SimpleQueue })
  // The finish screen's words, most-missed first across every round of the
  // session (a stable sort, so ties keep lesson order).
  const finishRows = useMemo(
    () => drill.sessionPool
      .map(({ id, word }) => ({ id, word, misses: drill.sessionMistakes[id] ?? 0 }))
      .sort((a, b) => b.misses - a.misses),
    [drill.sessionPool, drill.sessionMistakes],
  )
  // The finish screen's Action Bar is two rows and fixed, so the scroller
  // pads by its measured height rather than ACTION_BAR_HEIGHT's one row.
  const [finishBarHeight, setFinishBarHeight] = useState(0)
  // The card-settings sidebar only means anything while a drill is actually
  // on screen — showing it over the chapter list, a preview, or the done
  // screen reads as controls for a card that isn't there.
  const showingDrillSettings = isDrilling && !drill.done

  // Warm the shared dictionary-entry cache for the whole selected pool as
  // soon as it's chosen — well before "Start Drill" — so ActiveDrill/
  // DoneScreen/GlanceScreen's own useDictionaryEntries calls resolve from
  // cache instead of flashing a loading state per card.
  const poolJmdictIds = useMemo(() => pool.map(p => p.word.jmdictId).filter(Boolean), [pool])
  const { entries: poolDictEntries } = useDictionaryEntries(poolJmdictIds, true)
  const poolSenseGlosses = useSenseGlosses(useMemo(() => pool.map(p => p.word), [pool]))

  useEffect(() => {
    if (window.location.hash.includes('?')) window.history.replaceState(null, '', '#/vocab')
  }, [])

  // Nothing in the app's own navigation sends a visitor to #/vocab with no
  // textbook chosen at all — the dashboard's card gates that behind the
  // picker, and a Dictionary entry's "Vocab Drill match" no longer
  // navigates here at all (it opens its own copy of the word explorer
  // sheet in place — see WordListModal.jsx). Redirect home rather than
  // show a blank page. This deliberately checks textbookState, not
  // showTextbookScreen: a chosen textbook with no words yet still has its
  // own "View all" link from the dashboard's NewCard, and redirecting that
  // case straight back home would be a click-and-bounce loop — that state
  // gets its own small message below.
  useEffect(() => {
    if (!vocabProgressLoading && !textbookState && !isDrilling) {
      window.location.hash = '#/'
    }
  }, [vocabProgressLoading, textbookState, isDrilling])

  // Save the score once per session, when its first pass ends — that pass
  // is the lesson's score (see drillScore.js). The rounds after it only work
  // through the misses; saving each of those used to overwrite a real 14/20
  // with a clean-but-meaningless 2/20. Not gated on sign-in: useProgress
  // falls back to localStorage when logged out, and the dashboard's chapter
  // pointer needs drilled state either way. A session over just the troubled
  // words ("Drill 6 troubled again") isn't the lesson, so it isn't saved.
  const savedSessionRef = useRef(null)
  const [previousRuns, setPreviousRuns] = useState([])
  useEffect(() => {
    // pool.length === 0 also covers the moment a deep-linked personal
    // chapter's drill.done is briefly (and wrongly) true before its async
    // word fetch resolves — see the customWordsLoading guard above. Without
    // it this fired with total: 0 and marked the chapter drilled before a
    // single card had been shown.
    if (!isDrilling || !drill.done || pool.length === 0) return
    if (drill.round !== 1 || drill.sessionPool.length !== pool.length) return
    if (savedSessionRef.current === drill.sessionId) return
    savedSessionRef.current = drill.sessionId
    const { firstTry, total } = sessionScore(drill.sessionPool, drill.sessionMistakes)
    const { progress, previousRuns: runs } = recordFirstPass(vocabProgress, {
      listIds: selectedSubLists, mode: reviewMode, firstTry, total, at: new Date().toISOString(),
    })
    setPreviousRuns(runs)
    saveVocabProgress(progress)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drill.done, drill.round, drill.sessionId, isDrilling, pool.length])

  // The deck the finish screen's picker suggests first: one per book, the
  // same one the advance gate fills — so adding there also clears that gate
  // for the chapter. A free drill outside any textbook suggests a deck named
  // after its word source.
  function reviewDeckForDrill() {
    const book = TEXTBOOKS.find(t => t.chapters.some(ch => selectedSubLists.includes(ch.id)))
    if (book) return textbookDeck(book)
    const source = WORD_SOURCES.find(src => src.id === selectedSourceId)
    return { deckId: `source-${selectedSourceId}`, deckName: source?.label ?? 'Vocab Drill' }
  }

  function handleAddToReview(words, { deckId, newDeckName }) {
    const decks = srsData?.decks ?? {}
    // A new deck only needs its fresh id here — addWordsToSrs creates it.
    const targetId = newDeckName ? createDeck(decks, newDeckName).deckId : deckId
    const deckName = newDeckName ?? decks[targetId]?.name ?? reviewDeckForDrill().deckName
    const result = addWordsToSrs(srsData, words, targetId, deckName, poolDictEntries, poolSenseGlosses)
    saveSrs(result.data)
    return result
  }

  function handleUndoAdd(cardIds) {
    const current = srsData ?? { decks: {}, cards: {}, lastSession: null, totalReviews: 0, newCardDay: { date: '', count: 0 } }
    saveSrs({ ...current, cards: deleteCards(current.cards, cardIds) })
  }

  function handleSelectSource(sourceId) {
    if (sourceId === selectedSourceId) return
    setSelectedSourceId(sourceId)
    setSelectedSubLists([])
  }

  // See DashboardPage's chooseTextbook for why the pointer is pinned to the
  // first chapter here rather than left null.
  function chooseTextbook(id) {
    saveVocabProgress({ ...(vocabProgress ?? {}), textbook: { id, currentChapterId: getTextbook(id)?.chapters[0]?.id ?? null } })
  }

  // The tracker itself never moves from starting a drill — only from
  // advanceCurrentChapter's deliberate, gated step below.
  function startChapterDrill(chapter) {
    setSelectedSourceId(sourceIdForListKey(chapter.id))
    setSelectedSubLists([chapter.id])
    // Same chapter as last time means the same pool, which useDrill won't
    // re-init by itself — without this, a second visit opens on the finish.
    drill.restart()
    setIsDrilling(true)
  }

  function viewChapterWords(chapter) {
    setSelectedSourceId(sourceIdForListKey(chapter.id))
    setSelectedSubLists([chapter.id])
    setFreeDrillStep('words')
    setFreeDrillOpen(true)
  }

  function openFreeDrillPicker() {
    setFreeDrillStep('picker')
    setFreeDrillOpen(true)
  }

  function advanceCurrentChapter() {
    const next = textbookState?.next
    if (!next) return
    requestAdvance(next, () => startChapterDrill(next))
  }

  // Rendered only when there is something to credit — an empty footnote block
  // would still occupy space under the audio group.
  const audioFootnote = (voicevoxCredit || audioProcessing) ? (
    <>
      {voicevoxCredit && <div>{renderAttributionSegments(voicevoxCredit)}</div>}
      {audioProcessing && <div>Audio is being generated</div>}
    </>
  ) : null

  function renderPanelContent(paddingH) {
    return (
      <div style={{ padding: `16px ${paddingH}px 16px` }}>
        <DrillSettingsPanel
          settings={settings}
          onChange={setSetting}
          backupVoices={jaVoices}
          audioFootnote={audioFootnote}
        />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      position: 'relative',
      width: '100vw',
      height: '100dvh',
      background: '#1E1E1E',
      fontFamily: FONT,
      letterSpacing: TRACKING,
      overflow: 'hidden',
    }}>

      {/* ── Main content area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>

        {/* Verdict pulse */}
        <div
          className={settings.visualEffects && pulseColor ? `stage-pulse-${pulseColor}` : ''}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
        />

        {/* Header */}
        <div ref={headerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <PageHeader
            crumbs={
              isDrilling
                ? [{ label: 'Lantern', href: '#/' }, { label: 'Vocabulary', onClick: () => setIsDrilling(false) }, { label: 'Reviewing' }]
                : [{ label: 'Lantern', href: '#/' }, { label: 'Vocabulary' }]
            }
            rightSlot={(
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AuthSlot />
                {isMobile && showingDrillSettings && <SidebarHeaderToggle onClick={() => setShowOptions(true)} />}
              </div>
            )}
          />
          {isDrilling && !drill.done && (
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{
                height: '100%',
                width: `${(drill.correct + drill.remaining) > 0 ? (drill.correct / (drill.correct + drill.remaining)) * 100 : 0}%`,
                background: ACCENT,
                transition: 'width 300ms ease',
              }} />
            </div>
          )}
        </div>

        {/* Center content */}
        <div style={{
          position: 'absolute', top: headerHeight, left: 0, right: 0,
          height: `calc(100dvh - ${headerHeight}px)`,
          overflowY: 'auto', scrollbarGutter: 'stable both-edges',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingBottom: isDrilling ? finishBarHeight : 0, boxSizing: 'border-box',
          zIndex: 2,
        }}>
          <div style={{
            flex: 1, width: '100%',
            display: 'flex', alignItems: isDrilling ? 'center' : 'flex-start', justifyContent: 'center',
            minHeight: 'min-content',
          }}>
            {isDrilling ? (
              // A personal chapter's words are fetched from the account, not the
              // bundle — reachable here before that fetch settles when a deep
              // link (dashboard "Start"/"Next chapter") jumps straight into the
              // drill. Without this guard the empty pool reads as `drill.done`
              // and flashes a 0-card done screen before the real cards arrive.
              personalSource && customWordsLoading ? (
                <CenteredLoadingMessage text="Loading words" />
              ) : drill.done && drill.troubled > 0 ? (
                <RoundBreak
                  key={`${drill.sessionId}-${drill.round}`}
                  round={drill.round}
                  correct={drill.sessionPool.length - drill.troubled}
                  troubled={drill.troubled}
                  onContinue={drill.redoTroubled}
                  onEnd={() => setIsDrilling(false)}
                />
              ) : drill.done ? (
                <LessonCleared
                  key={drill.sessionId}
                  rows={finishRows}
                  previousRuns={drill.sessionPool.length === pool.length ? previousRuns : []}
                  practice={drill.sessionPool.length < pool.length}
                  isMobile={isMobile}
                  decks={srsData?.decks ?? {}}
                  suggestedDeck={reviewDeckForDrill()}
                  onAddToReview={handleAddToReview}
                  onUndoAdd={handleUndoAdd}
                  onDrillAgain={drill.restart}
                  onDrillTroubled={ids => drill.redoSelection(drill.sessionPool.filter(spec => ids.includes(spec.id)))}
                  onEnd={() => setIsDrilling(false)}
                  onBarHeight={setFinishBarHeight}
                />
              ) : (
                <ActiveDrill
                  drill={drill}
                  audioSource={audioSource}
                  playOnFront={settings.frontAudio}
                  playOnBack={settings.backAudio}
                  sfxEnabled={settings.sfx}
                  ttsVoice={settings.backupVoice}
                  showStreak={settings.streak}
                  reviewMode={reviewMode}
                  showFurigana={settings.furigana}
                  showTranslation={settings.translation}
                  showSentence={settings.sentence}
                  showKanjiMeaning={settings.kanjiMeanings}
                  pixelFont={settings.pixelFont}
                  showVisualEffects={settings.visualEffects}
                  onPulse={setPulseColor}
                  isShort={isShort}
                />
              )
            ) : vocabProgressLoading ? (
              <CenteredLoadingMessage text="Loading" />
            ) : showTextbookScreen ? (
              <TextbookHomeScreen
                state={textbookState}
                accent={ACCENT}
                onStart={startChapterDrill}
                onAdvance={advanceCurrentChapter}
                onSetCurrent={setCurrentChapter}
                onViewWords={viewChapterWords}
                onChangeTextbook={() => setPickerOpen(true)}
                onOpenFreeDrill={openFreeDrillPicker}
              />
            ) : textbookState ? (
              // A textbook is chosen but this account has no words for it yet
              // (see homeCards.jsx's matching "No words for this book yet"
              // card) — reachable via that card's own "View all" link, so
              // this can't just redirect home like the no-textbook-at-all
              // case above without bouncing that click straight back.
              <div style={{ width: '100%', maxWidth: CONTENT_STANDARD, margin: '0 auto', padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: FS_BASE, color: TEXT_MUTED }}>No words for this book yet.</div>
                <Button onClick={() => setPickerOpen(true)}>Change textbook</Button>
              </div>
            ) : null}
          </div>
          <AttributionFooter sources={[
            'dictionary',
            'tanaka-corpus',
            ...(speakerIdFromAudioSource(audioSource) ? ['voicevox'] : []),
          ]} />
        </div>
      </div>

      {showingDrillSettings && (
        <SettingsSidebar
          open={showOptions}
          onToggle={() => setShowOptions(v => !v)}
          onClose={() => setShowOptions(false)}
          isMobile={isMobile}
        >
          {paddingH => renderPanelContent(paddingH)}
        </SettingsSidebar>
      )}

      <TextbookPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentId={textbookState?.textbook.id ?? null}
        onSelect={chooseTextbook}
        wordCountFor={wordCountFor}
      />
      <SrsGateDialog
        gate={gate}
        chapterLabel={textbookState?.current?.label}
        unsentCount={unsentWords.length}
        totalCount={textbookState?.current?.wordCount}
        onCancel={closeGate}
        onSkip={skipGate}
        onSend={sendAndAdvance}
        decks={srsData?.decks ?? {}}
        suggestedDeck={suggestedDeck}
        isMobile={isMobile}
      />
      <WordExplorerModal
        open={freeDrillOpen}
        step={freeDrillStep}
        onClose={() => setFreeDrillOpen(false)}
        onBack={() => setFreeDrillStep('picker')}
        isMobile={isMobile}
        sourceOptions={sourceOptions}
        selectedSourceId={selectedSourceId}
        onSelectSource={handleSelectSource}
        reviewMode={reviewMode}
        onChangeReviewMode={setReviewMode}
        availableSubLists={availableSubLists}
        selectedSubLists={selectedSubLists}
        onToggleSubList={id => setSelectedSubLists(prev => toggle(prev, id))}
        wordCountByList={wordCountByList}
        reviewWordCount={reviewWordCount}
        includeReview={includeReview}
        onToggleIncludeReview={() => setIncludeReview(v => !v)}
        sentenceVocabWordCount={sentenceVocabWordCount}
        includeSentenceVocab={includeSentenceVocab}
        onToggleIncludeSentenceVocab={() => setIncludeSentenceVocab(v => !v)}
        glanceWords={glanceWords}
        onPreview={() => setFreeDrillStep('words')}
        onStart={() => { setFreeDrillOpen(false); drill.restart(); setIsDrilling(true) }}
      />

    </div>
  )
}

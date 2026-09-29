import { useState, useEffect, useRef } from 'react'
import FlipCard from '../../FlipCard.jsx'
import CardWord from '../../components/CardWord.jsx'
import CardDetails from '../../components/CardDetails.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { SidebarHeaderToggle } from '../../components/SettingsSidebar.jsx'
import Button from '../../components/Button.jsx'
import DrillHUD from '../../components/DrillHUD.jsx'
import DrillButtonRow, { DrillButton, DrillFlipButton } from '../../components/DrillButton.jsx'
import DrillActionBar from '../../components/DrillActionBar.jsx'
import { FONT, TRACKING, TEXT, TEXT_MUTED, FS_BASE, FS_DISPLAY_HEADING, FS_STAT_VALUE, FS_CAPTION, WARNING, DRILL_COLORS, LANTERN_ON, LANTERN_SIZES } from '../../data/theme.js'
import { useAccent } from '../../context/ModuleThemeContext.jsx'
import { Rating } from './srs.js'
import { answerCard, undoLastAnswer, isComplete, getSessionStats, getCurrentCard } from './session.js'
import { useTTS } from '../../hooks/useTTS.js'
import { useSFX } from '../../hooks/useSFX.js'
import { useGamepad } from '../../hooks/useGamepad.js'
import { useVoicevoxPlayer, SENTENCE_GAP } from '../../hooks/useVoicevoxPlayer.js'
import { getVoicevoxAudioUrl, speakerIdFromAudioSource } from '../../utils/voicevoxAudio.js'
import { cardSpeechText } from '../../lib/displayForm.js'
import { useDictionaryEntry } from '../../hooks/useDictionaryEntries.js'
import { briefGloss } from '../../utils/dictionaryEntryLookup.js'
import { useSentenceForWord } from '../../hooks/useSentenceForWord.js'
import { useTurnedOn } from '../../hooks/useTurnedOn.js'
import { fetchSentencesFor } from '../../utils/sentenceLookup.js'
import { useCardSentence, usePrefetchCardDetails } from '../../hooks/useCardSentence.js'
import { useDrillEntrance } from '../../hooks/useDrillEntrance.js'
import { useDrillCardSize } from '../../hooks/useDrillCardSize.js'
import { detailsSlot } from '../../components/cardDetailsSlot.js'
import AttributionFooter from '../../components/AttributionFooter.jsx'
import { getMainTextScale, getSecondaryTextScale, cqw } from '../../utils/cardTextFit.js'

const CARD_BG = '#E8E4DE'
// Advance timings mirror VocabPage's verdict handler: the answered card slides/fades out
// via FlipCard.css's cardExit* keyframes, then the next card's own content mounts fresh
// (no 3D flip-back) via cardEnter — a single continuous motion instead of un-flipping the
// current card back to its own front before jump-cutting to the next one.
const EXIT_MS = 280
const CLEAR_MS = 600
const UNDO_EXIT_MS = 200
const UNDO_CLEAR_MS = 580

const AUDIO_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/audio/imported`
  : null

function getAudioUrl(filename) {
  return filename && AUDIO_BASE ? `${AUDIO_BASE}/${filename}` : null
}

function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// The card itself carries the word, its reading and its meaning. The example
// sentence and the kanji breakdown moved into the details panel under it
// (CardDetails), shared with Vocab Drill.
function SrsCardFace({ text, kana, isBack, backText, jmdictId, showFurigana, showTranslation, readingPosition, pixelFont }) {
  const cardFont = pixelFont ? FONT : 'system-ui, sans-serif'

  // Dictionary is the source of truth for the definition when this card is
  // linked (jmdictId); the card's own `back` text is only a fallback for cards
  // that don't have (or don't yet have) a dictionary match.
  const { entry: dictEntry } = useDictionaryEntry(jmdictId, true)
  const resolvedBackText = briefGloss(dictEntry) ?? backText

  const mainScale = getMainTextScale(text)
  const secondaryScale = getSecondaryTextScale({ translation: isBack && showTranslation ? resolvedBackText : null })

  return (
    <div style={{ backgroundColor: CARD_BG, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5cqw', padding: '0 20px', boxSizing: 'border-box' }}>
      <CardWord form={text} reading={kana} showReading={isBack || showFurigana} readingPosition={readingPosition} jaFont={cardFont} scale={mainScale} />
      {isBack && resolvedBackText && showTranslation && (
        <div style={{
          fontFamily: cardFont,
          fontSize: cqw(5.26, secondaryScale),
          color: '#555',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {resolvedBackText}
        </div>
      )}
    </div>
  )
}

// brand/BRAND.md §4: "Session complete | three lamp-on at 48px in a row,
// then the existing stats." Static — the lantern doesn't animate here.
function DoneLanterns() {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
      {[0, 1, 2].map(i => (
        <img key={i} src={LANTERN_ON} alt="" width={LANTERN_SIZES.card} height={LANTERN_SIZES.card} style={{ display: 'block', imageRendering: 'pixelated' }} />
      ))}
    </div>
  )
}

function DoneScreen({ stats, onDone }) {
  return (
    <div style={{ textAlign: 'center', fontFamily: FONT, letterSpacing: TRACKING }}>
      <DoneLanterns />
      <div style={{ color: TEXT, fontSize: FS_DISPLAY_HEADING, marginBottom: 16 }}>Session complete</div>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ color: TEXT_MUTED, fontSize: FS_CAPTION, marginBottom: 4 }}>REVIEWED</div>
          <div style={{ color: TEXT, fontSize: FS_STAT_VALUE }}>{stats.goodCount}</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: FS_STAT_VALUE, alignSelf: 'center' }}>·</div>
        <div>
          <div style={{ color: stats.againCount > 0 ? WARNING : TEXT_MUTED, fontSize: FS_CAPTION, marginBottom: 4 }}>AGAIN</div>
          <div style={{ color: stats.againCount > 0 ? WARNING : TEXT_MUTED, fontSize: FS_STAT_VALUE }}>{stats.againCount}</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: FS_STAT_VALUE, alignSelf: 'center' }}>·</div>
        <div>
          <div style={{ color: TEXT_MUTED, fontSize: FS_CAPTION, marginBottom: 4 }}>TIME</div>
          <div style={{ color: TEXT, fontSize: FS_STAT_VALUE }}>{formatTime(stats.elapsedSeconds)}</div>
        </div>
      </div>
      {stats.againCount > 0 && (
        <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, marginBottom: 24 }}>
          You missed {stats.againCount} {stats.againCount === 1 ? 'card' : 'cards'} — all cleared by end of session
        </div>
      )}
      <Button variant="neutral" size="lg" onClick={onDone}>Done</Button>
    </div>
  )
}

export default function VocabSrsDrill({
  initialCards, initialSession, onCardSave, onDone,
  showTranslation = true, showFurigana = true, settings, onChangeSetting, knownIds, related, srsData, saveSrs,
  pixelFont = true, showVisualEffects = true, showStreak = false,
  audioEnabled = true, autoplayFront = true, autoplayBack = true, playSentence = false,
  audioSource = 'voicevox-9', sfxEnabled = true, ttsVoice = '',
  showHardEasy = true, leechThreshold = 8,
  isMobile = false, onShowOptions,
  crumbs = [{ label: 'Lantern', href: '#/' }],
}) {
  const [session, setSession] = useState(initialSession)
  const [localCards, setLocalCards] = useState(initialCards)
  const [flipped, setFlipped] = useState(false)
  const { edgeToEdge, width: cardWidth } = useDrillCardSize()
  const ACCENT = useAccent()
  const [leechNotice, setLeechNotice] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [exitDir, setExitDir] = useState(null)
  const [undoEntering, setUndoEntering] = useState(false)

  // Force re-render every second so waitUntil countdowns and card availability update.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const tts = useTTS(ttsVoice)
  const sfx = useSFX()
  const voicevox = useVoicevoxPlayer()

  // Priority: real recorded audio (imported Anki decks) > generated Voicevox audio > browser TTS.
  function resolveAudioUrl(card) {
    if (!card) return { word: null, sentence: null, sentenceText: null }
    // Resolved only for the current card, which is the only one that plays.
    const sentenceText = (card.jmdictId && card.jmdictId === currentCardForMemo?.jmdictId ? currentTanakaSentence?.japanese : null) ?? null
    // Generated clips are keyed by what is spoken, so a card derives its own
    // URL from its reading and needs no record of which clips exist. A card
    // whose clip has not been generated 404s and falls back to TTS.
    // cardSpeechText, not the raw reading: a card copied from a list keeps the
    // list's decoration (しんこく（な）), which generate-audio.mjs strips before
    // recording, so the raw reading names a clip that never exists.
    const speakerId = speakerIdFromAudioSource(audioSource)
    const sentence = speakerId && sentenceText ? getVoicevoxAudioUrl(speakerId, sentenceText) : null
    if (card.wordAudio) return { word: getAudioUrl(card.wordAudio), sentence, sentenceText }
    if (speakerId) return { word: getVoicevoxAudioUrl(speakerId, cardSpeechText(card)), sentence, sentenceText }
    return { word: null, sentence: null, sentenceText }
  }

  const seenRef = useRef(new Set())
  const flippedRef = useRef(false)
  flippedRef.current = flipped
  const transitioningRef = useRef(false)
  useEffect(() => { transitioningRef.current = transitioning }, [transitioning])

  // Web Audio API playback (via the shared useVoicevoxPlayer hook), not
  // HTMLMediaElement.play() — the latter re-checks the browser's
  // autoplay/user-activation policy on every call, and a gamepad button press
  // never grants user activation per spec, so play() intermittently rejected
  // and silently fell back to TTS even when the Voicevox clip existed (the
  // same bug VocabPage's useVoicevoxPlayer.js was built to fix; this module
  // just hadn't been migrated to it). The old pause()-on-supersede approach
  // also raced: pausing an in-flight <audio> before its 'playing' event fired
  // aborted its play() promise and looked exactly like a failed clip, which
  // is why undoing/re-showing a card intermittently played TTS too — the
  // hook's token-based cancellation treats a superseded in-flight play as
  // "not a failure" instead.
  // These take resolved URLs directly (not filenames) so they work for both
  // the imported-audio bucket (via getAudioUrl) and the voicevox bucket (via getVoicevoxAudioUrl).

  // The clip first, the backup voice when there is no clip or it fails to
  // load. `sequence` also plays the sentence after the word, when the Sentence
  // audio setting is on.
  async function playSentenceText(text, { delay = SENTENCE_GAP } = {}) {
    const speakerId = speakerIdFromAudioSource(audioSource)
    const url = speakerId ? getVoicevoxAudioUrl(speakerId, text) : null
    if (!url || !await voicevox.play(url, { delay })) tts.speak(text)
  }

  async function speakCard(card, urls, { sequence } = {}) {
    if (!card) return
    if (!urls.word) { voicevox.stop(); tts.speak(cardSpeechText(card) ?? ''); return }
    // The text is looked up when the word ends, not taken from the flip-time
    // snapshot: a card flipped before its sentence lookup returned would
    // otherwise chain nothing. The lookup is cached, so this is instant after
    // the first card view.
    const chainSentence = sequence && playSentence && card.jmdictId
      ? async () => {
          const text = urls.sentenceText ?? (await fetchSentencesFor([card.jmdictId]))[card.jmdictId]?.japanese
          if (!text || !flippedRef.current || getCurrentCard(sessionRef.current)?.id !== card.id) return
          playSentenceText(text)
        }
      : undefined
    const played = await voicevox.play(urls.word, { onEnded: chainSentence })
    if (!played) tts.speak(cardSpeechText(card) ?? '')
  }

  // The details panel's sentence (the same Tanaka sentence Sentence audio
  // plays after the word), and what its replay button says.
  const panelCard = getCurrentCard(session)
  const sentenceOn = !!settings && settings.details && settings.sentence
  const sentence = useCardSentence({
    jmdictId: panelCard?.jmdictId, form: panelCard?.front, reading: panelCard?.kana,
    enabled: sentenceOn && !!panelCard,
  })
  usePrefetchCardDetails(session.queue?.slice(0, 3).map(c => ({ jmdictId: c.jmdictId, form: c.front })) ?? [], !!settings?.details)
  const sentenceRef = useRef(null)
  sentenceRef.current = sentenceOn && sentence ? sentence : null

  // The session's first card and the panel under it arrive together, once
  // the panel has its sentence and kanji meanings.
  const [panelReady, setPanelReady] = useState(false)
  const entered = useDrillEntrance(panelReady || !settings || !panelCard?.front)

  function replaySentence() {
    const text = sentenceRef.current?.japanese
    if (!text) return
    tts.cancel()
    playSentenceText(text, { delay: 0 })
  }

  const sessionRef = useRef(session)
  sessionRef.current = session
  const localCardsRef = useRef(localCards)
  localCardsRef.current = localCards

  const handleAnswerRef = useRef()
  handleAnswerRef.current = (rating) => {
    if (transitioningRef.current) return
    const currentCard = getCurrentCard(sessionRef.current)
    if (!currentCard) return
    if (sfxEnabled) sfx.play(rating === Rating.Again ? 'flip_card_wrong' : 'flip_card_correct')
    tts.cancel()
    voicevox.stop()
    seenRef.current.add(currentCard.id)
    const { session: newSession, updatedCard, isLeech } = answerCard(
      sessionRef.current, currentCard, rating, { leechThreshold }
    )
    setTransitioning(true)
    setExitDir(rating === Rating.Again ? 'down' : 'up')
    const exitDelay = showVisualEffects ? EXIT_MS : 0
    const clearDelay = showVisualEffects ? CLEAR_MS : 0
    setTimeout(() => {
      const updatedCards = localCardsRef.current.map(c => c.id === updatedCard.id ? updatedCard : c)
      setLocalCards(updatedCards)
      setSession(newSession)
      setFlipped(false)
      onCardSave(updatedCards, rating === Rating.Again ? 0 : 1)
      if (isLeech) {
        setLeechNotice(currentCard.front)
        setTimeout(() => setLeechNotice(null), 4000)
      }
      setExitDir(null)
    }, exitDelay)
    setTimeout(() => setTransitioning(false), clearDelay)
  }

  const handleFlipRef = useRef()
  handleFlipRef.current = () => {
    if (transitioningRef.current) return
    if (sfxEnabled) sfx.play('flip_card')
    const currentCard = getCurrentCard(sessionRef.current)
    if (audioEnabled && autoplayBack && currentCard) {
      speakCard(currentCard, resolveAudioUrl(currentCard), { sequence: true })
    }
    setFlipped(true)
  }

  const handleUndoRef = useRef()
  handleUndoRef.current = () => {
    if (transitioningRef.current) return
    const { session: prevSession, revertedCard } = undoLastAnswer(sessionRef.current)
    if (prevSession === sessionRef.current) return
    voicevox.stop()
    setTransitioning(true)
    setExitDir('undo')
    const exitDelay = showVisualEffects ? UNDO_EXIT_MS : 0
    const clearDelay = showVisualEffects ? UNDO_CLEAR_MS : 0
    setTimeout(() => {
      if (revertedCard) {
        seenRef.current.delete(revertedCard.id)
        const revertedCards = localCardsRef.current.map(c => c.id === revertedCard.id ? revertedCard : c)
        setLocalCards(revertedCards)
        // Undo can only revert the most recent answer, so a goodCount drop
        // between the two sessions means that answer was Again (uncounted) —
        // wasReviewed here means the opposite, that it was counted and must
        // now be un-counted.
        const wasReviewed = prevSession.goodCount < sessionRef.current.goodCount
        onCardSave(revertedCards, wasReviewed ? -1 : 0)
      }
      setSession(prevSession)
      setFlipped(false)
      setExitDir(null)
      setUndoEntering(true)
    }, exitDelay)
    setTimeout(() => { setTransitioning(false); setUndoEntering(false) }, clearDelay)
  }

  const handleReplayRef = useRef()
  handleReplayRef.current = () => {
    const currentCard = getCurrentCard(sessionRef.current)
    if (!currentCard || !audioEnabled) return
    speakCard(currentCard, resolveAudioUrl(currentCard), { sequence: flippedRef.current })
  }

  useGamepad({
    onA: () => {
      if (!flippedRef.current) {
        handleFlipRef.current()
      } else {
        handleAnswerRef.current(Rating.Good)
      }
    },
    onB: () => {
      if (flippedRef.current) handleAnswerRef.current(Rating.Again)
    },
    onX: () => {
      if (flippedRef.current && showHardEasy) handleAnswerRef.current(Rating.Easy)
    },
    onY: () => {
      if (flippedRef.current && showHardEasy) handleAnswerRef.current(Rating.Hard)
    },
    onLeftShoulder: () => handleUndoRef.current(),
    onRightShoulder: () => handleReplayRef.current(),
  })

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!flippedRef.current) handleFlipRef.current()
        return
      }
      if (e.code === 'KeyZ') { handleUndoRef.current(); return }
      if (!flippedRef.current) return
      if (e.code === 'Digit1' || e.code === 'KeyJ') handleAnswerRef.current(Rating.Again)
      if (showHardEasy) {
        if (e.code === 'Digit2' || e.code === 'KeyH') handleAnswerRef.current(Rating.Hard)
        if (e.code === 'Digit3' || e.code === 'KeyK') handleAnswerRef.current(Rating.Good)
        if (e.code === 'Digit4' || e.code === 'KeyE') handleAnswerRef.current(Rating.Easy)
      } else {
        if (e.code === 'Digit2' || e.code === 'KeyK') handleAnswerRef.current(Rating.Good)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showHardEasy])

  // Must be before the isComplete early return — hooks cannot be called conditionally.
  const currentCardForMemo = getCurrentCard(session)
  const currentTanakaSentence = useSentenceForWord(currentCardForMemo?.jmdictId, playSentence)

  // Preload the current card's audio as soon as the card appears.
  useEffect(() => {
    const urls = resolveAudioUrl(currentCardForMemo)
    const desired = [urls.word, playSentence ? urls.sentence : null].filter(Boolean)
    voicevox.trimPreload(desired)
    desired.forEach(url => voicevox.preload(url))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCardForMemo?.id, audioSource, playSentence, currentTanakaSentence])

  // Auto-play word audio on the front when a new card appears.
  useEffect(() => {
    if (!audioEnabled || !autoplayFront) return
    const urls = resolveAudioUrl(currentCardForMemo)
    voicevox.stop()
    const t = setTimeout(() => {
      if (flippedRef.current) return
      speakCard(currentCardForMemo, urls)
    }, 50)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCardForMemo?.id])

  // Switching voice replays the current face in the new one, so the choice can
  // be heard — whatever the per-face autoplay says. Only a change between two
  // recorded voices counts: audio turning on also changes audioSource (from
  // 'none'), and playing the word then would give away the front.
  // Switching an audio setting on plays what it would play, so it can be heard:
  // front Audio the word, back Audio the word (and sentence) when flipped,
  // Sentence audio the sentence when flipped. Back-face settings stay silent
  // on the front, where they would give the word away. The sentence lookup is
  // awaited directly because the setting being off kept it from fetching.
  useTurnedOn(autoplayFront, () => {
    speakCard(currentCardForMemo, resolveAudioUrl(currentCardForMemo))
  })
  useTurnedOn(autoplayBack, () => {
    if (flippedRef.current) speakCard(currentCardForMemo, resolveAudioUrl(currentCardForMemo), { sequence: true })
  })
  useTurnedOn(playSentence, async () => {
    const card = currentCardForMemo
    if (!flippedRef.current || !card?.jmdictId) return
    const text = (await fetchSentencesFor([card.jmdictId]))[card.jmdictId]?.japanese
    if (!text || !flippedRef.current || getCurrentCard(sessionRef.current)?.id !== card.id) return
    tts.cancel()
    playSentenceText(text, { delay: 0 })
  })

  const prevAudioSourceRef = useRef(audioSource)
  useEffect(() => {
    const prev = prevAudioSourceRef.current
    prevAudioSourceRef.current = audioSource
    if (prev === audioSource || !speakerIdFromAudioSource(prev) || !speakerIdFromAudioSource(audioSource)) return
    speakCard(currentCardForMemo, resolveAudioUrl(currentCardForMemo), { sequence: flippedRef.current })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource])

  const drillCrumbs = [...crumbs, { label: 'Review' }]

  // Definitions/kanji meanings and Tanaka sentences shown on the card itself are
  // real reproduced JMdict/KANJIDIC2/Tanaka Corpus content, not just an internal
  // link — this screen needs its own credit rather than relying on one shown
  // back on the deck-management screen. Voicevox is added only when it's the
  // active audio source, mirroring the contextual credit under the TTS picker.
  const activeVoicevoxSpeakerId = audioEnabled ? speakerIdFromAudioSource(audioSource) : null
  const footerSources = [
    'dictionary',
    'tanaka-corpus',
    ...(activeVoicevoxSpeakerId ? ['voicevox'] : []),
  ]

  if (isComplete(session)) {
    const stats = getSessionStats(session)
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1E1E1E',
        fontFamily: FONT,
        letterSpacing: TRACKING,
        color: TEXT,
      }}>
        <PageHeader
          crumbs={drillCrumbs}
          rightSlot={isMobile && onShowOptions && <SidebarHeaderToggle onClick={onShowOptions} />}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DoneScreen stats={stats} onDone={() => onDone(localCards)} />
        </div>
        <AttributionFooter sources={footerSources} />
      </div>
    )
  }

  const currentCard = getCurrentCard(session)
  const stats = getSessionStats(session)
  const progressPct = stats.total > 0 ? (stats.goodCount / stats.total) * 100 : 0

  // Correct/troubled/remaining are tracked by DrillHUD below the card
  // (see the isComplete early return above for the same pattern) — the
  // header carries only the mobile settings toggle, not a second counter.
  const rightSlot = isMobile && onShowOptions && <SidebarHeaderToggle onClick={onShowOptions} />

  const isRequeue = currentCard && seenRef.current.has(currentCard.id)
  // Undo leads the button row on both faces, in place of DrillHUD's own line.
  const undo = { onClick: () => handleUndoRef.current(), disabled: !stats.canUndo || transitioning }

  const readingPosition = settings?.readingPosition ?? 'below'
  const front = currentCard
    ? <SrsCardFace text={currentCard.front} kana={currentCard.kana} isBack={false} showFurigana={showFurigana} backText={currentCard.back} jmdictId={currentCard.jmdictId} showTranslation={showTranslation} readingPosition={readingPosition} pixelFont={pixelFont} />
    : null
  const back = currentCard
    ? <SrsCardFace text={currentCard.front} kana={currentCard.kana} isBack={true} showFurigana={showFurigana} backText={currentCard.back} jmdictId={currentCard.jmdictId} showTranslation={showTranslation} readingPosition={readingPosition} pixelFont={pixelFont} />
    : null

  let cardClass = ''
  if (showVisualEffects) {
    if (exitDir === 'up') cardClass = 'card-exit-up'
    else if (exitDir === 'down') cardClass = 'card-exit-down'
    else if (exitDir === 'undo') cardClass = 'card-exit-undo'
    else if (undoEntering) cardClass = 'card-entering-undo'
    else if (transitioning) cardClass = 'card-entering'
  }

  // Half the room left over once the card, its gap and the details panel's
  // reserved slot are placed, as a percentage of the stage's flexed height:
  // built from the reserve, not the panel's own height, so the card holds
  // still from card to card, and nothing when the stage is only as tall as
  // its content, so it never adds scroll. Same as Vocab Drill's.
  const stageReserve = `calc(${cardWidth} * 280 / 380 + 16px + ${settings ? detailsSlot(settings, true) : 0}px)`
  const phoneStageSpacer = <div aria-hidden="true" style={{ flexShrink: 0, height: `max(0px, calc((100% - ${stageReserve}) / 2))` }} />

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#1E1E1E',
      fontFamily: FONT,
      letterSpacing: TRACKING,
      color: TEXT,
    }}>
      <PageHeader crumbs={drillCrumbs} rightSlot={rightSlot} />

      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: ACCENT,
          transition: 'width 300ms ease',
        }} />
      </div>

      {leechNotice && (
        <div style={{
          background: 'rgba(251,191,36,0.15)',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 6,
          margin: '8px 16px 0',
          padding: '8px 12px',
          fontSize: FS_BASE,
          color: WARNING,
          flexShrink: 0,
        }}>
          Leech — &quot;{leechNotice}&quot; suspended after too many failed reviews
        </div>
      )}

      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        // The card and its details panel can outgrow a short screen.
        overflowY: 'auto',
        scrollbarGutter: 'stable both-edges',
        // The card and panel size against this area (cqw), not the viewport,
        // so an open settings sidebar can't push them past the room beside it.
        containerType: 'inline-size',
      }}>
        {/* The stage takes the height the credit line and the bottom bar
            leave (flex footer layout); the page only scrolls when the stage
            needs more. */}
        <div style={{
          flex: '1 0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // `safe`: on a screen too short for the stage, overflow runs off
          // the bottom (scrollable) rather than off the top (not). A phone
          // can't spare the room reserved under the details panel
          // (CardDetails' `reserve`), so the stage starts at the top and
          // phoneStageSpacer centres the card as if the room were there.
          justifyContent: isMobile ? 'flex-start' : 'safe center',
          padding: isMobile ? '12px 0 16px' : '16px',
        }}>
        {isMobile && phoneStageSpacer}
        <div data-drill-stage="" className={entered ? 'drill-stage-in' : 'drill-stage-waiting'}>
          <DrillHUD
            streak={stats.streak}
            bestStreak={stats.bestStreak}
            correct={stats.correctCount}
            troubled={stats.troubledCount}
            remaining={stats.remaining}
            canUndo={stats.canUndo}
            onUndo={() => handleUndoRef.current()}
            showStreak={showStreak}
            showVisualEffects={showVisualEffects}
            showUndo={false}
            showCounts={false}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div key={currentCard.id} className={cardClass} style={{ position: 'relative' }}>
                <div style={{
                  width: cardWidth,
                  aspectRatio: '380 / 280',
                  containerType: 'size',
                }}>
                  <FlipCard
                    front={front}
                    back={back}
                    width="100%"
                    height="100%"
                    className={edgeToEdge ? '' : 'fc-rounded'}
                    flipped={flipped}
                    onFlip={(next) => {
                      if (transitioningRef.current) return
                      setFlipped(next)
                      if (next) {
                        if (sfxEnabled) sfx.play('flip_card')
                        if (audioEnabled && autoplayBack && currentCard) {
                          speakCard(currentCard, resolveAudioUrl(currentCard), { sequence: true })
                        }
                      }
                    }}
                    animate={showVisualEffects}
                  />
                </div>
                {isRequeue && (
                  <div style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: WARNING,
                  }} />
                )}
              </div>

              {settings && currentCard.front && (
                <CardDetails
                  cardKey={currentCard.id}
                  word={{ form: currentCard.front, reading: currentCard.kana }}
                  sentence={sentence}
                  settings={settings}
                  knownIds={knownIds}
                  related={related}
                  lessonLabel="This review"
                  revealed={flipped}
                  leaving={!!exitDir}
                  mobile={isMobile}
                  edgeToEdge={edgeToEdge}
                  jaFont={pixelFont ? FONT : 'system-ui, sans-serif'}
                  onChangeSetting={onChangeSetting}
                  onPlaySentence={replaySentence}
                  onReady={() => setPanelReady(true)}
                reserve={!isMobile}
                srsData={srsData}
                saveSrs={saveSrs}
                />
              )}

            </div>
          </DrillHUD>
        </div>
        </div>
        <AttributionFooter compact sources={footerSources} />
        {/* The buttons and counts, pinned: the card, panel and credit scroll
            under this bar, and the buttons never move. */}
        <div style={{ position: 'sticky', bottom: 0, zIndex: 5, flexShrink: 0 }}>
          <DrillActionBar isMobile={isMobile} correct={stats.correctCount} troubled={stats.troubledCount} remaining={stats.remaining}>
            {!flipped ? (
              <DrillButtonRow undo={undo}>
                <DrillFlipButton onClick={() => handleFlipRef.current()} hint={isMobile ? null : 'Space'} disabled={transitioning} />
              </DrillButtonRow>
            ) : (
              <DrillButtonRow undo={undo}>
                <DrillButton
                  label="Again"
                  hint={isMobile ? null : '1'}
                  color={DRILL_COLORS.again}
                  onClick={() => handleAnswerRef.current(Rating.Again)}
                  disabled={transitioning}
                />
                {showHardEasy && (
                  <DrillButton
                    label="Hard"
                    hint={isMobile ? null : '2'}
                    color={DRILL_COLORS.hard}
                    onClick={() => handleAnswerRef.current(Rating.Hard)}
                    disabled={transitioning}
                  />
                )}
                <DrillButton
                  label="Good"
                  hint={isMobile ? null : (showHardEasy ? '3' : '2')}
                  color={DRILL_COLORS.good}
                  onClick={() => handleAnswerRef.current(Rating.Good)}
                  disabled={transitioning}
                />
                {showHardEasy && (
                  <DrillButton
                    label="Easy"
                    hint={isMobile ? null : '4'}
                    color={DRILL_COLORS.easy}
                    onClick={() => handleAnswerRef.current(Rating.Easy)}
                    disabled={transitioning}
                  />
                )}
              </DrillButtonRow>
            )}
          </DrillActionBar>
        </div>
      </div>
    </div>
  )
}

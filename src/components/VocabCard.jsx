import FlipCard from '../FlipCard.jsx'
import CardWord from './CardWord.jsx'
import { FONT } from '../data/theme.js'
import { useDictionaryEntry, useSenseGlosses } from '../hooks/useDictionaryEntries.js'
import { cardGloss } from '../utils/dictionaryEntryLookup.js'
import { cardFormOf } from '../lib/displayForm.js'
import { DRILL_CARD_WIDTH } from '../hooks/useDrillCardSize.js'
import { getMainTextScale, getSecondaryTextScale, cqw } from '../utils/cardTextFit.js'

const CARD_BG = '#E8E4DE'

// M marks a card whose word is written differently in the textbook it came
// from than in the dictionary the card renders from — 勉強する drilled as 勉強,
// だれ as 誰. Set at import time (see scripts/resolve-textbook-vocab.mjs), so
// the learner is told the form differs rather than quietly shown a spelling
// their book never uses.
function CardShell({ isReview, isSentenceVocab, isModified, children }) {
  const marks = [
    isReview ? 'R' : isSentenceVocab ? 'SR' : null,
    isModified ? 'M' : null,
  ].filter(Boolean)

  return (
    <div style={{ position: 'relative', backgroundColor: CARD_BG, width: '100%', height: '100%' }}>
      {marks.length > 0 && (
        <div style={{
          position: 'absolute', top: '3cqw', left: '3cqw',
          display: 'flex', gap: '1.5cqw',
          fontFamily: FONT, fontSize: '4.5cqw', fontWeight: 700,
          color: 'rgba(0,0,0,0.16)', lineHeight: 1,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {marks.map(m => <span key={m}>{m}</span>)}
        </div>
      )}
      {children}
    </div>
  )
}

// The meaning-front mode's English — the only card text that isn't a word.
function meaningFrontStyle(scale) {
  return {
    fontFamily: FONT,
    fontSize: cqw(12.63, scale),
    fontWeight: 400,
    color: '#222',
    letterSpacing: 'normal',
    lineHeight: 1.2,
    textAlign: 'center',
  }
}

function FrontContent({ word, displayForm, reading, resolvedEnglish, reviewMode, showFurigana, readingPosition, pixelFont }) {
  const jaFont = pixelFont ? FONT : 'system-ui, sans-serif'
  const isMeaningFront = reviewMode === 'meaning-front'
  const scale = getMainTextScale(isMeaningFront ? resolvedEnglish : displayForm)
  // The setting decides whether the front hands over the reading.
  return (
    <CardShell isReview={word.isReview} isSentenceVocab={word.isSentenceVocab} isModified={word.modified}>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMeaningFront ? '0 16px' : 0 }}>
        {isMeaningFront
          ? <div style={meaningFrontStyle(scale)}>{resolvedEnglish}</div>
          : <CardWord form={displayForm} reading={reading} showReading={showFurigana} readingPosition={readingPosition} jaFont={jaFont} scale={scale} />}
      </div>
    </CardShell>
  )
}

// The example sentence and the kanji breakdown moved off the back into the
// details panel under the card (CardDetails), which is what left room for the
// reading to sit on its own line under the word.
function BackContent({ word, displayForm, reading, resolvedEnglish, showTranslation, readingPosition, pixelFont }) {
  const jaFont = pixelFont ? FONT : 'system-ui, sans-serif'
  const mainScale = getMainTextScale(displayForm)
  const secondaryScale = getSecondaryTextScale({ translation: showTranslation ? resolvedEnglish : null })

  // The back is the answer, so it always carries the reading — the furigana
  // setting only decides whether the front gives it away. Matches
  // SrsCardFace, which has always worked this way.
  return (
    <CardShell isReview={word.isReview} isSentenceVocab={word.isSentenceVocab} isModified={word.modified}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5cqw', padding: '0 16px' }}>
        <CardWord form={displayForm} reading={reading} showReading readingPosition={readingPosition} jaFont={jaFont} scale={mainScale} />
        {showTranslation && (
          <div style={{
            fontFamily: FONT,
            fontSize: cqw(5.26, secondaryScale),
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: '#555',
            textAlign: 'center',
          }}>
            {resolvedEnglish}
          </div>
        )}
      </div>
    </CardShell>
  )
}

// Desktop: 380px, corners rounded to match the details panel under it. On a
// phone the card runs edge to edge, square, like the panel.

export default function VocabCard({ word, flipped, onFlip, animate, reviewMode, showFurigana, showTranslation, readingPosition = 'below', pixelFont, edgeToEdge = false }) {
  // Dictionary is the source of truth for the definition — and, whenever the
  // word doesn't carry its own kanji/kana override, for the display form and
  // reading too — when this word is linked (word.jmdictId). The word's own
  // fields are only a fallback for words that don't have (or don't yet have)
  // a dictionary match.
  const { entry: dictEntry, loading: dictLoading } = useDictionaryEntry(word.jmdictId, true)
  const senseGlosses = useSenseGlosses([word])
  const resolvedEnglish = cardGloss(word, dictEntry, senseGlosses) ?? word.english
  const { form: displayForm, reading } = cardFormOf(word, dictEntry)
  const width = edgeToEdge ? '100cqw' : DRILL_CARD_WIDTH

  // dictLoading is only ever true while a dictionary fetch is genuinely in
  // flight (see useDictionaryEntry) — once it resolves, or immediately for a
  // word with no jmdictId, displayForm/reading/resolvedEnglish are already
  // final via the fallbacks above. Avoids flashing blank/undefined content
  // (or crashing buildFurigana on a missing reading) for a word that relies
  // on the dictionary for its kanji/kana/english.
  if (dictLoading) {
    return (
      <div style={{ width, aspectRatio: '380 / 280', containerType: 'size' }}>
        <CardShell isReview={word.isReview} isSentenceVocab={word.isSentenceVocab} isModified={word.modified} />
      </div>
    )
  }

  const front = <FrontContent word={word} displayForm={displayForm} reading={reading} resolvedEnglish={resolvedEnglish} reviewMode={reviewMode} showFurigana={showFurigana} readingPosition={readingPosition} pixelFont={pixelFont} />
  const back  = <BackContent word={word} displayForm={displayForm} reading={reading} resolvedEnglish={resolvedEnglish} showTranslation={showTranslation} readingPosition={readingPosition} pixelFont={pixelFont} />

  const ants = flipped && animate ? (
    <svg viewBox="0 0 380 280" className="mc-overlay" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }} aria-hidden="true">
      <rect className="mc-ants" x="-4" y="-4" width="388" height="288" rx={edgeToEdge ? 0 : 9} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeDasharray="6 6" />
      <rect className="mc-ants--offset" x="-4" y="-4" width="388" height="288" rx={edgeToEdge ? 0 : 9} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" strokeDasharray="6 6" />
    </svg>
  ) : null

  return (
    <div style={{ width, aspectRatio: '380 / 280', containerType: 'size' }}>
      <FlipCard front={front} back={back} width="100%" height="100%" className={edgeToEdge ? '' : 'fc-rounded'} flipped={flipped} onFlip={onFlip} animate={animate} overlay={ants} />
    </div>
  )
}

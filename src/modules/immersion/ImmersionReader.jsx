import { useState, useEffect, useRef, useMemo } from 'react'
import PageHeader from '../../components/PageHeader.jsx'
import AuthSlot from '../../components/AuthSlot.jsx'
import WordPopup from '../../components/WordPopup.jsx'
import { buildVocabMap } from '../../utils/vocabMap.js'
import { useProgress } from '../../hooks/useProgress.js'
import ChipSelector from '../../components/Chip.jsx'
import ToggleButton from '../../components/ToggleButton.jsx'
import Disclosure from '../../components/Disclosure.jsx'
import NewspaperLayout from '../../components/NewspaperLayout.jsx'
import { FONT, TRACKING, TEXT_MUTED, FS_BASE, CONTENT_READING } from '../../data/theme.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import { SOURCE_LABEL } from './sourceLabels.js'

// Both bodies are generated; 'simplified' is the beginner rewrite and the
// original body is the intermediate one, so the toggle reads as levels.
// A third, easier level would need the fetch-nhk pipeline to generate it.
const BODY_VERSION_OPTIONS = [
  { value: 'simplified', label: 'Simple' },
  { value: 'original', label: 'Intermediate' },
]
const EDITION_LABEL = { simplified: 'Simple edition', original: 'Intermediate edition' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ImmersionReader({ article, defaultLevel = 'simplified', onBack }) {
  const [showSimplified, setShowSimplified] = useState(defaultLevel !== 'original' && !!article.body_simple)
  const [popup, setPopup] = useState(null) // { token, vocabEntry, anchorRect, idx }
  const [showFurigana, setShowFurigana] = useState(true)
  const { data: srsData, save: saveSrs } = useProgress('vocab-srs')
  const scrollRef = useRef(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function onScroll() { setPopup(null) }
    el.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('touchmove', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      document.removeEventListener('touchmove', onScroll)
    }
  }, [])

  const vocabMap = useMemo(() => buildVocabMap(article.vocabulary_ja), [article.vocabulary_ja])

  function handleWordClick(token, e, idx) {
    const rect = e.target.getBoundingClientRect()
    const vocabEntry = vocabMap[token.t] ?? null
    setPopup({ token, vocabEntry, anchorRect: rect, idx })
  }

  const showingSimplified = showSimplified && !!article.body_simple
  const body = showingSimplified ? article.body_simple : article.body_ja
  const tokens = showingSimplified ? article.tokens_simple : article.tokens_ja
  const hasSimplified = !!article.body_simple
  const hasSummary = !!article.summary_en

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#1E1E1E' }}>
      {popup && (
        <WordPopup
          // Added as it appears in the article, which is what this reader
          // has always saved.
          word={{ text: popup.token.t, reading: popup.token.r, pos: popup.vocabEntry?.pos, meaning: popup.vocabEntry?.meaning ?? popup.token.r ?? '', jmdictId: popup.vocabEntry?.jmdictId }}
          anchorRect={popup.anchorRect}
          isMobile={isMobile}
          srsData={srsData}
          saveSrs={saveSrs}
          onClose={() => setPopup(null)}
        />
      )}

      <PageHeader
        crumbs={[
          { label: 'Lantern', href: '#/' },
          { label: 'News reader', onClick: onBack },
          { label: 'Read' },
        ]}
        rightSlot={<AuthSlot />}
      />
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', scrollbarGutter: 'stable both-edges', padding: '40px 24px' }}>
        <div style={{ maxWidth: CONTENT_READING, margin: '0 auto' }}>
          {(hasSimplified || tokens) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              {hasSimplified && (
                <ChipSelector
                  mode="single"
                  options={BODY_VERSION_OPTIONS}
                  value={showSimplified ? 'simplified' : 'original'}
                  onChange={v => setShowSimplified(v === 'simplified')}
                />
              )}
              {tokens && (
                <div style={{ marginLeft: 'auto' }}>
                  <ToggleButton
                    active={showFurigana}
                    labels={{ on: 'Furigana on', off: 'Furigana off' }}
                    onClick={() => setShowFurigana(f => !f)}
                  />
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: FS_BASE - 2, color: TEXT_MUTED, fontFamily: FONT, letterSpacing: TRACKING, opacity: 0.7, marginBottom: 12 }}>
            This article was written by AI based on real news topics and may contain inaccuracies.
          </div>

          <div style={{ marginBottom: 40 }}>
            <NewspaperLayout
              title={showingSimplified ? (article.title_simple ?? article.title) : article.title}
              subtitle={article.title_en}
              masthead={SOURCE_LABEL[article.source] ?? article.source ?? 'News'}
              edition={EDITION_LABEL[showSimplified ? 'simplified' : 'original']}
              date={article.published_at ? formatDate(article.published_at) : undefined}
              tokens={tokens}
              body={body}
              vocabMap={vocabMap}
              onWordClick={handleWordClick}
              showFurigana={showFurigana}
              activeIdx={popup?.idx ?? null}
              isMobile={isMobile}
            />
          </div>

          {hasSummary && (
            <div style={{ paddingBottom: 48 }}>
              <Disclosure label="English summary">
                <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, fontFamily: FONT, letterSpacing: TRACKING, lineHeight: 1.7 }}>
                  {article.summary_en}
                </div>
              </Disclosure>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useMemo, useEffect } from 'react'
import PageHeader from '../../components/PageHeader.jsx'
import AuthSlot from '../../components/AuthSlot.jsx'
import CenteredLoadingMessage from '../../components/CenteredLoadingMessage.jsx'
import { TokenizedBody } from '../../components/JapaneseReader.jsx'
import WordPopup from '../../components/WordPopup.jsx'
import { NewspaperLayout, ChatLayout, DiaryLayout, InterviewLayout, LetterLayout, PostcardLayout } from './StoryLayouts.jsx'
import Button from '../../components/Button.jsx'
import Japanese from '../../components/Japanese.jsx'
import ToggleButton from '../../components/ToggleButton.jsx'
import { BG } from './storyUI.jsx'
import { buildVocabMap } from '../../utils/vocabMap.js'
import { FONT, TRACKING, TEXT, TEXT_MUTED, FS_ARTICLE_BODY, FS_HEADING, FS_CONTENT_HEADING, BRAND, CONTENT_READING } from '../../data/theme.js'
import { ModuleThemeProvider } from '../../context/ModuleThemeContext.jsx'
import { useProgress } from '../../hooks/useProgress.js'
import { supabase } from '../../lib/supabase.js'
import { lookupVocabulary } from './lookupVocabulary.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'

const STORY_ACCENT = BRAND

const FORMAT_LAYOUTS = {
  news: NewspaperLayout,
  dialogue: ChatLayout,
  diary: DiaryLayout,
  interview: InterviewLayout,
  letter: LetterLayout,
  postcard: PostcardLayout,
}

export default function StoryReviewPage({ storyId }) {
  return (
    <ModuleThemeProvider accent={STORY_ACCENT}>
      <StoryReview storyId={storyId} />
    </ModuleThemeProvider>
  )
}

function StoryReview({ storyId }) {
  const isMobile = useIsMobile()
  const { data: srsData, save: saveSrs } = useProgress('vocab-srs')

  const [story, setStory] = useState(null)
  const [storyLoading, setStoryLoading] = useState(true)
  const [storyError, setStoryError] = useState(null)

  useEffect(() => {
    setStory(null)
    setStoryError(null)
    if (!supabase) {
      setStoryError('Supabase not configured.')
      setStoryLoading(false)
      return
    }
    setStoryLoading(true)
    supabase
      .from('stories')
      .select('id, title, story, tokens, format, created_at')
      .eq('id', storyId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) {
          setStoryError(err.message)
        } else {
          setStory(data)
        }
        setStoryLoading(false)
      })
  }, [storyId])

  const [vocabulary, setVocabulary] = useState([])
  const [popup, setPopup] = useState(null) // { token, vocabEntry, anchorRect, idx }
  const [showFurigana, setShowFurigana] = useState(true)

  useEffect(() => {
    setVocabulary([])
    setPopup(null)
    if (story?.tokens) {
      lookupVocabulary(story.tokens).then(setVocabulary).catch(() => setVocabulary([]))
    }
  }, [story])

  const vocabMap = useMemo(() => buildVocabMap(vocabulary), [vocabulary])

  function handleWordClick(token, e, idx) {
    const rect = e.target.getBoundingClientRect()
    setPopup({ token, vocabEntry: vocabMap[token.t] ?? null, anchorRect: rect, idx })
  }

  const crumbs = [
    { label: 'Lantern', href: '#/' },
    { label: 'Story generator', href: '#/story' },
    { label: 'Review story' },
  ]

  if (!story) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: BG, color: TEXT, fontFamily: FONT, letterSpacing: TRACKING }}>
        <PageHeader crumbs={crumbs} rightSlot={<AuthSlot />} />
        {storyLoading ? (
          <CenteredLoadingMessage text="Loading" />
        ) : (
          <div style={{ maxWidth: CONTENT_READING, margin: '0 auto', padding: '24px 20px', fontSize: FS_HEADING, color: TEXT_MUTED }}>
            {storyError || 'Story not found.'}
          </div>
        )}
      </div>
    )
  }

  const hasTokens = Array.isArray(story.tokens) && story.tokens.length > 0
  const Layout = hasTokens ? FORMAT_LAYOUTS[story.format] : null

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: BG, color: TEXT, fontFamily: FONT, letterSpacing: TRACKING }}>
      {popup && (
        <WordPopup
          // Added in its dictionary form (the tokenizer's base), with the
          // reading, which is what Story has always saved.
          word={{ text: popup.token.t, reading: popup.token.r, pos: popup.vocabEntry?.pos, meaning: popup.vocabEntry?.meaning ?? popup.token.r ?? '', front: popup.token.b || popup.token.t, kana: popup.token.r, jmdictId: popup.vocabEntry?.jmdictId }}
          anchorRect={popup.anchorRect}
          isMobile={isMobile}
          srsData={srsData}
          saveSrs={saveSrs}
          onClose={() => setPopup(null)}
        />
      )}

      <PageHeader crumbs={crumbs} rightSlot={<AuthSlot />} />
      <div style={{ flex: 1, overflowY: 'auto', scrollbarGutter: 'stable both-edges' }} onScroll={() => setPopup(null)}>
        <div style={{ maxWidth: CONTENT_READING, margin: '0 auto', padding: isMobile ? '18px 14px 70px' : '24px 20px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {!Layout && (
              <Japanese as="h2" style={{ fontSize: FS_CONTENT_HEADING, fontWeight: 'normal', lineHeight: 1.5, margin: 0, flex: '1 1 200px' }}>{story.title}</Japanese>
            )}
            <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
              {hasTokens && (
                <ToggleButton
                  active={showFurigana}
                  labels={{ on: 'Hide furigana', off: 'Show furigana' }}
                  activeTone="neutral"
                  onClick={() => setShowFurigana(f => !f)}
                />
              )}
              <Button variant="neutral" onClick={() => { window.location.hash = '#/story' }}>New content</Button>
            </div>
          </div>
          <div style={{ marginBottom: 40 }}>
            {Layout ? (
              <Layout
                title={story.title}
                tokens={story.tokens}
                vocabMap={vocabMap}
                onWordClick={handleWordClick}
                showFurigana={showFurigana}
                activeIdx={popup?.idx ?? null}
                isMobile={isMobile}
              />
            ) : (
              <div style={{
                fontSize: FS_ARTICLE_BODY,
                color: TEXT,
                fontFamily: FONT,
                letterSpacing: TRACKING,
                lineHeight: hasTokens && showFurigana ? 2.4 : 1.9,
                whiteSpace: 'pre-wrap',
              }}>
                {hasTokens
                  ? (
                    <TokenizedBody
                      tokens={story.tokens}
                      vocabMap={vocabMap}
                      onWordClick={handleWordClick}
                      showFurigana={showFurigana}
                      activeIdx={popup?.idx ?? null}
                    />
                  )
                  : story.story}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

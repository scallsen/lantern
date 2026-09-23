import { useRef, useState } from 'react'
import { WordPopup, TokenizedBody } from './JapaneseReader.jsx'
import Japanese from './Japanese.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'
import { BRAND, KANJI_FONT, TEXT, TEXT_MUTED, FS_ARTICLE_BODY, FS_CAPTION, FS_SM, SPACE_12 } from '../data/theme.js'

const SEED_DECKS = {
  'immersion-words': { id: 'immersion-words', name: 'Immersion Words', source: 'imported', addedAt: 1 },
  'story-words': { id: 'story-words', name: 'Story Words', source: 'imported', addedAt: 2 },
}

const TOKENS = [
  { t: '今日', r: 'きょう', w: true }, { t: 'は', r: null, w: false },
  { t: '世界', r: 'せかい', w: true }, { t: 'で', r: null, w: false },
  { t: '一番', r: 'いちばん', w: true }, { t: 'いい', r: null, w: true },
  { t: '天気', r: 'てんき', w: true }, { t: 'です', r: null, w: false }, { t: '。', r: null, w: false },
]

export default {
  title: 'Patterns/Definition Popover',
  component: WordPopup,
  subcomponents: { TokenizedBody },
  tags: ['autodocs'],
  // WordPopup reads useAuth(), which is null outside a provider.
  decorators: [Story => <AuthProvider><Story /></AuthProvider>],
  parameters: {
    docs: {
      description: { component: "Tapping a word in reading text shows its reading, part of speech and meaning, with a way to add it to a review deck.\n\n**Use when** words in a reading surface are tappable — Immersion articles, Story.\n\n**Don't use** for a word's full details; link to its dictionary entry instead.\n\n*Build note:* the tappable running text is `TokenizedBody` (see the Tokenized Text story). In Storybook there's no signed-in account, so the add-to-deck step shows its sign-in prompt." },
      story: { inline: false, iframeHeight: 420 },
    },
  },
  args: { isMobile: false },
}

function PopoverStory({ isMobile }) {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState(null)
  const wordRef = useRef(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12, alignItems: 'flex-start' }}>
      <div style={{ fontSize: FS_ARTICLE_BODY, fontFamily: KANJI_FONT, color: TEXT, lineHeight: 2 }}>
        <Japanese>今日は</Japanese>
        {/* A raw span rather than <Japanese>: it needs a ref, and Japanese
            doesn't forward one on React 18. Same lang/translate attrs. */}
        <span
          lang="ja"
          translate="no"
          ref={wordRef}
          onClick={() => { setOpen(true); setLog(null) }}
          style={{ background: `${BRAND}38`, cursor: 'pointer', padding: '0 2px', borderRadius: 3 }}
        >
          世界
        </span>
        <Japanese>で一番いい天気です。</Japanese>
      </div>
      {log && <div style={{ fontSize: FS_CAPTION, color: BRAND }}>{log}</div>}
      <div style={{ fontSize: FS_SM, color: TEXT_MUTED, lineHeight: 1.5, maxWidth: 420 }}>
        Click the highlighted word, then &ldquo;Add to review deck&rdquo; — the panel swaps to the deck list in
        place instead of opening a second popover on top of itself.
      </div>
      {open && (
        <WordPopup
          token={{ t: '世界', r: 'せかい' }}
          vocabEntry={{ pos: 'Noun', meaning: 'world; society; the universe' }}
          decks={SEED_DECKS}
          lastUsedDeckId="immersion-words"
          isMobile={isMobile}
          anchorRect={wordRef.current?.getBoundingClientRect()}
          onClose={() => setOpen(false)}
          onAdd={(token, entry, deckId) => setLog(`Added 世界 to "${SEED_DECKS[deckId]?.name ?? deckId}"`)}
          onCreateAndAdd={(token, entry, name) => setLog(`Created "${name}" and added 世界`)}
        />
      )}
    </div>
  )
}

export const Desktop = { render: args => <PopoverStory {...args} /> }

export const Mobile = { render: args => <PopoverStory {...args} />, args: { isMobile: true } }

function RunningText({ showFurigana }) {
  const [activeIdx, setActiveIdx] = useState(null)
  return (
    <div style={{ fontSize: FS_ARTICLE_BODY, lineHeight: 2.2, color: TEXT }}>
      <TokenizedBody tokens={TOKENS} vocabMap={{ 世界: {} }} onWordClick={(tok, e, i) => setActiveIdx(i)} showFurigana={showFurigana} activeIdx={activeIdx} />
    </div>
  )
}

export const TokenizedText = { render: args => <RunningText {...args} />, args: { showFurigana: true } }

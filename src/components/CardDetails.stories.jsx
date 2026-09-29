import { useState } from 'react'
import CardDetails from './CardDetails.jsx'
import Button from './Button.jsx'
import { DRILL_SETTINGS_DEFAULTS } from '../hooks/useDrillSettings.js'
import { tokenizeSentence } from '../utils/sentenceTokens.js'

// So-Matome N3 Kanji, Week 3, Day 2's 消費者, with the Tanaka sentence the
// drill resolves for it and the dictionary rows its dictionary_ids point at.
const entry = (id, primary_form, kana_forms, gloss_en, extra = {}) => ({ id, primary_form, preferred_form: null, kana_forms, gloss_en, misc0: null, ...extra })
const ENTRIES = {
  1350300: entry('1350300', '消費者', ['しょうひしゃ'], 'consumer (of a product, service, etc.); customer; (end) user'),
  1350320: entry('1350320', '消費税', ['しょうひぜい'], 'consumption tax (incl. sales tax, VAT, excise duty, etc.)'),
  1469800: entry('1469800', '乃', ['の'], 'indicates possessive', { preferred_form: 'の' }),
  1480670: entry('1480670', '反対', ['はんたい'], 'opposition; resistance; antagonism'),
  1551370: entry('1551370', '立ち上がる', ['たちあがる'], 'to stand up; to get up; to rise (to one’s feet)'),
  1861770: entry('1861770', '多く', ['おおく'], 'many; much; plenty'),
  2028920: entry('2028920', 'は', ['は'], 'indicates sentence topic'),
}
const WORD = { form: '消費者', reading: 'しょうひしゃ' }
const JAPANESE = '多くの消費者は消費税反対に立ち上がった。'
const SENTENCE = {
  japanese: JAPANESE,
  english: 'Many consumers rose up against the consumption tax.',
  tokens: tokenizeSentence(JAPANESE, ENTRIES, { id: '1350300', ...WORD }),
  entries: ENTRIES,
}
// 反対 was drilled in Genki II, so its furigana drops in the "New" mode.
const KNOWN_IDS = new Set(['1480670'])
const RELATED = {
  known: [{ form: '反対', gloss: 'opposition; resistance' }, { form: '消す', gloss: 'to erase; to delete' }],
  lesson: [{ form: '費用', gloss: 'cost; expense' }, { form: '旅費', gloss: 'travel expenses' }, { form: '会費', gloss: 'membership fee' }],
}

export default {
  title: 'Drill/Card Details',
  component: CardDetails,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "The panel under a drill card: the word's example sentence and its kanji. Dark by default (an outline on the page, keeping light for the card), with a sun in its corner to switch to paper. Redacted on the front of the card, it fades in place to the real content as the card flips, so the card and buttons never move and nothing gives the answer away early.\n\n**Use when** a drill shows one word per card — Vocab Drill, Anime Vocab and Reviews all render it under the card.\n\n**Don't use** for a list of words with their sentences (Word List Modal), or for a word's full entry (Definition Popover).\n\n*Build note:* resolve the sentence with `useCardSentence` and the learner's known words with `useKnownWords`; the drawer's Details and Sentence groups (Drill Settings Panel) are this panel's settings." } },
  },
  args: {
    mobile: false,
    details: true,
    sentence: true,
    kanjiMeanings: true,
    sentenceTranslation: 'blur',
    sentenceFurigana: 'new',
    readingPosition: 'below',
    detailsTheme: 'dark',
  },
  argTypes: {
    detailsTheme: { control: 'inline-radio', options: ['dark', 'light'] },
    sentenceTranslation: { control: 'inline-radio', options: ['off', 'blur', 'on'] },
    sentenceFurigana: { control: 'inline-radio', options: ['off', 'new', 'all'] },
    readingPosition: { control: 'inline-radio', options: ['below', 'above'] },
  },
}

function PanelStory({ mobile, ...overrides }) {
  const [revealed, setRevealed] = useState(false)
  const [settings, setSettings] = useState({ ...DRILL_SETTINGS_DEFAULTS, ...overrides })
  const merged = { ...settings, ...overrides, details: settings.details }
  return (
    <div style={{ containerType: 'inline-size', width: mobile ? 390 : 720, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 160 }}>
      <CardDetails
        cardKey="w1"
        word={WORD}
        sentence={SENTENCE}
        settings={merged}
        knownIds={KNOWN_IDS}
        related={RELATED}
        revealed={revealed}
        mobile={mobile}
        jaFont="system-ui, sans-serif"
        onChangeSetting={(key, value) => setSettings(s => ({ ...s, [key]: value }))}
        onPlaySentence={() => {}}
      />
      <Button variant="neutral" onClick={() => setRevealed(v => !v)}>{revealed ? 'Flip back' : 'Flip'}</Button>
    </div>
  )
}

export const Desktop = { render: args => <PanelStory {...args} /> }

export const Phone = { render: args => <PanelStory {...args} />, args: { mobile: true } }

export const Light = { render: args => <PanelStory {...args} />, args: { detailsTheme: 'light' } }

export const SentenceOnly = { render: args => <PanelStory {...args} />, args: { kanjiMeanings: false } }

export const KanjiOnly = { render: args => <PanelStory {...args} />, args: { sentence: false } }

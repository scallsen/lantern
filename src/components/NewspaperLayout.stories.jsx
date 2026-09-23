import NewspaperLayout from './NewspaperLayout.jsx'

const TOKENS = [
  { t: '今年', r: 'ことし', w: true }, { t: 'は', r: null, w: false },
  { t: '桜', r: 'さくら', w: true }, { t: 'が', r: null, w: false },
  { t: 'いつも', r: null, w: true }, { t: 'より', r: null, w: false },
  { t: '一', r: 'いっ', w: true }, { t: '週間', r: 'しゅうかん', w: true },
  { t: '早く', r: 'はやく', w: true }, { t: '咲き', r: 'さき', w: true },
  { t: 'ました', r: null, w: false }, { t: '。', r: null, w: false },
  { t: '\n\n', r: null, w: false },
  { t: '三月', r: 'さんがつ', w: true }, { t: 'が', r: null, w: false },
  { t: '暖かかった', r: 'あたたかかった', w: true }, { t: 'から', r: null, w: false },
  { t: 'です', r: null, w: false }, { t: '。', r: null, w: false },
]

export default {
  title: 'Patterns/Newspaper Layout',
  component: NewspaperLayout,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A paper-styled page for reading news-style text, with masthead, headline and columns.\n\n**Use when** showing an article — the News reader, and Story's news format.\n\n**Don't use** for other kinds of writing; Story has its own layouts for dialogue, diary, letter and postcard." } },
  },
  args: {
    title: '日本の桜が今年は早く咲きました',
    subtitle: "Japan's cherry blossoms bloomed early this year",
    tokens: TOKENS,
    vocabMap: { 桜: {} },
    onWordClick: () => {},
    showFurigana: true,
    isMobile: false,
    masthead: 'NHK Easy',
    edition: 'Simple edition',
    date: 'Friday, August 28, 2026',
  },
  decorators: [Story => <div style={{ maxWidth: 720 }}><Story /></div>],
}

export const NewsReader = {}

export const StoryDefaults = { args: { masthead: undefined, edition: undefined, subtitle: undefined } }

export const Mobile = { args: { isMobile: true }, decorators: [Story => <div style={{ width: 360 }}><Story /></div>] }

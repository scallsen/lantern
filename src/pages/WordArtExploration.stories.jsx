import { useState } from 'react'
import FlipCard from '../FlipCard.jsx'
import CardWord from '../components/CardWord.jsx'
import CardDetails from '../components/CardDetails.jsx'
import DrillActionBar from '../components/DrillActionBar.jsx'
import SpeedModeControls from '../components/SpeedModeControls.jsx'
import { DRILL_SETTINGS_DEFAULTS } from '../hooks/useDrillSettings.js'
import { DRILL_CARD_WIDTH } from '../hooks/useDrillCardSize.js'
import { tokenizeSentence } from '../utils/sentenceTokens.js'
import { getMainTextScale, cqw } from '../utils/cardTextFit.js'
import { FONT } from '../data/theme.js'

// Exploration only — never merged. Pixel-art word images (Retro Diffusion,
// rd_pro__simple, 32×32, PICO-8 palette) placed on the real drill card in
// several ways, so each placement can be judged at phone and desktop size.

const CARD_BG = '#E8E4DE'
const ART = '/word-art-exploration/'

// `art.native` is the image's own pixel size: stills are 32, the animated
// verb is a 48 canvas (32px subject plus headroom for the motion), so both
// render at the same integer scale and their pixels match.
const WORDS = {
  kasa: { form: '傘', reading: 'かさ', english: 'umbrella', art: { src: 'kasa.png', native: 32 },
    sentence: ['雨が降りそうだから傘を持っていこう。', "It looks like rain, so let's take an umbrella."] },
  kanashii: { form: '悲しい', reading: 'かなしい', english: 'sad', art: { src: 'kanashii.png', native: 32 },
    sentence: ['その映画はとても悲しかった。', 'That movie was very sad.'] },
  nugu: { form: '脱ぐ', reading: 'ぬぐ', english: 'to take off (clothes, shoes, etc.)', art: { src: 'nugu.gif', native: 48 },
    sentence: ['家に入る前に靴を脱いでください。', 'Please take off your shoes before entering the house.'] },
  takai: { form: '高い', reading: 'たかい', english: 'expensive', art: { src: 'takai.png', native: 32 },
    sentence: ['このかばんは高すぎる。', 'This bag is too expensive.'] },
  keizai: { form: '経済', reading: 'けいざい', english: 'economy', art: { src: 'keizai.png', native: 32 },
    sentence: ['日本の経済は回復している。', "Japan's economy is recovering."] },
  tabun: { form: '多分', reading: 'たぶん', english: 'perhaps; probably', art: null,
    sentence: ['多分明日は雨でしょう。', 'It will probably rain tomorrow.'] },
}

function Sprite({ art, scale, style }) {
  const px = art.native * scale
  return <img src={ART + art.src} alt="" width={px} height={px} style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0, ...style }} />
}

function Face({ children }) {
  return <div style={{ position: 'relative', background: CARD_BG, width: '100%', height: '100%' }}>{children}</div>
}

function Answer({ w, scale = 1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5cqw' }}>
      <CardWord form={w.form} reading={w.reading} showReading jaFont="system-ui, sans-serif" scale={getMainTextScale(w.form) * scale} />
      <div style={{ fontFamily: FONT, fontSize: cqw(5.26, 1), letterSpacing: '0.04em', color: '#555', textAlign: 'center' }}>{w.english}</div>
    </div>
  )
}

const centred = { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }

// Each placement returns [front, back] for the card.
const PLACEMENTS = {
  // Today's card, for comparison.
  none: w => [
    <Face><div style={centred}><CardWord form={w.form} jaFont="system-ui, sans-serif" scale={getMainTextScale(w.form)} /></div></Face>,
    <Face><div style={centred}><Answer w={w} /></div></Face>,
  ],
  // The image joins the answer, in a corner like a stamp. The word's layout
  // never moves, so a word with no image looks exactly like today's card.
  stamp: w => [
    PLACEMENTS.none(w)[0],
    <Face>
      {w.art && <Sprite art={w.art} scale={2} style={{ position: 'absolute', top: 12, right: 12, ...(w.art.native > 32 ? { top: -4, right: -4 } : {}) }} />}
      <div style={centred}><Answer w={w} /></div>
    </Face>,
  ],
  // The image leads the answer, the word to its right.
  beside: w => [
    PLACEMENTS.none(w)[0],
    <Face>
      <div style={{ ...centred, gap: 20 }}>
        {w.art && <Sprite art={w.art} scale={3} style={w.art.native > 32 ? { margin: -24 } : null} />}
        <Answer w={w} scale={w.art ? 0.8 : 1} />
      </div>
    </Face>,
  ],
  // The image sits over the word, the word one step smaller.
  above: w => [
    PLACEMENTS.none(w)[0],
    <Face>
      <div style={{ ...centred, flexDirection: 'column', gap: 6 }}>
        {w.art && <Sprite art={w.art} scale={2} style={w.art.native > 32 ? { margin: -16 } : null} />}
        <Answer w={w} scale={w.art ? 0.75 : 1} />
      </div>
    </Face>,
  ],
  // A drill mode rather than a placement: the picture is the prompt, and the
  // learner produces the word (replaces the English of meaning-front mode).
  pictureFront: w => [
    <Face><div style={centred}>{w.art ? <Sprite art={w.art} scale={4} style={w.art.native > 32 ? { margin: -32 } : null} /> : <div style={{ fontFamily: FONT, fontSize: cqw(8, 1), color: '#222' }}>{w.english}</div>}</div></Face>,
    PLACEMENTS.stamp(w)[1],
  ],
}

function Card({ w, placement, flipped, onFlip }) {
  const [front, back] = PLACEMENTS[placement](w)
  return (
    <div style={{ width: DRILL_CARD_WIDTH, aspectRatio: '380 / 280', containerType: 'size' }}>
      <FlipCard front={front} back={back} width="100%" height="100%" className="fc-rounded" flipped={flipped} onFlip={onFlip} animate />
    </div>
  )
}

function sentenceFor(w) {
  const [japanese, english] = w.sentence
  return { japanese, english, tokens: tokenizeSentence(japanese, {}, { form: w.form, reading: w.reading }), entries: {} }
}

// Desktop's spare room is beside the card, not under it: the image can live
// in the gutter at a larger scale, outside the card entirely.
function Gutter({ w, revealed }) {
  return (
    <div style={{ width: 160, display: 'flex', justifyContent: 'flex-end', opacity: revealed && w.art ? 1 : 0, transition: 'opacity 300ms' }}>
      {w.art && <Sprite art={w.art} scale={4} style={w.art.native > 32 ? { margin: -32 } : null} />}
    </div>
  )
}

function DrillStage({ wordKey, placement, mobile, flipped: initialFlipped, gutter }) {
  const [flipped, setFlipped] = useState(initialFlipped)
  const [settings, setSettings] = useState({ ...DRILL_SETTINGS_DEFAULTS, details: true, sentence: true, kanjiMeanings: true })
  const w = WORDS[wordKey]
  const kanjiMeanings = Object.fromEntries([...w.form].map(ch => [ch, '—']))
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1E1E1E' }}>
      <div style={{ height: 64, flexShrink: 0, borderBottom: '1px solid #2E2E2E', display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: FONT, color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Vocab Drill › Genki I</div>
      <div style={{ flex: 1, overflowY: 'auto', scrollbarGutter: 'stable both-edges', containerType: 'inline-size' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, paddingTop: mobile ? 12 : 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {gutter && !mobile && <Gutter w={w} revealed={flipped} />}
            <Card w={w} placement={placement} flipped={flipped} onFlip={() => setFlipped(f => !f)} />
            {gutter && !mobile && <div style={{ width: 160 }} />}
          </div>
          <CardDetails
            cardKey={wordKey} word={{ form: w.form, reading: w.reading }} sentence={sentenceFor(w)} settings={settings}
            revealed={flipped} mobile={mobile} jaFont="system-ui, sans-serif" kanjiMeanings={kanjiMeanings} reserve={!mobile}
            onChangeSetting={(k, v) => setSettings(s => ({ ...s, [k]: v }))} onPlaySentence={() => {}}
          />
        </div>
      </div>
      <DrillActionBar isMobile={mobile} correct={6} troubled={1} remaining={20}>
        <SpeedModeControls isFlipped={flipped} transitioning={false} onVerdict={() => setFlipped(false)} onFlip={() => setFlipped(true)} onUndo={() => {}} canUndo />
      </DrillActionBar>
    </div>
  )
}

export default {
  title: 'Explorations/Word Art',
  parameters: { layout: 'fullscreen' },
  args: { wordKey: 'kasa', placement: 'stamp', mobile: false, flipped: true, gutter: false },
  argTypes: {
    wordKey: { control: 'select', options: Object.keys(WORDS) },
    placement: { control: 'inline-radio', options: Object.keys(PLACEMENTS) },
  },
  render: args => <DrillStage {...args} />,
}

export const Stamp = {}
export const Beside = { args: { placement: 'beside' } }
export const Above = { args: { placement: 'above' } }
export const DesktopGutter = { args: { placement: 'none', gutter: true } }
export const PictureFront = { args: { placement: 'pictureFront', flipped: false } }

const SET = ['kasa', 'tebukuro', 'omiyage', 'teikiken', 'kippu', 'takai', 'takai_tall', 'keizai', 'kanashii', 'odoroku', 'hirou', 'nugu_still', 'kankei', 'yakusoku']

// The whole set side by side at one scale, on the card's paper — the
// consistency check: does it read as one family?
export const SetSheet = {
  render: () => (
    <div style={{ background: CARD_BG, padding: 24, display: 'grid', gridTemplateColumns: 'repeat(7, 64px)', gap: 24 }}>
      {SET.map(k => <Sprite key={k} art={{ src: `${k}.png`, native: 32 }} scale={2} />)}
      <Sprite art={{ src: 'nugu.gif', native: 48 }} scale={2} style={{ margin: -16 }} />
    </div>
  ),
}

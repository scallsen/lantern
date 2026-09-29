// The concept screens. Each renders one drill screen inside a device frame,
// driven by the lab's shared per-concept state `s` and its patch function `u`.
import Japanese from '../../components/Japanese.jsx'
import { FONT, KANJI_FONT, TEXT, TEXT_MUTED, BORDER, BRAND_TEXT, FS_BASE } from '../../data/theme.js'
import { PAPER, INK, Paper, PaperCard, BigWord, Meaning, KanjiBar, SentenceText, SpellingNote, IconBtn, Pager, English, FamilyGroup, KanjiReadings, Ruby, DrillScreen, HudStreak, HudCounts, UndoSlot, VerdictRow } from './parts.jsx'
import { KANJI, kanjiFamily, cardWidth, current, actions } from './labData.js'

export function DrillStack({ mobile, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 10 : 15 }}>
      <HudStreak compact={mobile} />
      {children}
      <HudCounts />
    </div>
  )
}

export function FrontWord({ word, showReading }) {
  return (
    <Paper>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BigWord word={word} showReading={showReading} />
      </div>
    </Paper>
  )
}

export function BackWord({ word, extra, bar }) {
  return (
    <Paper>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.5cqw', padding: '0 4cqw' }}>
          <BigWord word={word} showReading />
          <Meaning word={word} />
          {extra}
        </div>
        {bar}
      </div>
    </Paper>
  )
}

// Paper surface with scalloped top/bottom edges — the "ticker tape".
export function Tape({ width, children, animateKey, style }) {
  const edge = 'radial-gradient(circle at 7px 0, #1E1E1E 3px, transparent 3.5px), radial-gradient(circle at 7px 100%, #1E1E1E 3px, transparent 3.5px)'
  return (
    <div key={animateKey} className="lab-slide-down" style={{
      width, boxSizing: 'border-box', backgroundColor: PAPER, backgroundImage: edge, backgroundSize: '14px 100%', backgroundRepeat: 'repeat-x',
      borderRadius: 4, color: INK, boxShadow: '0 4px 0 rgba(0,0,0,0.25)', position: 'relative', ...style,
    }}>
      {children}
    </div>
  )
}

function SentenceTapeBody({ s, u, mobile, target = 'reveal' }) {
  const { sentences, sentence } = current(s)
  return (
    <div style={{ padding: mobile ? '10px 14px 14px' : '12px 22px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: -6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconBtn title="Play sentence audio">▶ Listen</IconBtn>
        </span>
        <Pager index={s.sIdx % sentences.length} count={sentences.length} onChange={i => u({ sIdx: i, tok: null, enShown: false })} />
      </div>
      <SentenceText sentence={sentence} furigana={s.furigana} target={target} size={mobile ? 19 : 23} active={s.tok} onTap={i => u({ tok: i })} />
      {!sentence.containsForm && <SpellingNote />}
      <div style={{ marginTop: 2 }}>
        <English sentence={sentence} mode={s.english} revealed={s.enShown} onReveal={() => u({ enShown: true })} />
      </div>
    </div>
  )
}

// ── Baseline: today ───────────────────────────────────────────────────────

export function Baseline({ mobile, s, u }) {
  const { flip, next } = actions(u)
  const { word, sentence } = current(s)
  const w = cardWidth(mobile)
  const back = (
    <BackWord
      word={word}
      extra={(
        <Japanese as="div" style={{ fontFamily: KANJI_FONT, fontSize: '3.4cqw', color: '#888', textAlign: 'center', lineHeight: 1.5, letterSpacing: '0.03em' }}>
          {sentence.japanese}
        </Japanese>
      )}
      bar={<KanjiBar word={word} scale={0.8} />}
    />
  )
  return (
    <DrillScreen mobile={mobile}>
      <DrillStack mobile={mobile}>
        <PaperCard width={w} flipped={s.flipped} onFlip={flip} front={<FrontWord word={word} showReading={false} />} back={back} />
        <VerdictRow flipped={s.flipped} width={w} mobile={mobile} onVerdict={next} />
        <UndoSlot width={w} />
      </DrillStack>
    </DrillScreen>
  )
}

// ── A: Sentence tape ──────────────────────────────────────────────────────

export function SentenceTapeConcept({ mobile, s, u }) {
  const { flip, next } = actions(u)
  const { word } = current(s)
  const w = cardWidth(mobile)
  const tapeW = mobile ? w : 620
  const back = <BackWord word={word} bar={s.kanjiBar ? <KanjiBar word={word} /> : null} />
  const tape = s.flipped && (
    <Tape width={tapeW} animateKey={`${word.id}-tape`}>
      <SentenceTapeBody s={s} u={u} mobile={mobile} />
    </Tape>
  )
  const underCard = s.tapePos === 'card'
  return (
    <DrillScreen mobile={mobile}>
      <DrillStack mobile={mobile}>
        <PaperCard width={w} flipped={s.flipped} onFlip={flip} front={<FrontWord word={word} showReading={false} />} back={back} />
        {underCard && <div style={{ minHeight: mobile ? 196 : 168, display: 'flex', justifyContent: 'center' }}>{tape}</div>}
        <VerdictRow flipped={s.flipped} width={w} mobile={mobile} onVerdict={next} />
        {!underCard && <div style={{ minHeight: mobile ? 0 : 168, display: 'flex', justifyContent: 'center', marginTop: 4 }}>{tape}</div>}
        {!underCard && mobile ? null : <UndoSlot width={w} />}
      </DrillStack>
    </DrillScreen>
  )
}

// ── B: Kanji family ───────────────────────────────────────────────────────

function KanjiPanelBody({ s, mobile, dark }) {
  const { word, kanji: ch } = current(s)
  const k = KANJI[ch]
  const fam = kanjiFamily(ch, word)
  const max = mobile ? 4 : 5
  const header = (
    <div style={{ display: 'flex', flexDirection: mobile ? 'row' : 'column', alignItems: mobile ? 'center' : 'flex-start', gap: mobile ? 14 : 6 }}>
      <Japanese style={{ fontFamily: KANJI_FONT, fontSize: mobile ? 40 : 52, lineHeight: 1, color: dark ? TEXT : INK }}>{ch}</Japanese>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: 15, color: dark ? TEXT : '#333' }}>{k.meanings.slice(0, 3).join(', ')}</span>
        <KanjiReadings ch={ch} dark={dark} />
      </div>
    </div>
  )
  const groups = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <FamilyGroup title="Words you know" items={fam.known} ch={ch} dark={dark} compact max={max} empty={`None yet. ${ch} is new to you`} />
      <FamilyGroup title="Also in this lesson" items={fam.lesson} ch={ch} dark={dark} compact max={max} empty="Only this word" />
      {s.showCommon !== false && <FamilyGroup title="Common, not learned yet" items={fam.common} ch={ch} dark={dark} compact dim max={mobile ? 3 : 4} empty="None" />}
    </div>
  )
  return (
    <div style={{
      padding: mobile ? '12px 14px 14px' : '14px 22px 16px',
      display: mobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '130px minmax(0, 1fr)', gap: mobile ? 12 : 18,
    }}>
      {header}
      {groups}
    </div>
  )
}

export function KanjiFamilyConcept({ mobile, s, u }) {
  const { flip, next } = actions(u)
  const { word, kanji } = current(s)
  const w = cardWidth(mobile)
  const back = <BackWord word={word} bar={<KanjiBar word={word} selected={kanji} onSelect={ch => u({ kanji: ch })} />} />
  return (
    <DrillScreen mobile={mobile}>
      <DrillStack mobile={mobile}>
        <PaperCard width={w} flipped={s.flipped} onFlip={flip} front={<FrontWord word={word} showReading={false} />} back={back} />
        <div style={{ minHeight: mobile ? 250 : 210, display: 'flex', justifyContent: 'center' }}>
          {s.flipped && (
            <Tape width={mobile ? w : 680} animateKey={`${word.id}-kanji`}>
              <KanjiPanelBody s={{ ...s, kanji }} mobile={mobile} />
            </Tape>
          )}
        </div>
        <VerdictRow flipped={s.flipped} width={w} mobile={mobile} onVerdict={next} />
      </DrillStack>
    </DrillScreen>
  )
}

// ── C: Context band (sentence + kanji, tabbed) ────────────────────────────

export function ContextBandConcept({ mobile, s, u }) {
  const { flip, next } = actions(u)
  const { word, chars, kanji } = current(s)
  const w = cardWidth(mobile)
  const bandW = mobile ? w : 680
  const tabs = [{ id: 'sentence', label: 'Sentence' }, ...chars.map(ch => ({ id: ch, label: ch, sub: KANJI[ch].meaning }))]
  const activeTab = s.tab === 'sentence' ? 'sentence' : kanji
  const pick = id => u(id === 'sentence' ? { tab: 'sentence', collapsed: false } : { tab: 'kanji', kanji: id, collapsed: false })

  const band = s.flipped && (
    <div key={`${word.id}-band`} className="lab-slide-down" style={{ width: bandW }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, paddingLeft: 8 }}>
        {tabs.map(t => {
          const on = t.id === activeTab && !s.collapsed
          return (
            <button key={t.id} type="button" className={on ? undefined : 'lab-tab'} onClick={() => pick(t.id)} style={{
              border: 'none', borderRadius: '6px 6px 0 0', padding: mobile ? '6px 10px' : '6px 14px',
              background: on ? PAPER : 'rgba(255,255,255,0.08)', color: on ? INK : 'rgba(255,255,255,0.6)',
              fontFamily: FONT, fontSize: 13, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'baseline', gap: 6,
            }}>
              {t.id === 'sentence' ? t.label : <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 16 }}>{t.label}</Japanese>}
              {t.sub && !mobile && <span style={{ fontSize: 11, opacity: 0.7 }}>{t.sub}</span>}
            </button>
          )
        })}
        <span style={{ flex: 1 }} />
        <button type="button" className="lab-icon-btn lab-icon-btn--dark" onClick={() => u(p => ({ collapsed: !p.collapsed }))} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontFamily: FONT, fontSize: 12, padding: '4px 8px', borderRadius: 6 }}>
          {s.collapsed ? 'Show' : 'Hide'}
        </button>
      </div>
      {!s.collapsed && (
        <div style={{ background: PAPER, color: INK, borderRadius: activeTab === 'sentence' ? '0 6px 6px 6px' : 6, boxShadow: '0 4px 0 rgba(0,0,0,0.25)' }}>
          {activeTab === 'sentence'
            ? <SentenceTapeBody s={s} u={u} mobile={mobile} />
            : <KanjiPanelBody s={{ ...s, kanji }} mobile={mobile} />}
        </div>
      )}
    </div>
  )

  return (
    <DrillScreen mobile={mobile}>
      <DrillStack mobile={mobile}>
        <PaperCard width={w} flipped={s.flipped} onFlip={flip} front={<FrontWord word={word} showReading={false} />} back={<BackWord word={word} />} />
        <div style={{ minHeight: mobile ? 262 : 236, display: 'flex', justifyContent: 'center' }}>{band}</div>
        <VerdictRow flipped={s.flipped} width={w} mobile={mobile} onVerdict={next} />
      </DrillStack>
    </DrillScreen>
  )
}

// ── D: Sentence on the front (optional mode) ──────────────────────────────

export function SentenceFrontConcept({ mobile, s, u }) {
  const { flip, next } = actions(u)
  const { word, sentence } = current(s)
  const w = cardWidth(mobile)
  const usable = sentence.containsForm
  const cloze = s.frontStyle === 'cloze'

  const front = usable ? (
    <Paper>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3cqw', padding: '0 7cqw' }}>
        <SentenceText sentence={sentence} furigana={s.furigana} target={cloze ? 'blank' : 'highlight'} size="6.4cqw" align="center" lineHeight={2.1} />
        {cloze && <div style={{ fontFamily: FONT, fontSize: '4.4cqw', color: '#666', textAlign: 'center' }}>{word.gloss}</div>}
      </div>
      <div style={{ position: 'absolute', top: '3cqw', left: '3cqw', fontFamily: FONT, fontSize: '3.4cqw', color: 'rgba(0,0,0,0.3)' }}>{cloze ? 'Fill the gap' : 'Read the marked word'}</div>
    </Paper>
  ) : (
    <Paper>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BigWord word={word} showReading={false} />
      </div>
      <div style={{ position: 'absolute', bottom: '3cqw', left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontSize: '3.2cqw', color: '#8a6200' }}>No sentence uses this spelling, so the word is shown</div>
    </Paper>
  )

  return (
    <DrillScreen mobile={mobile}>
      <DrillStack mobile={mobile}>
        <PaperCard width={w} flipped={s.flipped} onFlip={flip} front={front} back={<BackWord word={word} />} />
        <div style={{ minHeight: mobile ? 196 : 168, display: 'flex', justifyContent: 'center' }}>
          {s.flipped && (
            <Tape width={mobile ? w : 620} animateKey={`${word.id}-dtape`}>
              <SentenceTapeBody s={s} u={u} mobile={mobile} />
            </Tape>
          )}
        </div>
        <VerdictRow flipped={s.flipped} width={w} mobile={mobile} onVerdict={next} />
      </DrillStack>
    </DrillScreen>
  )
}

// ── E: Sentence-first, no card ────────────────────────────────────────────

export function SentenceStageConcept({ mobile, s, u }) {
  const { flip, next } = actions(u)
  const { word, sentences, sentence, chars } = current(s)
  const others = sentences.filter(x => x.id !== sentence.id)
  const colW = mobile ? '100%' : 760
  return (
    <DrillScreen
      mobile={mobile}
      hud="header"
      align={s.flipped ? 'start' : 'center'}
      bottomBar={<VerdictRow flipped={s.flipped} width={mobile ? '100%' : 380} mobile={mobile} onVerdict={next} placeholder={mobile ? 'Tap the sentence to reveal' : 'Space or click the sentence to reveal'} />}
    >
      <div onClick={flip} style={{ width: colW, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: mobile ? 14 : 18, paddingTop: s.flipped ? (mobile ? 8 : 28) : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: TEXT_MUTED, fontSize: 13 }}>
          <span>Streak: 4{mobile ? ' · 17 left' : ''}</span>
          {s.flipped && <Pager dark index={s.sIdx % sentences.length} count={sentences.length} onChange={i => u({ sIdx: i, tok: null, enShown: false })} />}
        </div>
        {!sentence.containsForm && (
          <div style={{ fontSize: 13, color: '#fbbf24' }}>
            Card: <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 16, color: TEXT }}>{word.form}</Japanese>. This sentence spells it differently.
          </div>
        )}
        <SentenceText dark sentence={sentence} furigana={s.furigana} target={s.flipped ? 'reveal' : 'highlight'} size={mobile ? 26 : 38} lineHeight={mobile ? 1.9 : 2.1} active={s.tok} onTap={s.flipped ? i => u({ tok: i }) : undefined} />
        {s.flipped && (
          <div className="lab-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 16 : 20 }}>
            <div style={{ fontSize: mobile ? 15 : 17, color: TEXT_MUTED, lineHeight: 1.5 }}>{sentence.english}</div>
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: mobile ? 14 : 18, display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: mobile ? 10 : 28, alignItems: mobile ? 'flex-start' : 'center' }}>
              <Japanese as="div" style={{ fontFamily: KANJI_FONT, fontSize: mobile ? 34 : 44, lineHeight: 1.5 }}>
                <Ruby text={word.form} reading={word.reading} rtColor={BRAND_TEXT} />
              </Japanese>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: mobile ? 17 : 19 }}>{word.gloss}</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: TEXT_MUTED }}>
                  {chars.map(ch => (
                    <span key={ch}><Japanese style={{ fontFamily: KANJI_FONT, fontSize: 16, color: TEXT }}>{ch}</Japanese> {KANJI[ch].meaning}</span>
                  ))}
                </span>
              </div>
            </div>
            {others.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>More examples</div>
                {others.map(o => (
                  <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <SentenceText dark sentence={o} furigana={s.furigana} target="reveal" size={mobile ? 17 : 19} lineHeight={1.9} />
                    <span style={{ fontSize: 13, color: TEXT_MUTED }}>{o.english}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DrillScreen>
  )
}

// ── F: Word sheet, no card ────────────────────────────────────────────────

function shortGloss(g) {
  const first = (g ?? '').split(';')[0].replace(/\s*\(.*?\)\s*/g, ' ').trim()
  return first.length > 22 ? `${first.slice(0, 21)}…` : first
}

export function WordSheetConcept({ mobile, s, u }) {
  const { flip, next } = actions(u)
  const { word, sentences, sentence, chars } = current(s)
  const bigSize = word.form.length >= 4 ? (mobile ? 48 : 64) : (mobile ? 60 : 84)
  return (
    <DrillScreen
      mobile={mobile}
      hud="header"
      align={s.flipped ? 'start' : 'center'}
      bottomBar={<VerdictRow flipped={s.flipped} width={mobile ? '100%' : 380} mobile={mobile} onVerdict={next} placeholder={mobile ? 'Tap to reveal' : 'Space or click to reveal'} />}
    >
      <div style={{ width: mobile ? '100%' : 980, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 16 : 24 }}>
        <div onClick={flip} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: s.flipped ? (mobile ? 4 : 20) : 0 }}>
          {!s.flipped && <span style={{ fontSize: 13, color: TEXT_MUTED }}>Streak: 4{mobile ? ' · 17 left' : ''}</span>}
          <Japanese as="div" style={{ fontFamily: KANJI_FONT, fontSize: s.flipped ? bigSize * 0.8 : bigSize, lineHeight: 1.45, transition: 'font-size 200ms ease' }}>
            <Ruby text={word.form} reading={word.reading} show={s.flipped} rtColor={BRAND_TEXT} />
          </Japanese>
          {s.flipped && <span className="lab-fade-up" style={{ fontSize: mobile ? 17 : 20, textAlign: 'center' }}>{word.gloss}</span>}
        </div>

        {s.flipped && (
          <div className="lab-fade-up" style={{ width: '100%', display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: mobile ? 22 : 36, borderTop: `1px solid ${BORDER}`, paddingTop: mobile ? 16 : 24 }}>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>In a sentence</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconBtn dark title="Play sentence audio">▶</IconBtn>
                  <Pager dark index={s.sIdx % sentences.length} count={sentences.length} onChange={i => u({ sIdx: i, tok: null, enShown: false })} />
                </span>
              </div>
              <SentenceText dark sentence={sentence} furigana={s.furigana} target="reveal" size={mobile ? 21 : 26} active={s.tok} onTap={i => u({ tok: i })} />
              {!sentence.containsForm && <SpellingNote dark />}
              <English dark sentence={sentence} mode={s.english} revealed={s.enShown} onReveal={() => u({ enShown: true })} size={15} />
            </section>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              <span style={{ fontSize: 12, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kanji</span>
              {chars.map(ch => {
                const fam = kanjiFamily(ch, word)
                const links = [...fam.lesson.map(v => ({ ...v, tag: 'lesson' })), ...fam.known.map(v => ({ ...v, tag: 'known' }))]
                return (
                  <div key={ch} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 12, alignItems: 'start' }}>
                    <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 34, lineHeight: 1.1, textAlign: 'center' }}>{ch}</Japanese>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: FS_BASE }}>{KANJI[ch].meanings.slice(0, 3).join(', ')}</span>
                      <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                        {links.length === 0 && <span style={{ fontSize: 13, color: TEXT_MUTED }}>First word with {ch}</span>}
                        {links.slice(0, mobile ? 4 : 6).map(v => (
                          <span key={v.form} style={{ fontSize: 13, color: TEXT_MUTED, whiteSpace: 'nowrap' }}>
                            <Japanese style={{ fontFamily: KANJI_FONT, fontSize: 16, color: v.tag === 'known' ? '#4ade80' : TEXT }}>
                              {[...v.form].map((c, i) => <span key={i} style={c === ch ? { color: BRAND_TEXT } : undefined}>{c}</span>)}
                            </Japanese>
                            {' '}{shortGloss(v.gloss)}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                )
              })}
              <span style={{ fontSize: 12, color: TEXT_MUTED }}><span style={{ color: '#4ade80' }}>Green</span> = a word you already know · white = also in this lesson</span>
            </section>
          </div>
        )}
      </div>
    </DrillScreen>
  )
}


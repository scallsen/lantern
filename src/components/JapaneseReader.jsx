import Japanese from './Japanese.jsx'
import { TEXT_MUTED } from '../data/theme.js'
import { useAccent } from '../context/ModuleThemeContext.jsx'

// Hover is a CSS class (.reader-token) per the StrictMode rule, not a
// hovered-index useState as it was originally. The two highlight colours are
// themeable per call site (Story's light newspaper/letter layouts pass their
// own), so they travel as CSS custom properties on the wrapper for the
// :hover rules to read — a class can't otherwise take per-instance colours.
// `vocabHighlight` defaults to the module accent; it was Immersion's red
// hardcoded, which only looked right because Immersion was the first reader.
export function TokenizedBody({
  tokens,
  vocabMap,
  onWordClick,
  showFurigana,
  activeIdx,
  vocabHighlight,
  hoverBg = 'rgba(255,255,255,0.1)',
  rtColor = TEXT_MUTED,
}) {
  const accent = useAccent()
  const vocabBg = vocabHighlight ?? `${accent}38`

  if (!Array.isArray(tokens) || tokens.length === 0) return null
  return (
    <Japanese style={{ '--reader-hover': hoverBg, '--reader-vocab': vocabBg }}>
      {tokens.map((tok, i) => {
        if (!tok.w) return <span key={i}>{tok.t}</span>
        const isActive = activeIdx === i
        const inVocab = !!vocabMap[tok.t]
        return (
          <span
            key={i}
            className={inVocab ? 'reader-token reader-token--vocab' : 'reader-token'}
            onClick={e => { e.stopPropagation(); onWordClick(tok, e, i) }}
            style={{
              cursor: 'pointer',
              borderRadius: 3,
              background: isActive
                ? inVocab ? vocabBg : hoverBg
                : 'transparent',
              padding: '0 1px',
              transition: 'background 80ms',
            }}
          >
            {showFurigana && tok.r
              ? (
                <ruby>
                  {tok.t}
                  <rt style={{ fontSize: '0.55em', color: rtColor, letterSpacing: 0 }}>{tok.r}</rt>
                </ruby>
              )
              : tok.t}
          </span>
        )
      })}
    </Japanese>
  )
}

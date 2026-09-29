import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import DrillSettingsPanel from './DrillSettingsPanel.jsx'
import { DRILL_SETTINGS_DEFAULTS } from '../hooks/useDrillSettings.js'

const VOICES = [{ name: 'Kyoko' }, { name: 'Otoya' }]

function render(props) {
  return renderToStaticMarkup(
    <DrillSettingsPanel settings={DRILL_SETTINGS_DEFAULTS} onChange={() => {}} {...props} />
  )
}

describe('DrillSettingsPanel', () => {
  it('groups every setting under the part of the card it changes', () => {
    const html = render({ backupVoices: VOICES })
    for (const group of ['Card front', 'Card back', 'Details', 'Sentence', 'Audio', 'Interface']) {
      expect(html).toContain(`>${group}<`)
    }
    // One audio row per face, plus the group heading of the same name.
    expect(html.match(/>Audio</g)).toHaveLength(3)
  })

  it('hides the voice row for a deck with no recordings', () => {
    expect(render({ backupVoices: VOICES })).toContain('>Voice<')
    expect(render({ backupVoices: VOICES, hasRecordedVoices: false })).not.toContain('>Voice<')
  })

  it('hides the backup voice row when the device offers no voices', () => {
    expect(render({ backupVoices: VOICES })).toContain('>Backup voice<')
    expect(render({ backupVoices: [] })).not.toContain('>Backup voice<')
  })

  it('keeps the audio group for Play sentence even when neither voice row applies', () => {
    const html = render({ backupVoices: [], hasRecordedVoices: false })
    expect(html.match(/>Audio</g)).toHaveLength(3)
    expect(html).toContain('>Play sentence<')
  })

  it('drops the sentence group, and disables Play sentence, while the sentence is off', () => {
    const html = render({ settings: { ...DRILL_SETTINGS_DEFAULTS, sentence: false } })
    expect(html).not.toContain('>Translation<')
    expect(html).toMatch(/aria-checked="false" aria-label="Play sentence" disabled=""/)
  })

  it('keeps at least one half of the details panel on', () => {
    const html = render({ settings: { ...DRILL_SETTINGS_DEFAULTS, kanjiMeanings: false } })
    expect(html).toMatch(/aria-label="Sentence" disabled=""/)
    expect(html).not.toMatch(/aria-label="Kanji" disabled=""/)
  })

  it('hides the panel’s halves with the panel', () => {
    const html = render({ settings: { ...DRILL_SETTINGS_DEFAULTS, details: false } })
    expect(html).toContain('>Show under card<')
    expect(html).not.toContain('aria-label="Kanji"')
  })

  it('reports switch state to assistive tech', () => {
    const html = render({ settings: { ...DRILL_SETTINGS_DEFAULTS, furigana: false }, backupVoices: VOICES })
    expect(html).toContain('aria-checked="false" aria-label="Furigana"')
  })
})

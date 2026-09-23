import { useState } from 'react'
import ActionBar from './ActionBar.jsx'
import Button from './Button.jsx'
import { TEXT_MUTED, FS_CAPTION } from '../data/theme.js'

export default {
  title: 'Layout/Action Bar',
  component: ActionBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: { component: "A bar pinned to the bottom of the screen holding the one action the whole screen exists for — starting a drill, generating a story.\n\n**Use when** a screen builds up to a single main action that should stay in reach while the person scrolls, like picking words and then starting the drill.\n\n**Don't use** for secondary or per-item actions; put those next to what they affect. One Action Bar per screen.\n\n*Build note:* its button is `size=\"xl\"`; pad the scroll area by `ACTION_BAR_HEIGHT` so content isn't hidden behind it." },
      story: { inline: false, iframeHeight: 200 },
    },
  },
}

function DrillSelection() {
  const [selected] = useState(3)
  return (
    <ActionBar>
      <Button variant="primary" size="xl" disabled={selected === 0}>{`Start Drill (${selected})`}</Button>
    </ActionBar>
  )
}

export const SingleAction = { render: () => <DrillSelection /> }

export const WithLeading = {
  render: () => (
    <ActionBar
      maxWidth={760}
      leading={<span style={{ fontSize: FS_CAPTION, color: TEXT_MUTED }}>214 words in context</span>}
    >
      <Button size="xl">Generate</Button>
    </ActionBar>
  ),
}

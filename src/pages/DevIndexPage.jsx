import PageHeader from '../components/PageHeader.jsx'
import DataList from '../components/DataList.jsx'
import { FONT, TRACKING, TEXT, TEXT_MUTED, FS_BASE, FS_CONTENT_HEADING } from '../data/theme.js'

const BG = '#1E1E1E'

// Kept in sync with App.jsx's LABS map.
const LAB_PAGES = [
  { href: '/dev/home-flow', title: 'Home Flow', description: 'Three concepts for the whole learn → remember loop.' },
  { href: '/dev/textbook-flow', title: 'Textbook Flow', description: 'Round two of Home Flow — every open question as a switch on one mock.' },
  { href: '/dev/textbook-picker', title: 'Textbook Picker', description: 'Four candidate layouts for the change-textbook picker.' },
  { href: '/dev/cover-rotation', title: 'Cover Rotation', description: "Animation variants for the Practice card's cover art." },
  { href: '/dev/secondary-button-lab', title: 'Secondary Button Lab', description: "Primary+secondary action pairings for PrimaryCard's ActionsRow." },
  { href: '/dev/settings-lab', title: 'Settings Lab', description: 'Alternative drill-settings sidebar layouts.' },
  { href: '/dev/drill-flip-lab', title: 'Drill Flip Lab', description: "The Review card's flip-position fix, plus keyboard-hint options." },
  { href: '/dev/toast-lab', title: 'Toast Lab', description: 'Four placement variants for the add-confirmation toast.' },
  { href: '/dev/tracked-stat', title: 'Tracked Stat', description: 'Candidate shapes for a shared per-module "tracked" stat component.' },
  { href: '/dev/segment-colors', title: 'Segment Colors', description: 'Candidate palettes for the card-state colours (Distribution Bar).' },
  { href: '/dev/accent-polish', title: 'Accent Polish', description: 'Accent-red text legibility before/after, and loading-pulse variants.' },
  { href: '/dev/drill-context', title: 'Drill Card Context', description: "Seven directions for giving the drill card's example sentence and kanji real room, each on a desktop and a phone frame." },
  { href: '/dev/drill-context/band-v2', title: 'Context Band v2', description: 'The context band again: two tabs, a sentence-first pane, three lighter kanji views.' },
  { href: '/dev/drill-context/details-v3', title: 'Details Panel v3', description: 'Four designs for the tab/hide bar, a single-sentence pane, and the rename to Details.' },
  { href: '/dev/drill-context/details-v4', title: 'Details Panel v4', description: 'Four layouts showing the sentence and kanji at once, and four ways to reserve the panel before the flip.' },
  { href: '/dev/drill-context/details-v5', title: 'Details Panel v5', description: 'The locked panel (sentence above, kanji footer), related-word lists, and five pre-flip states.' },
  { href: '/dev/drill-context/details-v6', title: 'Details Panel v6', description: 'The settled panel: a redacted front that fades to the real content on the flip.' },
  { href: '/dev/drill-context/details-v7', title: 'Details Panel v7', description: 'The reveal timed to the flip, sentence-only and kanji-only states, and the reading below the word.' },
  { href: '/dev/drill-context/dark-panel', title: 'Details Panel Dark', description: 'The details panel in four dark palettes beside the light one.' },
  { href: '/dev/drill-context/height', title: 'Drill Screen Height', description: 'Keeping the card at 380 × 280 on short windows — pinning the buttons to the bottom won.' },
  // Plain HTML pages under voice-lab/, served by the dev server as files
  // rather than routed by App.jsx.
  { href: '/voice-lab/', static: true, title: 'Voice Lab', description: 'Eight Voicevox voices reading 20 Genki words and their example sentences — picked the female voice.' },
  { href: '/voice-lab/speed/', static: true, title: 'Sentence Speed Lab', description: 'Pre-generated slow sentences vs slowing them down in the browser.' },
]

function pageRowContent(page) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: FS_BASE, color: TEXT, marginBottom: 4 }}>{page.title}</div>
      <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, lineHeight: 1.4 }}>{page.description}</div>
    </div>
  )
}

const COLUMNS = [{ key: 'content', render: pageRowContent, wrap: true }]

export default function DevIndexPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: BG, fontFamily: FONT, letterSpacing: TRACKING, display: 'flex', flexDirection: 'column', color: TEXT, overflow: 'hidden' }}>
      <PageHeader crumbs={[{ label: 'Design labs' }]} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 60px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: FS_CONTENT_HEADING, color: TEXT, marginBottom: 8 }}>Design labs</div>
          <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, marginBottom: 24, lineHeight: 1.5 }}>
            Retired explorations from building Lantern — each one compared a set of design directions side by side before one shipped. Kept as a record; they no longer track the live app.
          </div>
          <DataList
            columns={COLUMNS}
            rows={LAB_PAGES}
            rowKey={page => page.href}
            navigate={{ href: page => page.static ? page.href : `#${page.href}` }}
          />
        </div>
      </main>
    </div>
  )
}

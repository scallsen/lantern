import PageHeader from '../components/PageHeader.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import DataList from '../components/DataList.jsx'
import { FONT, TRACKING, TEXT, TEXT_MUTED, FS_BASE, FS_CONTENT_HEADING, SPACE_32 } from '../data/theme.js'

const BG = '#1E1E1E'

// Kept in sync with App.jsx's own '/dev/*' branches and their comments —
// this is the index for what's already routed there, not a second source
// of truth for what should exist.
const LAB_PAGES = [
  { href: '/dev/home-cards', title: 'Home Cards', description: "The home page's two primary cards, fed real data through real logic, every state." },
  { href: '/dev/toast-lab', title: 'Toast Lab', description: 'Four placement variants for the add-confirmation toast.' },
  { href: '/dev/settings-lab', title: 'Settings Lab', description: 'Alternative drill-settings sidebar layouts.' },
  { href: '/dev/textbook-picker', title: 'Textbook Picker', description: 'Four candidate layouts for the change-textbook picker.' },
  { href: '/dev/home-flow', title: 'Home Flow', description: 'Three concepts for the whole learn → remember loop.' },
  { href: '/dev/textbook-flow', title: 'Textbook Flow', description: 'Round two of Home Flow — every open question as a switch on one mock.' },
  { href: '/dev/tracked-stat', title: 'Tracked Stat', description: 'Candidate shapes for the future shared per-module "tracked" stat component.' },
  { href: '/dev/secondary-button-lab', title: 'Secondary Button Lab', description: "Primary+secondary action pairings for PrimaryCard's ActionsRow." },
  { href: '/dev/cover-rotation', title: 'Cover Rotation', description: "Animation variants for the Practice card's cover art." },
  { href: '/dev/drill-flip-lab', title: 'Drill Flip Lab', description: "The Review card's flip-position fix, plus keyboard-hint options." },
  { href: '/dev/segment-colors', title: 'Segment Colors', description: 'Candidate palettes for SEGMENT_COLORS (DistributionBar).' },
  { href: '/dev/accent-polish', title: 'Accent Polish', description: 'Accent-red text legibility before/after + loading pulse variants.' },
]

const COMPONENT_LIBRARY_PAGES = [
  { href: '/dev/style-guide', title: 'Style Guide', description: 'The living component library and design-system progress tracker.' },
]

function pageRowContent(page) {
  return (
    <div>
      <div style={{ fontSize: FS_BASE, color: TEXT, marginBottom: 4 }}>{page.title}</div>
      <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, lineHeight: 1.4 }}>{page.description}</div>
    </div>
  )
}

const COLUMNS = [{ key: 'content', render: pageRowContent, wrap: true }]

export default function DevIndexPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: BG, fontFamily: FONT, letterSpacing: TRACKING, display: 'flex', flexDirection: 'column', color: TEXT, overflow: 'hidden' }}>
      <PageHeader crumbs={[{ label: 'Lantern', href: '#/' }, { label: 'Dev' }]} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 60px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: FS_CONTENT_HEADING, color: TEXT, marginBottom: 8 }}>Dev pages</div>
          <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, marginBottom: 24, lineHeight: 1.5 }}>
            Dev-only lab pages. None are linked from the dashboard, but they ship in the production bundle. Retired pages live on <code>archive/design-labs</code> instead of here.
          </div>

          <SectionHeader title="Component Library" />
          <DataList
            columns={COLUMNS}
            rows={COMPONENT_LIBRARY_PAGES}
            rowKey={page => page.href}
            navigate={{ href: page => `#${page.href}` }}
          />

          <SectionHeader title="Design Labs" marginTop={SPACE_32} />
          <DataList
            columns={COLUMNS}
            rows={LAB_PAGES}
            rowKey={page => page.href}
            navigate={{ href: page => `#${page.href}` }}
          />
        </div>
      </main>
    </div>
  )
}

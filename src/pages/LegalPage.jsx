import PageHeader from '../components/PageHeader.jsx'
import AuthSlot from '../components/AuthSlot.jsx'
import Markdown from '../components/Markdown.jsx'
// Inlined at build time by Vite, so each page always shows the committed file
// rather than a copy that drifts from it.
import PRIVACY_MD from '../../PRIVACY.md?raw'
import TERMS_MD from '../../TERMS.md?raw'
import { FONT, TRACKING, TEXT, CONTENT_STANDARD } from '../data/theme.js'

const DOCUMENTS = {
  privacy: { title: 'Privacy Policy', source: PRIVACY_MD },
  terms: { title: 'Terms of Service', source: TERMS_MD },
}

export default function LegalPage({ document }) {
  const { title, source } = DOCUMENTS[document]

  const shell = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: FONT,
    letterSpacing: TRACKING,
    color: TEXT,
  }

  const scroll = {
    flex: 1,
    overflowY: 'auto', scrollbarGutter: 'stable both-edges',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }

  return (
    <div style={shell}>
      <PageHeader crumbs={[{ label: 'Lantern', href: '#/' }, { label: title }]} rightSlot={<AuthSlot />} />
      <div style={scroll}>
        <div style={{ width: '100%', maxWidth: CONTENT_STANDARD }}>
          {/* The document keeps its own H1 so it reads properly as a file on
              GitHub; here the page header already carries the title. */}
          <Markdown source={source.replace(/^#\s+.*\n+/, '')} />
        </div>
      </div>
    </div>
  )
}

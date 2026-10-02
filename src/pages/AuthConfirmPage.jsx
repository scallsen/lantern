import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import AuthSlot from '../components/AuthSlot.jsx'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { setPendingToast } from '../utils/pendingToast.js'
import { FONT, TRACKING, TEXT, TEXT_MUTED, DANGER, FS_BASE, FS_CONTENT_HEADING, SPACE_16, SPACE_24 } from '../data/theme.js'

// The landing page for the backup link in a sign-in email
// (`#/auth/confirm?token_hash=…&type=email`, built by the templates in
// supabase/templates/).
//
// It asks for a click instead of signing in on load because mail scanners
// (Outlook's Safe Links and similar) fetch every link in an email before the
// recipient sees it. A link that spent its token on load would be dead by the
// time the person clicked it — and since the code in the same email is the
// same token, so would the code.
function readParams() {
  const query = window.location.hash.split('?')[1] ?? ''
  const params = new URLSearchParams(query)
  return { tokenHash: params.get('token_hash'), type: params.get('type') }
}

export default function AuthConfirmPage() {
  const { user, loading, verifyEmailLink, signIn } = useAuth()
  const [{ tokenHash, type }] = useState(readParams)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Only sign-in links are handled; anything else is a link this page was
  // never meant to receive, not something to pass through to Supabase.
  const valid = Boolean(tokenHash) && type === 'email'

  async function confirm() {
    setError(null)
    setBusy(true)
    const result = await verifyEmailLink(tokenHash)
    if (!result || result.error) {
      setError('This link has expired or has already been used. Request a new one to sign in.')
      setBusy(false)
      return
    }
    setPendingToast('Signed in')
    // replace(), so Back doesn't return to a spent link.
    window.location.replace('#/')
  }

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
    padding: SPACE_24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE_16,
    textAlign: 'center',
  }

  let body
  if (loading) {
    body = null
  } else if (user && !busy) {
    body = (
      <>
        <div style={{ fontSize: FS_CONTENT_HEADING }}>You&rsquo;re already signed in</div>
        <Button size="lg" onClick={() => window.location.replace('#/')}>Go to Lantern</Button>
      </>
    )
  } else if (!valid || error) {
    body = (
      <>
        <div style={{ fontSize: FS_CONTENT_HEADING }}>This sign-in link doesn&rsquo;t work</div>
        <div style={{ fontSize: FS_BASE, color: error ? DANGER : TEXT_MUTED, lineHeight: 1.6, maxWidth: 380 }}>
          {error ?? 'It may have been copied incompletely. Request a new one to sign in.'}
        </div>
        <Button size="lg" onClick={signIn}>Sign in</Button>
      </>
    )
  } else {
    body = (
      <>
        <div style={{ fontSize: FS_CONTENT_HEADING }}>Finish signing in</div>
        <Button size="lg" disabled={busy} onClick={confirm}>Sign in to Lantern</Button>
      </>
    )
  }

  return (
    <div style={shell}>
      <PageHeader crumbs={[{ label: 'Lantern', href: '#/' }, { label: 'Sign in' }]} rightSlot={<AuthSlot />} />
      <div style={scroll}>{body}</div>
    </div>
  )
}

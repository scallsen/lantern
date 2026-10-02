import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import AuthSlot from '../components/AuthSlot.jsx'
import Button from '../components/Button.jsx'
import TopProgressBar from '../components/TopProgressBar.jsx'
import { useAuth, signedInMessage } from '../context/AuthContext.jsx'
import { useAccent } from '../context/ModuleThemeContext.jsx'
import { setPendingToast } from '../utils/pendingToast.js'
import { FONT, TRACKING, TEXT, TEXT_MUTED, DANGER, FS_BASE, FS_CONTENT_HEADING, SPACE_16, SPACE_24 } from '../data/theme.js'

// The landing page for the backup link in a sign-in email
// (`#/auth/confirm?token_hash=…&type=email`, built by the templates in
// supabase/templates/). It signs in as soon as it opens.
//
// It used to wait for a click, because mail scanners (Outlook's Safe Links
// and similar) open links before the recipient does, and a link that spent
// its token on load would be dead by the time the person clicked it — along
// with the code, which is the same token. The token travels after the `#`,
// which a browser never sends to a server, so a scanner that only fetches
// the URL never sees it; only one that runs the page in a real browser can
// spend it. That's rare enough outside some workplace and school Microsoft
// 365 accounts to trade for one less tap, and if it happens the page says the
// link was already used and offers a fresh code.
function readParams() {
  const query = window.location.hash.split('?')[1] ?? ''
  const params = new URLSearchParams(query)
  return { tokenHash: params.get('token_hash'), type: params.get('type') }
}

export default function AuthConfirmPage() {
  const { user, loading, verifyEmailLink, signIn } = useAuth()
  const accent = useAccent()
  const [{ tokenHash, type }] = useState(readParams)
  // pending → signing → (redirect) | failed; or alreadySignedIn / invalid.
  // Decided once, when auth has resolved, so the session this page itself
  // creates never reads as "already signed in" in the moment before the
  // redirect.
  const [status, setStatus] = useState('pending')
  // StrictMode runs effects twice in development; a token works once, so a
  // second attempt would fail and report "already used" over a sign-in that
  // just succeeded.
  const attempted = useRef(false)

  useEffect(() => {
    if (loading || attempted.current) return
    attempted.current = true
    if (user) { setStatus('alreadySignedIn'); return }
    // Only sign-in links are handled; anything else is a link this page was
    // never meant to receive, not something to pass through to Supabase.
    if (!tokenHash || type !== 'email') { setStatus('invalid'); return }
    setStatus('signing')
    verifyEmailLink(tokenHash).then(result => {
      if (!result || result.error) {
        setStatus('failed')
        return
      }
      setPendingToast(signedInMessage(result.data?.user))
      // replace(), so Back doesn't return to a spent link.
      window.location.replace('#/')
    })
  }, [loading, user, tokenHash, type, verifyEmailLink])

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
  if (status === 'pending' || status === 'signing') {
    body = <div style={{ fontSize: FS_BASE, color: TEXT_MUTED }}>Signing you in</div>
  } else if (status === 'alreadySignedIn') {
    body = (
      <>
        <div style={{ fontSize: FS_CONTENT_HEADING }}>You&rsquo;re already signed in</div>
        <Button size="lg" onClick={() => window.location.replace('#/')}>Go to Lantern</Button>
      </>
    )
  } else {
    body = (
      <>
        <div style={{ fontSize: FS_CONTENT_HEADING }}>This sign-in link doesn&rsquo;t work</div>
        <div style={{ fontSize: FS_BASE, color: status === 'failed' ? DANGER : TEXT_MUTED, lineHeight: 1.6, maxWidth: 380 }}>
          {status === 'failed'
            ? 'This link has expired or has already been used. Sign in again to get a new code.'
            : 'It may have been copied incompletely. Sign in again to get a new code.'}
        </div>
        <Button size="lg" onClick={signIn}>Sign in</Button>
      </>
    )
  }

  return (
    <div style={shell}>
      <PageHeader crumbs={[{ label: 'Lantern', href: '#/' }, { label: 'Sign in' }]} rightSlot={<AuthSlot />}>
        {status === 'signing' && <TopProgressBar loading color={accent} />}
      </PageHeader>
      <div style={scroll}>{body}</div>
    </div>
  )
}

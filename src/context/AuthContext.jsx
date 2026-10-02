import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import SignInDialog from '../components/SignInDialog.jsx'
import { useToast } from './ToastContext.jsx'
import { EMAIL_PROVIDER } from '../data/authProviders.js'
import {
  getLastSignIn, recordSignIn, markPendingSignIn, clearPendingSignIn, commitPendingSignIn,
} from '../utils/lastSignIn.js'

const AuthContext = createContext(null)

// Where an OAuth round trip should land the user back, and the base the email
// templates build their backup link on (`{{ .RedirectTo }}`, which is why it
// must stay a bare origin + path: the template appends '#/auth/confirm?…').
// Must be on the dashboard's redirect allowlist, or Supabase falls back to
// the Site URL.
function redirectTarget() {
  return window.location.origin + window.location.pathname
}

// The confirmation a completed sign-in gets, whichever way it came: the
// dialog closes on its own, and without this the only sign it worked is the
// header's initials quietly appearing.
// eslint-disable-next-line react-refresh/only-export-components
export function signedInMessage(user) {
  return user?.email ? `Signed in as ${user.email}` : 'Signed in'
}

const NO_TOAST = () => {}

export function AuthProvider({ children }) {
  // Optional so an AuthProvider alone (a Storybook decorator) still renders.
  const showToast = useToast()?.showToast ?? NO_TOAST
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chooserOpen, setChooserOpen] = useState(false)
  const [lastUsed, setLastUsed] = useState(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // An OAuth sign-in lands as either event depending on whether the code
      // exchange beats this subscription; a parked click is only promoted
      // once a session really exists.
      // Only a parked click counts as a sign-in worth announcing: Supabase also
      // fires SIGNED_IN for a session restored on load or in another tab.
      // Reading the marker clears it, so StrictMode's second subscription
      // doesn't toast twice.
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && commitPendingSignIn()) {
        showToast({ message: signedInMessage(session.user) })
      }
      // Use functional update to preserve reference on token refresh (same user ID).
      // Without this, every TOKEN_REFRESHED event re-runs useProgress's effect → loading flash.
      setUser(prev => {
        const next = session?.user ?? null
        if (prev?.id === next?.id) return prev
        return next
      })
    })

    return () => subscription.unsubscribe()
  }, [showToast])

  // However the session arrived — a code, a provider, another tab — the
  // chooser has nothing left to offer once someone is signed in.
  useEffect(() => {
    if (user) setChooserOpen(false)
  }, [user])

  // Kept parameterless so the six existing call sites (AuthSlot, VocabSrsModule,
  // StoryModule, EpisodeDrill, ...) need no change: with more than one provider
  // available, "Sign in" can no longer mean "redirect to GitHub" — it has to ask.
  function signIn() {
    // A click parked by an earlier, abandoned OAuth attempt must not be
    // credited to whatever this attempt turns out to be.
    clearPendingSignIn()
    setLastUsed(getLastSignIn())
    setChooserOpen(true)
  }

  async function signInWithProvider(provider) {
    markPendingSignIn(provider)
    const result = await supabase?.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTarget() },
    })
    if (result?.error) clearPendingSignIn()
    return result
  }

  // Sends one email carrying both a code and a backup link. Creates the
  // account on first use, so there's no separate sign-up path. Supabase
  // answers the same way whether or not the address has an account, so the
  // form can't be used to discover who's signed up.
  function signInWithEmail(email, captchaToken) {
    return supabase?.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTarget(),
        shouldCreateUser: true,
        captchaToken: captchaToken ?? undefined,
      },
    })
  }

  async function verifyEmailCode(email, token) {
    const result = await supabase?.auth.verifyOtp({ email, token, type: 'email' })
    if (result && !result.error) {
      recordSignIn(EMAIL_PROVIDER)
      showToast({ message: signedInMessage(result.data?.user) })
    }
    return result
  }

  // The backup link in the email. Takes a token hash rather than relying on
  // Supabase's own redirect so it works in any browser — PKCE would otherwise
  // tie the link to the browser that asked for it — and so the token is only
  // spent when a person clicks, not when a mail scanner fetches the URL.
  async function verifyEmailLink(tokenHash) {
    const result = await supabase?.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
    if (result && !result.error) recordSignIn(EMAIL_PROVIDER)
    return result
  }

  // Announced like a sign-in, unless the caller has its own message for the
  // moment — account deletion signs out on the way to "Account deleted".
  // An options object, not a bare flag: `onClick={signOut}` passes the event.
  async function signOut({ quiet = false } = {}) {
    const result = await supabase?.auth.signOut()
    if (!quiet && result && !result.error) showToast({ message: 'Signed out' })
    return result
  }

  // Attaches another provider to the *current* account rather than starting a
  // second one. Requires "Manual linking" to be enabled for the project.
  function linkProvider(provider) {
    return supabase?.auth.linkIdentity({
      provider,
      options: { redirectTo: redirectTarget() },
    })
  }

  function unlinkProvider(identity) {
    return supabase?.auth.unlinkIdentity(identity)
  }

  // onAuthStateChange above intentionally keeps the previous object when the
  // id is unchanged, so a change to identities alone (linking/unlinking) would
  // never reach the UI. This forces the new object through.
  async function refreshUser() {
    const { data } = await supabase.auth.getUser()
    setUser(data?.user ?? null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signInWithProvider,
      signInWithEmail,
      verifyEmailCode,
      verifyEmailLink,
      signOut,
      linkProvider,
      unlinkProvider,
      refreshUser,
    }}>
      {children}
      <SignInDialog
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        onProvider={signInWithProvider}
        onEmail={signInWithEmail}
        onVerifyCode={verifyEmailCode}
        lastUsed={lastUsed}
      />
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

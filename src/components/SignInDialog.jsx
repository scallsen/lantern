import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import Badge from './Badge.jsx'
import TextInput from './TextInput.jsx'
import ProviderIcon from './ProviderIcon.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { useTurnstile, TURNSTILE_SITE_KEY } from '../hooks/useTurnstile.js'
import { AUTH_PROVIDERS, EMAIL_PROVIDER, EMAIL_SIGN_IN_ENABLED, EMAIL_CODE_LENGTH } from '../data/authProviders.js'
import { TEXT, TEXT_MUTED, FS_BASE, FS_SM, SPACE_4, SPACE_8, SPACE_12, SPACE_16, DANGER } from '../data/theme.js'

// Matches Supabase's own minimum gap between two emails to one address, so
// the button can't offer a resend the server would refuse anyway.
const RESEND_COOLDOWN_S = 60

const linkStyle = { color: TEXT_MUTED, textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)' }

function LastUsed() {
  return <Badge tone="accent">Last used</Badge>
}

function Label({ children, lastUsed }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE_8 }}>
      {children}
      {lastUsed && <LastUsed />}
    </span>
  )
}

export default function SignInDialog({
  open,
  onClose,
  onProvider,
  onEmail,
  onVerifyCode,
  lastUsed = null,
  emailEnabled = EMAIL_SIGN_IN_ENABLED,
  turnstileSiteKey = TURNSTILE_SITE_KEY,
}) {
  const isMobile = useIsMobile()
  const [step, setStep] = useState('choose')
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const captcha = useTurnstile(emailEnabled ? turnstileSiteKey : null, open)

  // A dialog reopened after a failed or completed attempt should start clean,
  // not show the previous attempt's error or code step. The typed address is
  // kept — reopening to fix a typo shouldn't mean retyping it.
  useEffect(() => {
    if (open) {
      setStep('choose')
      setCode('')
      setBusy(false)
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (step !== 'code') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [step])

  async function handleProvider(id) {
    setError(null)
    setBusy(true)
    const { error: err } = (await onProvider(id)) ?? {}
    // On success the browser is already navigating away, so only the failure
    // path needs to restore the button.
    if (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function sendCode(address) {
    setError(null)
    setBusy(true)
    const { error: err } = (await onEmail(address, captcha.token)) ?? {}
    captcha.reset()
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setSentTo(address)
    setCode('')
    setResendAt(Date.now() + RESEND_COOLDOWN_S * 1000)
    setNow(Date.now())
    setStep('code')
  }

  // The button stays enabled with an empty field so its "Last used" badge
  // isn't greyed out; `required` and type="email" let the browser explain
  // what's missing instead.
  function handleEmailSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (trimmed) sendCode(trimmed)
  }

  async function verify(value) {
    if (busy || value.length !== EMAIL_CODE_LENGTH) return
    setError(null)
    setBusy(true)
    const { error: err } = (await onVerifyCode(sentTo, value)) ?? {}
    setBusy(false)
    if (err) {
      setError(err.code === 'otp_expired' ? 'That code is wrong or has expired.' : err.message)
      setCode('')
    }
  }

  // Submits on the last digit so a phone's one-time-code autofill, or a
  // pasted code, signs straight in without a second tap.
  function handleCodeChange(value) {
    const digits = value.replace(/\D/g, '').slice(0, EMAIL_CODE_LENGTH)
    setCode(digits)
    if (digits.length === EMAIL_CODE_LENGTH) verify(digits)
  }

  const waitingOnCaptcha = captcha.required && !captcha.token
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const shownError = error ?? captcha.error

  const chooseStep = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
      {AUTH_PROVIDERS.map(p => (
        <Button
          key={p.id}
          variant="neutral"
          fullWidth
          disabled={busy}
          onClick={() => handleProvider(p.id)}
          icon={<ProviderIcon provider={p.id} />}
        >
          <Label lastUsed={lastUsed === p.id}>Continue with {p.label}</Label>
        </Button>
      ))}

      {emailEnabled && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE_8, color: TEXT_MUTED, fontSize: FS_SM }}>
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
            or
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* A real form so Enter submits and password managers recognise the
              field as the account's email. */}
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
            <TextInput
              type="email"
              name="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              disabled={busy}
              autoComplete="email"
              required
              autoFocus={lastUsed === EMAIL_PROVIDER}
              aria-label="Email address"
            />
            <Button
              type="submit"
              variant="neutral"
              fullWidth
              disabled={busy || waitingOnCaptcha}
              icon={<ProviderIcon provider={EMAIL_PROVIDER} />}
            >
              <Label lastUsed={lastUsed === EMAIL_PROVIDER}>Continue with email</Label>
            </Button>
          </form>
          <div style={{ color: TEXT_MUTED, fontSize: FS_SM, lineHeight: 1.5 }}>
            We&rsquo;ll email you a sign-in code &mdash; no password needed. New here? This creates your account.
          </div>
        </>
      )}

      <div style={{ color: TEXT_MUTED, fontSize: FS_SM, lineHeight: 1.5, marginTop: SPACE_4 }}>
        By continuing, you agree to the{' '}
        <a href="#/terms" target="_blank" rel="noopener noreferrer" className="attribution-link" style={linkStyle}>Terms of Service</a>
        {' '}and{' '}
        <a href="#/privacy" target="_blank" rel="noopener noreferrer" className="attribution-link" style={linkStyle}>Privacy Policy</a>.
      </div>
    </div>
  )

  const codeStep = (
    <form
      onSubmit={e => { e.preventDefault(); verify(code) }}
      style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}
    >
      <div style={{ fontSize: FS_BASE, lineHeight: 1.6 }}>
        Enter the {EMAIL_CODE_LENGTH}-digit code sent to <span style={{ color: TEXT, wordBreak: 'break-all' }}>{sentTo}</span>.
      </div>
      <TextInput
        name="code"
        value={code}
        onChange={handleCodeChange}
        placeholder={'0'.repeat(EMAIL_CODE_LENGTH)}
        disabled={busy}
        autoFocus
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={EMAIL_CODE_LENGTH}
        aria-label="Sign-in code"
        size="lg"
        style={{ fontSize: 22, letterSpacing: '0.3em', textAlign: 'center' }}
      />
      <Button type="submit" fullWidth disabled={busy || code.length !== EMAIL_CODE_LENGTH}>
        Sign in
      </Button>
      <div style={{ color: TEXT_MUTED, fontSize: FS_SM, lineHeight: 1.5 }}>
        The email also has a sign-in link, if that&rsquo;s easier. Can&rsquo;t find it? Check your spam folder.
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACE_8 }}>
        <Button variant="ghost-muted" size="sm" disabled={busy} onClick={() => { setStep('choose'); setError(null) }}>
          Change email
        </Button>
        <Button variant="ghost-muted" size="sm" disabled={busy || resendIn > 0 || waitingOnCaptcha} onClick={() => sendCode(sentTo)}>
          {resendIn > 0 ? `Resend code (${resendIn}s)` : 'Resend code'}
        </Button>
      </div>
    </form>
  )

  return (
    <Modal open={open} onClose={onClose} title="Sign in or create account" size="sm" isMobile={isMobile}>
      <div>
        {step === 'code' ? codeStep : chooseStep}

        {/* Outside both steps so the widget survives the switch to the code
            step — a resend needs a fresh token from the same widget. */}
        <div ref={captcha.containerRef} />

        {shownError && (
          <div role="alert" style={{ color: DANGER, fontSize: FS_SM, marginTop: SPACE_16, lineHeight: 1.5 }}>
            {shownError}
          </div>
        )}
      </div>
    </Modal>
  )
}

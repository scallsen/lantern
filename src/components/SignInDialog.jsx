import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import Badge from './Badge.jsx'
import TextInput from './TextInput.jsx'
import ProviderIcon from './ProviderIcon.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { useTurnstile, TURNSTILE_SITE_KEY } from '../hooks/useTurnstile.js'
import { codeFromText } from '../utils/signInCode.js'
import { AUTH_PROVIDERS, EMAIL_PROVIDER, EMAIL_SIGN_IN_ENABLED, EMAIL_CODE_LENGTH } from '../data/authProviders.js'
import { TEXT, TEXT_MUTED, FS_BASE, FS_SM, SPACE_8, SPACE_12, SPACE_16, DANGER } from '../data/theme.js'

// Matches Supabase's own minimum gap between two emails to one address, so
// the button can't offer a resend the server would refuse anyway.
const RESEND_COOLDOWN_S = 60

// Every button here is xl, one step above the app's usual dialog size: that's
// the size that stands as tall as the text field beside it (40px), and a
// button shorter than the field it submits reads as an afterthought.
const BUTTON_SIZE = 'xl'

const linkStyle = { color: TEXT_MUTED, textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)' }

function MethodButton({ provider, label, lastUsed, disabled, onClick }) {
  return (
    <Button
      variant="neutral"
      size={BUTTON_SIZE}
      fullWidth
      disabled={disabled}
      onClick={onClick}
      icon={<ProviderIcon provider={provider} />}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE_8 }}>
        {label}
        {/* A negative margin so the badge, taller than the button's single
            line of text, doesn't make the remembered method's button taller
            than the other two. */}
        {lastUsed && <span style={{ display: 'inline-flex', margin: '-4px 0' }}><Badge tone="accent" size="md">Last used</Badge></span>}
      </span>
    </Button>
  )
}

function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="3.2" y="2.7" width="9.6" height="11.6" rx="1.4" />
      <path d="M6 2.7V2a.6.6 0 0 1 .6-.6h2.8a.6.6 0 0 1 .6.6v.7M5.6 7h4.8M5.6 9.8h3.2" strokeLinecap="round" />
    </svg>
  )
}

function StepTitle({ children, onBack }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE_8, marginLeft: -6 }}>
      <Button variant="ghost-muted" size="sm" icon={<span aria-hidden="true">&larr;</span>} label="Back" onClick={onBack} />
      {children}
    </span>
  )
}

// Firefox only gained readText in 125, and an insecure origin has no
// navigator.clipboard at all; without it the button would only ever fail.
const CAN_READ_CLIPBOARD = typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function'

// The email step keeps the first step's title: an address that has no
// account yet gets one from the same code, so this is still sign-up too.
const TITLES = { choose: 'Sign in or create account', email: 'Sign in or create account', code: 'Check your email' }

// Every state the dialog can show, as plain props — the stateful
// SignInDialog below drives it, and Storybook's flow lab renders each state
// side by side without having to click its way there.
export function SignInDialogView({
  open = true,
  onClose,
  isMobile = false,
  step = 'choose',
  lastUsed = null,
  emailEnabled = EMAIL_SIGN_IN_ENABLED,
  email = '',
  sentTo = '',
  code = '',
  busy = false,
  error = null,
  waitingOnCaptcha = false,
  captchaNeedsClick = false,
  resending = false,
  resendIn = 0,
  autoFocus = true,
  captchaSlot = null,
  canPaste = false,
  onProvider,
  onChooseEmail,
  onEmailChange,
  onSubmitEmail,
  onCodeChange,
  onSubmitCode,
  onPaste,
  onResend,
  onBack,
}) {
  const chooseStep = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
      {AUTH_PROVIDERS.map(p => (
        <MethodButton
          key={p.id}
          provider={p.id}
          label={`Continue with ${p.label}`}
          lastUsed={lastUsed === p.id}
          disabled={busy}
          onClick={() => onProvider(p.id)}
        />
      ))}
      {emailEnabled && (
        <MethodButton
          provider={EMAIL_PROVIDER}
          label="Continue with email"
          lastUsed={lastUsed === EMAIL_PROVIDER}
          disabled={busy}
          onClick={onChooseEmail}
        />
      )}
      <div style={{ color: TEXT_MUTED, fontSize: FS_SM, lineHeight: 1.5 }}>
        By continuing, you agree to the{' '}
        <a href="#/terms" target="_blank" rel="noopener noreferrer" className="attribution-link" style={linkStyle}>Terms</a>
        {' '}and{' '}
        <a href="#/privacy" target="_blank" rel="noopener noreferrer" className="attribution-link" style={linkStyle}>Privacy Policy</a>.
      </div>
    </div>
  )

  // A real form so Enter submits and password managers recognise the field
  // as the account's email.
  const emailStep = (
    <form
      onSubmit={e => { e.preventDefault(); onSubmitEmail() }}
      style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}
    >
      <TextInput
        type="email"
        name="email"
        value={email}
        onChange={onEmailChange}
        placeholder="you@example.com"
        disabled={busy}
        autoComplete="email"
        required
        autoFocus={autoFocus}
        aria-label="Email address"
      />
      <Button type="submit" size={BUTTON_SIZE} fullWidth disabled={busy || waitingOnCaptcha}>
        Send code
      </Button>
    </form>
  )

  const codeStep = (
    <form
      onSubmit={e => { e.preventDefault(); onSubmitCode() }}
      style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}
    >
      <div style={{ fontSize: FS_BASE, lineHeight: 1.6, color: TEXT_MUTED }}>
        Enter the code sent to <span style={{ color: TEXT, wordBreak: 'break-all' }}>{sentTo}</span>
      </div>
      <TextInput
        name="code"
        value={code}
        onChange={onCodeChange}
        placeholder={'0'.repeat(EMAIL_CODE_LENGTH)}
        disabled={busy}
        autoFocus={autoFocus}
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={EMAIL_CODE_LENGTH}
        aria-label="Sign-in code"
        size="lg"
        style={{ fontSize: 22, letterSpacing: '0.3em', textAlign: 'center' }}
      />
      {canPaste && (
        <Button variant="neutral" size={BUTTON_SIZE} fullWidth disabled={busy} onClick={onPaste} icon={<ClipboardIcon />}>
          Paste from clipboard
        </Button>
      )}
      <Button type="submit" size={BUTTON_SIZE} fullWidth disabled={busy || code.length !== EMAIL_CODE_LENGTH}>
        Sign in
      </Button>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="ghost-muted" size="sm" disabled={busy || resending || resendIn > 0} onClick={onResend}>
          {resendIn > 0 ? `Resend code (${resendIn}s)` : 'Resend code'}
        </Button>
      </div>
    </form>
  )

  // Sending, verifying, or the email step's security check still running once
  // an address is typed — the one wait that otherwise shows only as a
  // disabled button. Not before anything's typed: nobody is waiting yet, and
  // the check usually finishes before they are. Not while Cloudflare shows
  // its checkbox: then it's waiting on a click, not on us. On the code step,
  // a resend waiting for its check counts too.
  const waitingOnCheck = waitingOnCaptcha && !captchaNeedsClick
  const loading = busy
    || (step === 'email' && waitingOnCheck && email.trim() !== '')
    || (resending && waitingOnCheck)

  const title = step === 'choose'
    ? TITLES.choose
    : <StepTitle onBack={onBack}>{TITLES[step]}</StepTitle>

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" isMobile={isMobile} loading={loading}>
      <div>
        {step === 'choose' ? chooseStep : step === 'email' ? emailStep : codeStep}

        {/* The security check sits in the same slot on the email and code
            steps, so the widget survives the switch between them — a resend
            needs a fresh token from the same widget. Interaction-only: it
            takes no space unless Cloudflare actually wants a click. */}
        {step !== 'choose' && captchaSlot && <div style={{ marginTop: SPACE_12 }}>{captchaSlot}</div>}

        {error && (
          <div role="alert" style={{ color: DANGER, fontSize: FS_SM, marginTop: SPACE_16, lineHeight: 1.5 }}>
            {error}
          </div>
        )}
      </div>
    </Modal>
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
  const [resending, setResending] = useState(false)
  // The check runs only where a token is about to be spent: on the email
  // step, and on the code step only once Resend is pressed. Nothing loads
  // from Cloudflare for someone who picks GitHub or Google, and nothing
  // interrupts someone pasting their code.
  const captchaActive = open && (step === 'email' || resending)
  const captcha = useTurnstile(emailEnabled ? turnstileSiteKey : null, captchaActive)

  // A dialog reopened after a failed or completed attempt should start clean,
  // not show the previous attempt's error or code step. The typed address is
  // kept — reopening to fix a typo shouldn't mean retyping it.
  useEffect(() => {
    if (open) {
      setStep('choose')
      setCode('')
      setBusy(false)
      setError(null)
      setResending(false)
    }
  }, [open])

  useEffect(() => {
    if (step !== 'code') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [step])

  // A resend waits for its fresh token, then goes out by itself.
  useEffect(() => {
    if (!resending || !captcha.token) return
    setResending(false)
    sendCode(sentTo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resending, captcha.token])

  function handleResend() {
    setError(null)
    if (captcha.required) setResending(true)
    else sendCode(sentTo)
  }

  function goTo(next) {
    setResending(false)
    setError(null)
    setCode('')
    setStep(next)
  }

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

  function handleSubmitEmail() {
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

  // Reading the clipboard prompts in some browsers (Safari's Paste bubble),
  // and a refusal or an unrelated clipboard just means saying so — typing or
  // pasting into the field still works.
  async function handlePaste() {
    setError(null)
    let text
    try {
      text = await navigator.clipboard.readText()
    } catch {
      setError('Couldn’t read the clipboard. Paste the code into the field instead.')
      return
    }
    const found = codeFromText(text)
    if (!found) {
      setError(`No ${EMAIL_CODE_LENGTH}-digit code on the clipboard. Copy it from the email and try again.`)
      return
    }
    handleCodeChange(found)
  }

  return (
    <SignInDialogView
      open={open}
      onClose={onClose}
      isMobile={isMobile}
      step={step}
      lastUsed={lastUsed}
      emailEnabled={emailEnabled}
      email={email}
      sentTo={sentTo}
      code={code}
      busy={busy}
      error={error ?? captcha.error}
      waitingOnCaptcha={captchaActive && captcha.required && !captcha.token}
      captchaNeedsClick={captcha.interactive}
      resending={resending}
      resendIn={Math.max(0, Math.ceil((resendAt - now) / 1000))}
      captchaSlot={<div ref={captcha.containerRef} />}
      onProvider={handleProvider}
      onChooseEmail={() => goTo('email')}
      onEmailChange={setEmail}
      onSubmitEmail={handleSubmitEmail}
      onCodeChange={handleCodeChange}
      onSubmitCode={() => verify(code)}
      canPaste={CAN_READ_CLIPBOARD}
      onPaste={handlePaste}
      onResend={handleResend}
      onBack={() => goTo(step === 'code' ? 'email' : 'choose')}
    />
  )
}

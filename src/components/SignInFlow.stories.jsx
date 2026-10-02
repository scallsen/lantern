import { fn } from 'storybook/test'
import { SignInDialogView } from './SignInDialog.jsx'
import { TEXT, TEXT_MUTED, FS_SM, FS_HEADING, SPACE_8, SPACE_12, SPACE_24, SPACE_32 } from '../data/theme.js'

const handlers = {
  onClose: fn(),
  onProvider: fn(),
  onChooseEmail: fn(),
  onEmailChange: fn(),
  onSubmitEmail: fn(),
  onCodeChange: fn(),
  onSubmitCode: fn(),
  onPaste: fn(),
  onResend: fn(),
  onBack: fn(),
}

// Stands in for Cloudflare's widget in the one state where it shows itself.
// The real one is an iframe from Cloudflare that only renders with a site key
// on an allowed hostname, which Storybook isn't.
function TurnstileStandIn() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 65, padding: `0 ${SPACE_12}px`, boxSizing: 'border-box',
      background: '#232323', border: '1px solid #4a4a4a', borderRadius: 4,
      fontFamily: 'system-ui, sans-serif', fontSize: 14, letterSpacing: 0, color: '#e8e8e8',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE_12 }}>
        <span style={{ width: 22, height: 22, border: '2px solid #888', borderRadius: 3, background: '#111' }} />
        Verify you are human
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#f6821f' }}>CLOUDFLARE</span>
    </div>
  )
}

const EMAIL = 'mika@example.com'
const CODE = { step: 'code', email: EMAIL, sentTo: EMAIL, canPaste: true }

const ROWS = [
  {
    title: '1 · Choose a method',
    note: 'Three equal buttons. Nothing from Cloudflare loads here.',
    states: [
      { label: 'Default', props: {} },
      { label: 'Last used: Google', props: { lastUsed: 'google' } },
      { label: 'Last used: email', props: { lastUsed: 'email' } },
      { label: 'Provider failed', props: { error: 'Unsupported provider: provider is not enabled' } },
    ],
  },
  {
    title: '2 · Enter email',
    note: 'The security check starts when this step opens and is usually done before the address is typed. The header bar only shows once an address is in and the check still isn\'t done.',
    states: [
      { label: 'Opened — check running, nothing typed (no bar)', props: { step: 'email', waitingOnCaptcha: true } },
      { label: 'Typed before the check finished', props: { step: 'email', email: EMAIL, waitingOnCaptcha: true } },
      { label: 'Ready to send', props: { step: 'email', email: EMAIL } },
      { label: 'Cloudflare asks for a click (rare)', props: { step: 'email', email: EMAIL, waitingOnCaptcha: true, captchaNeedsClick: true, captchaSlot: <TurnstileStandIn /> } },
      { label: 'Sending', props: { step: 'email', email: EMAIL, busy: true } },
      { label: 'Send refused', props: { step: 'email', email: EMAIL, error: 'For security purposes, you can only request this after 42 seconds.' } },
    ],
  },
  {
    title: '3 · Enter code',
    note: 'Submits on the sixth digit, so a pasted or autofilled code signs straight in. Paste from clipboard finds the code even in a copied sentence. The security check only runs again if Resend is pressed. Back returns to the email step.',
    states: [
      { label: 'Just sent', props: { ...CODE, resendIn: 60 } },
      { label: 'Typing', props: { ...CODE, code: '482', resendIn: 41 } },
      { label: 'Checking the code', props: { ...CODE, code: '482917', busy: true, resendIn: 38 } },
      { label: 'Wrong or expired code', props: { ...CODE, error: 'That code is wrong or has expired.', resendIn: 30 } },
      { label: 'Nothing to paste', props: { ...CODE, error: 'No 6-digit code on the clipboard. Copy it from the email and try again.', resendIn: 24 } },
      { label: 'Resend available', props: { ...CODE } },
      { label: 'Resend pressed — security check running', props: { ...CODE, resending: true, waitingOnCaptcha: true } },
    ],
  },
  {
    title: 'Phone',
    note: 'The same steps as a bottom sheet.',
    mobile: true,
    states: [
      { label: 'Choose', props: { lastUsed: 'email' } },
      { label: 'Enter email', props: { step: 'email', email: EMAIL } },
      { label: 'Enter code', props: { ...CODE, resendIn: 52 } },
    ],
  },
]

// `transform` makes each frame the containing block for the Modal's
// position: fixed scrim and panel, so every state renders as the real dialog,
// confined to its own frame instead of covering the page.
function Frame({ label, mobile, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_8 }}>
      <div style={{ fontSize: FS_SM, color: TEXT_MUTED }}>{label}</div>
      <div style={{
        position: 'relative', transform: 'translateZ(0)', overflow: 'hidden',
        width: mobile ? 390 : 440, height: mobile ? 640 : 520,
        background: '#1E1E1E', border: '1px solid #2E2E2E', borderRadius: 8,
      }}>
        {children}
      </div>
    </div>
  )
}

function SignInFlowLab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_32 }}>
      {ROWS.map(row => (
        <section key={row.title} style={{ display: 'flex', flexDirection: 'column', gap: SPACE_12 }}>
          <div>
            <div style={{ fontSize: FS_HEADING, color: TEXT }}>{row.title}</div>
            <div style={{ fontSize: FS_SM, color: TEXT_MUTED, marginTop: 4 }}>{row.note}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE_24 }}>
            {row.states.map(s => (
              <Frame key={s.label} label={s.label} mobile={row.mobile}>
                <SignInDialogView {...handlers} emailEnabled autoFocus={false} isMobile={row.mobile} {...s.props} />
              </Frame>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default {
  title: 'Labs/Sign-in Flow',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: "Every state of the sign-in dialog, step by step, for reviewing the flow as a whole: choose a method, enter an email, enter the code, and the same three steps on a phone.\n\n**Use when** reviewing or changing the sign-in flow — each frame is the real dialog in one state.\n\n**Don't use** to try the dialog interactively (Sign-in Dialog, which clicks through the same steps)." },
    },
  },
}

export const FullFlow = { render: () => <SignInFlowLab /> }

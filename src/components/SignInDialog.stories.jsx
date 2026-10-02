import { useState } from 'react'
import { fn } from 'storybook/test'
import SignInDialog from './SignInDialog.jsx'
import Button from './Button.jsx'

export default {
  title: 'Overlays/Sign-in Dialog',
  component: SignInDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: "The one way into an account: GitHub, Google, or a one-time code sent by email. New and returning people go through the same steps, and the method last used on this device is marked.\n\n**Use when** someone chooses to sign in — `signIn()` from `useAuth()` opens it, so call sites never render it themselves.\n\n**Don't use** to explain that a whole screen needs an account (Sign-in Gate, which calls `signIn()` for its button).\n\n*Build note:* the email step's security check (Cloudflare Turnstile) only renders with a site key; these stories pass none, so nothing loads from Cloudflare." },
      story: { inline: false, iframeHeight: 560 },
    },
  },
  args: {
    emailEnabled: true,
    lastUsed: null,
    turnstileSiteKey: null,
    onProvider: fn(),
    onEmail: fn(async () => ({ error: null })),
    onVerifyCode: fn(async () => ({ error: { code: 'otp_expired', message: 'Token has expired or is invalid' } })),
  },
  argTypes: { lastUsed: { control: 'select', options: [null, 'github', 'google', 'email'] } },
}

function SignInDialogStory(args) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Sign in</Button>
      <SignInDialog {...args} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export const Default = { render: args => <SignInDialogStory {...args} /> }

export const LastUsedGoogle = { render: args => <SignInDialogStory {...args} />, args: { lastUsed: 'google' } }

export const LastUsedEmail = { render: args => <SignInDialogStory {...args} />, args: { lastUsed: 'email' } }

export const ProvidersOnly = { render: args => <SignInDialogStory {...args} />, args: { emailEnabled: false } }

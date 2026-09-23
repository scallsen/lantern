import { fn } from 'storybook/test'
import SignInGate from './SignInGate.jsx'

export default {
  title: 'Layout/Sign-in Gate',
  component: SignInGate,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A full screen explaining that a feature needs an account, with a way to sign in.\n\n**Use when** the whole screen is useless without an account, like Reviews, where progress only lives in the account.\n\n**Don't use** when only part of a screen needs an account — show the screen signed out and gate just that action." } },
  },
  args: {
    fullScreen: false,
    crumbs: [{ label: 'Lantern' }, { label: 'Reviews' }],
    title: 'Sign in to use Reviews',
    subtitle: 'Progress syncs to your account across devices',
    onSignIn: fn(),
  },
  decorators: [
    Story => (
      <div style={{ width: 480, height: 300, overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
        <Story />
      </div>
    ),
  ],
}

export const Embedded = {}

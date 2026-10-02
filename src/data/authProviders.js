// The OAuth providers offered for both sign-in and account linking. One list
// so the sign-in dialog and the account page's linked-accounts section can't
// drift apart. Each id must match a provider enabled in the Supabase
// dashboard — the code shipping ahead of that toggle is expected: the button
// simply errors until the project is configured.
export const AUTH_PROVIDERS = [
  { id: 'github', label: 'GitHub' },
  { id: 'google', label: 'Google' },
]

// Identities created by email sign-in report this provider. It has no
// OAuth button and can't be unlinked like the others, so it's named here
// rather than being a bare string in three places.
export const EMAIL_PROVIDER = 'email'

// Email sign-in (a one-time code, with a backup link in the same email) is
// built but hidden until its infrastructure is live. Unlike the OAuth buttons —
// which may ship ahead of their dashboard toggle because a misconfigured one
// fails loudly and immediately — an email that never arrives fails *silently*,
// leaving the user waiting on a code forever. Supabase's built-in SMTP sends a
// couple of emails an hour and only to the project's own org, so flip this to
// true only once every step in supabase/CLAUDE.md's "Auth configuration" is
// done: Resend as custom SMTP, the email templates, and Turnstile.
export const EMAIL_SIGN_IN_ENABLED = false

// Must match "Email OTP Length" in the Supabase dashboard. The code field
// submits itself once this many digits are in, which is what lets a phone's
// one-time-code autofill sign straight in.
export const EMAIL_CODE_LENGTH = 6

export function providerLabel(id) {
  if (id === EMAIL_PROVIDER) return 'Email'
  return AUTH_PROVIDERS.find(p => p.id === id)?.label ?? id
}

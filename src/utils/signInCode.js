import { EMAIL_CODE_LENGTH } from '../data/authProviders.js'

// The first run of exactly EMAIL_CODE_LENGTH digits in pasted text, allowing
// spaces or dashes inside it ("482 917"), so copying a whole line of the
// email — "Your Lantern sign-in code is 482917." — still finds the code.
export function codeFromText(text) {
  for (const run of text.match(/\d[\d\s-]*/g) ?? []) {
    const digits = run.replace(/\D/g, '')
    if (digits.length === EMAIL_CODE_LENGTH) return digits
  }
  return null
}

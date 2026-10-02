import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from './storage.js'

// Remembers which method this browser last signed in with, so the sign-in
// dialog can put it first. Only the method id is kept — never the email
// address, which the browser's own autofill already offers.
const LAST_KEY = 'lantern-last-sign-in'
// An OAuth sign-in only succeeds after a full-page round trip, so the click is
// parked in sessionStorage (it survives the redirect in the same tab) and only
// promoted to "last used" once a session actually arrives — a cancelled
// Google prompt must not count.
const PENDING_KEY = 'lantern-pending-sign-in'

export function getLastSignIn() {
  return safeLocalStorageGet(LAST_KEY)
}

export function recordSignIn(method) {
  safeLocalStorageSet(LAST_KEY, method)
  clearPendingSignIn()
}

export function markPendingSignIn(method) {
  try {
    sessionStorage.setItem(PENDING_KEY, method)
  } catch {
    // storage unavailable — the badge is a convenience, not worth failing over
  }
}

export function clearPendingSignIn() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // storage unavailable — silently ignore
  }
}

// Returns the method it promoted, or null — which is also how a caller tells
// a sign-in that just completed from a session merely restored on load.
export function commitPendingSignIn() {
  let pending = null
  try {
    pending = sessionStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
  if (pending) recordSignIn(pending)
  return pending
}

export function forgetLastSignIn() {
  safeLocalStorageRemove(LAST_KEY)
  clearPendingSignIn()
}

import { useCallback, useEffect, useRef, useState } from 'react'

// Cloudflare Turnstile, the CAPTCHA Supabase verifies on every email-code
// request. Without it the email form is a free way to make Lantern mail
// strangers: each request costs sending quota (Resend's free tier caps at 100
// a day, after which nobody can sign in) and sender reputation.
//
// With no key set no widget renders and requests go out without a token,
// which Supabase rejects once CAPTCHA protection is on — dev included, since
// it shares the project. See supabase/CLAUDE.md, "Auth configuration".
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || null

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise = null

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.onload = () => resolve(window.turnstile)
      script.onerror = () => {
        // Cleared so the next attempt (dialog reopened) retries the load
        // rather than being handed the same rejection forever.
        scriptPromise = null
        reject(new Error('Could not load the security check. Check your connection and try again.'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

// Mount the returned ref on an empty element that stays rendered for as long
// as `active` is true. `interaction-only` keeps the widget invisible unless
// Cloudflare actually wants a click, so most people never see it.
//
// Tokens are single-use: call `reset()` after every request that spent one,
// successful or not, and Turnstile quietly issues the next.
export function useTurnstile(siteKey, active) {
  const containerRef = useRef(null)
  const widgetId = useRef(null)
  const [token, setToken] = useState(null)
  const [error, setError] = useState(null)
  // True while Cloudflare is showing its checkbox — the person, not the
  // network, is what's being waited on, so callers drop their loading state.
  const [interactive, setInteractive] = useState(false)

  useEffect(() => {
    if (!siteKey || !active) return
    let cancelled = false
    loadTurnstile()
      .then(turnstile => {
        if (cancelled || !containerRef.current) return
        widgetId.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          size: 'flexible',
          appearance: 'interaction-only',
          callback: t => { setToken(t); setError(null); setInteractive(false) },
          'before-interactive-callback': () => setInteractive(true),
          'after-interactive-callback': () => setInteractive(false),
          'expired-callback': () => setToken(null),
          // Cloudflare's code names the actual cause (110200: this hostname
          // isn't on the widget; 110100/110110: bad site key; 300xxx/600xxx:
          // the visitor failed the challenge), so it goes in the message for
          // anyone reporting it. Returning true tells Turnstile it's handled.
          'error-callback': code => {
            setToken(null)
            setError(`The security check failed${code ? ` (error ${code})` : ''}. Reload the page and try again.`)
            return true
          },
        })
      })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => {
      cancelled = true
      if (widgetId.current != null) {
        window.turnstile?.remove(widgetId.current)
        widgetId.current = null
      }
      setToken(null)
      setInteractive(false)
    }
  }, [siteKey, active])

  const reset = useCallback(() => {
    setToken(null)
    if (widgetId.current != null) window.turnstile?.reset(widgetId.current)
  }, [])

  return { containerRef, token, error, interactive, reset, required: Boolean(siteKey) }
}

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// PKCE rather than the implicit flow: OAuth returns a one-time `?code=` that's
// exchanged for a session, instead of the tokens themselves arriving in the
// URL where history, extensions and Referer headers can see them. OAuth 2.1
// drops the implicit flow altogether.
export const supabase = url && key
  ? createClient(url, key, { auth: { flowType: 'pkce' } })
  : null

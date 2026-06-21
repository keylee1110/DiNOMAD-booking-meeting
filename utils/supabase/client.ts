import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Single shared browser client for the whole app. Creating a new client on every
// createClient() call spins up multiple auth listeners that contend on the browser
// LockManager during token refresh — which intermittently makes getSession() hang
// or return null, so the nav's auth buttons (login/logout/profile) vanish.
let browserClient: SupabaseClient | undefined

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return browserClient
}

/**
 * Runtime feature flags derived from environment variables.
 *
 * When Supabase isn't configured the app runs in demo mode: no real
 * authentication, and receipts are kept in the browser's localStorage.
 */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

'use client'

import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'

export interface AppUser {
  id: string
  email: string
  name: string | null
  demo: boolean
}

const DEMO_KEY = 'billbaba:demo-session'

export interface AuthResult {
  error?: string
  /** Set when the action succeeded but needs a follow-up from the user. */
  message?: string
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        if (window.localStorage.getItem(DEMO_KEY)) {
          setUser({ id: 'demo-user', email: 'demo@billbaba.app', name: 'Demo User', demo: true })
        }
      } catch {
        /* storage unavailable — stay signed out */
      }
      setLoading(false)
      return
    }

    const supabase = createClient()
    const toAppUser = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null | undefined): AppUser | null =>
      u
        ? {
            id: u.id,
            email: u.email ?? '',
            name: typeof u.user_metadata?.full_name === 'string' ? u.user_metadata.full_name : null,
            demo: false,
          }
        : null

    supabase.auth.getUser().then(({ data }) => {
      setUser(toAppUser(data.user))
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(toAppUser(session?.user)))
    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) return { error: error.message }
    return data.session ? {} : { message: 'Check your inbox to confirm your email, then sign in.' }
  }, [])

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await createClient().auth.signOut()
    else {
      try {
        window.localStorage.removeItem(DEMO_KEY)
      } catch {
        /* ignore */
      }
      setUser(null)
    }
  }, [])

  const enterDemo = useCallback(() => {
    try {
      window.localStorage.setItem(DEMO_KEY, '1')
    } catch {
      /* ignore */
    }
    setUser({ id: 'demo-user', email: 'demo@billbaba.app', name: 'Demo User', demo: true })
  }, [])

  return { user, loading, signIn, signUp, signOut, enterDemo }
}

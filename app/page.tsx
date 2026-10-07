'use client'

import { AuthScreen } from '@/components/auth-screen'
import { Dashboard } from '@/components/dashboard/dashboard'
import { useAuth } from '@/hooks/use-auth'

export default function Page() {
  const { user, loading, signIn, signUp, signOut, enterDemo } = useAuth()

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7fb]">
        <div role="status" aria-label="Loading" className="size-8 animate-spin rounded-full border-4 border-violet-200 border-t-[#7657f6]" />
      </main>
    )
  }

  if (!user) return <AuthScreen onSignIn={signIn} onSignUp={signUp} onDemo={enterDemo} />

  return <Dashboard user={user} onSignOut={signOut} />
}

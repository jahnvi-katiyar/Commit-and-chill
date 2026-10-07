'use client'

import { useState } from 'react'
import { isSupabaseConfigured } from '@/lib/config'
import type { AuthResult } from '@/hooks/use-auth'
import { Logo } from './logo'

const inputClass =
  'h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#7657f6] focus:outline-none focus:ring-2 focus:ring-[#7657f6]/30'

interface Props {
  onSignIn: (email: string, password: string) => Promise<AuthResult>
  onSignUp: (email: string, password: string) => Promise<AuthResult>
  onDemo: () => void
}

export function AuthScreen({ onSignIn, onSignUp, onDemo }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    const result = await (mode === 'signin' ? onSignIn : onSignUp)(email.trim(), password)
    if (result.error) setError(result.error)
    if (result.message) setMessage(result.message)
    setBusy(false)
  }

  return (
    <main className="min-h-screen bg-[#f7f7fb] px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/60 lg:flex-row">
        <div className="relative hidden w-1/2 overflow-hidden bg-[#7155ed] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 size-80 rounded-full border-[38px] border-white/10" />
          <div className="absolute -bottom-28 -left-24 size-80 rounded-full border-[38px] border-white/10" />
          <div className="relative [&_span]:text-white"><Logo /></div>
          <div className="relative max-w-md">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">Your money, simplified</p>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">Every bill.<br />One clear view.</h1>
            <p className="mt-6 max-w-sm text-lg leading-8 text-violet-100">Scan receipts, understand your spending, and stay one step ahead.</p>
          </div>
          <p className="relative text-sm text-violet-200">© {new Date().getFullYear()} Bill Baba</p>
        </div>

        <div className="flex flex-1 flex-col justify-center px-7 py-12 sm:px-16">
          <div className="mb-12 lg:hidden"><Logo /></div>
          <div className="mx-auto w-full max-w-sm">
            <p className="mb-3 text-sm font-semibold uppercase text-[#7657f6]">{mode === 'signin' ? 'Welcome back' : 'Get started'}</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Your finances,<br />at a glance.</h2>
            <p className="mt-4 text-slate-500">
              {isSupabaseConfigured
                ? mode === 'signin' ? 'Sign in to continue to your dashboard.' : 'Create an account to start scanning receipts.'
                : 'Supabase isn’t configured, so Bill Baba is running in demo mode.'}
            </p>

            {isSupabaseConfigured ? (
              <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
                <label className="sr-only" htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                <label className="sr-only" htmlFor="password">Password</label>
                <input id="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={mode === 'signup' ? 8 : undefined} placeholder={mode === 'signup' ? 'Password (8+ characters)' : 'Password'} required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                <div aria-live="polite">
                  {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
                  {message && <p className="text-sm font-semibold text-emerald-600">{message}</p>}
                </div>
                <button type="submit" disabled={busy} className="flex h-12 items-center justify-center rounded-xl bg-[#7657f6] font-semibold text-white transition hover:bg-[#6647e9] disabled:opacity-70">
                  {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
                <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }} className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                  {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
                </button>
              </form>
            ) : (
              <div className="mt-8 flex flex-col gap-3">
                <button type="button" onClick={onDemo} className="flex h-12 items-center justify-center rounded-xl bg-[#7657f6] font-semibold text-white transition hover:bg-[#6647e9]">
                  Continue in demo mode
                </button>
                <p className="text-xs leading-5 text-slate-400">Demo data stays in this browser only. Add Supabase keys to .env.local to enable accounts.</p>
              </div>
            )}

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Your receipts are private to your account.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

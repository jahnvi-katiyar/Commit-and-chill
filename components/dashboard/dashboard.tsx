'use client'

import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, DollarSign, FileText, Home, LogOut, Plus, Receipt as ReceiptIcon, Search } from 'lucide-react'
import type { AppUser } from '@/hooks/use-auth'
import { useReceipts } from '@/hooks/use-receipts'
import { formatMoney, greeting } from '@/lib/format'
import { computeStats } from '@/lib/stats'
import type { Receipt, ReceiptAnalysis } from '@/types/receipt'
import { Logo } from '../logo'
import { UploadModal } from '../upload-modal'
import { CategoryChart, MonthlyChart } from './charts'
import { ReceiptsTable } from './receipts-table'
import { StatCard } from './stat-card'

type View = 'overview' | 'receipts'

const NAV: { view: View; label: string; icon: typeof Home }[] = [
  { view: 'overview', label: 'Overview', icon: Home },
  { view: 'receipts', label: 'All receipts', icon: FileText },
]

export function Dashboard({ user, onSignOut }: { user: AppUser; onSignOut: () => void }) {
  const { receipts, loading, error, addReceipt, removeReceipt } = useReceipts(user)
  const [view, setView] = useState<View>('overview')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const stats = useMemo(() => computeStats(receipts), [receipts])
  const closeUpload = useCallback(() => setUploadOpen(false), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return receipts
    return receipts.filter((r) => `${r.merchant_name ?? ''} ${r.category}`.toLowerCase().includes(q))
  }, [receipts, query])

  const handleSave = async (analysis: ReceiptAnalysis): Promise<Receipt> => {
    const saved = await addReceipt(analysis)
    setToast(saved.anomaly_reason ? `Saved — flagged: ${saved.anomaly_reason}` : 'Receipt saved.')
    window.setTimeout(() => setToast(null), 6000)
    return saved
  }

  const firstName = user.name?.split(' ')[0] || user.email.split('@')[0] || 'there'
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200/80 bg-white px-5 py-7 lg:block">
        <Logo />
        <nav aria-label="Main" className="mt-14 flex flex-col gap-2">
          {NAV.map(({ view: v, label, icon: Icon }) => (
            <button key={v} onClick={() => setView(v)} aria-current={view === v ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${view === v ? 'bg-violet-50 font-semibold text-[#7657f6]' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="size-5" aria-hidden /> {label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-7 left-5 right-5">
          <button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-500 hover:bg-slate-50">
            <LogOut className="size-5" aria-hidden /> {user.demo ? 'Exit demo' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-5 sm:px-8 lg:px-10">
          <div className="lg:hidden"><Logo /></div>
          <div className="hidden lg:block">
            <p className="text-sm text-slate-500">{today}</p>
            <p className="mt-1 text-2xl font-bold">{greeting()}, {firstName}</p>
          </div>
          <div className="flex items-center gap-3">
            {user.demo && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Demo mode</span>}
            <button onClick={onSignOut} aria-label={user.demo ? 'Exit demo' : 'Sign out'} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 lg:hidden"><LogOut className="size-4" /></button>
            <div aria-hidden className="hidden size-10 place-items-center rounded-full bg-violet-100 font-bold text-[#7657f6] sm:grid">{firstName[0]?.toUpperCase() ?? 'U'}</div>
          </div>
        </header>

        <nav aria-label="Main" className="flex gap-2 border-b border-slate-200/80 bg-white px-5 pb-3 lg:hidden">
          {NAV.map(({ view: v, label }) => (
            <button key={v} onClick={() => setView(v)} aria-current={view === v ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === v ? 'bg-violet-50 text-[#7657f6]' : 'text-slate-500'}`}>{label}</button>
          ))}
        </nav>

        <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{view === 'overview' ? 'Overview' : 'All receipts'}</h1>
              <p className="mt-2 text-slate-500">{view === 'overview' ? 'Here’s what’s happening with your spending.' : `${receipts.length} receipt${receipts.length === 1 ? '' : 's'} on file.`}</p>
            </div>
            <button onClick={() => setUploadOpen(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7657f6] px-5 font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-[#6647e9]">
              <Plus className="size-5" aria-hidden /> Scan receipt
            </button>
          </div>

          {error && <p role="alert" className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          {loading ? (
            <div className="grid place-items-center py-24"><div role="status" aria-label="Loading receipts" className="size-8 animate-spin rounded-full border-4 border-violet-200 border-t-[#7657f6]" /></div>
          ) : view === 'overview' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={<DollarSign className="size-5" aria-hidden />} label="Total spending" value={formatMoney(stats.total, stats.currency)} badge={stats.monthChange == null ? undefined : `${stats.monthChange >= 0 ? '↑' : '↓'} ${Math.abs(stats.monthChange).toFixed(1)}% vs last month`} />
                <StatCard icon={<ReceiptIcon className="size-5" aria-hidden />} label="Receipts scanned" value={String(stats.count)} />
                <StatCard icon={<AlertTriangle className="size-5" aria-hidden />} label="Flagged receipts" value={String(stats.flagged)} badge={stats.flagged ? 'Needs review' : 'All clear'} warn={stats.flagged > 0} />
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-5">
                <MonthlyChart stats={stats} />
                <CategoryChart stats={stats} />
              </div>
              <section aria-labelledby="recent" className="mt-6 rounded-2xl border border-slate-200/80 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                  <div>
                    <h2 id="recent" className="font-bold">Recent receipts</h2>
                    <p className="mt-1 text-sm text-slate-500">Your latest scanned receipts</p>
                  </div>
                  <button onClick={() => setView('receipts')} className="text-sm font-semibold text-[#7657f6]">View all →</button>
                </div>
                <ReceiptsTable receipts={receipts.slice(0, 5)} />
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-slate-200/80 bg-white">
              <div className="border-b border-slate-100 p-4">
                <div className="relative max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <label htmlFor="search" className="sr-only">Search receipts</label>
                  <input id="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by merchant or category" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:border-[#7657f6] focus:outline-none focus:ring-2 focus:ring-[#7657f6]/30" />
                </div>
              </div>
              <ReceiptsTable receipts={filtered} onDelete={removeReceipt} emptyMessage={query ? 'No receipts match your search.' : undefined} />
            </section>
          )}
        </main>
      </div>

      {toast && <div role="status" className="fixed bottom-6 left-1/2 z-40 max-w-[90vw] -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl">{toast}</div>}
      {uploadOpen && <UploadModal onClose={closeUpload} onSave={handleSave} />}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { AlertTriangle, ArrowUpRight, Camera, Check, ChevronRight, FileText, Home, LogOut, Menu, Plus, Receipt, Search, Settings, Sparkles, Upload, X } from 'lucide-react'
import type { ReceiptAnalysis } from '@/types/receipt'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const receipts = [
  { id: 'r1', merchant: 'Whole Foods Market', date: 'Oct 4, 2026', category: 'Groceries', amount: 86.42, status: 'Verified', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'r2', merchant: 'The Coffee Club', date: 'Oct 3, 2026', category: 'Dining', amount: 24.8, status: 'Verified', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'r3', merchant: 'Uber', date: 'Oct 1, 2026', category: 'Transport', amount: 38.5, status: 'Flagged', color: 'bg-amber-100 text-amber-700' },
  { id: 'r4', merchant: 'Target', date: 'Sep 29, 2026', category: 'Shopping', amount: 124.99, status: 'Verified', color: 'bg-emerald-100 text-emerald-700' },
]
const categoryData = [{ name: 'Groceries', value: 38, color: '#7c5cff' }, { name: 'Shopping', value: 27, color: '#2dd4bf' }, { name: 'Dining', value: 20, color: '#f59e0b' }, { name: 'Transport', value: 15, color: '#fb7185' }]
const monthlyData = [{ month: 'May', amount: 420 }, { month: 'Jun', amount: 610 }, { month: 'Jul', amount: 520 }, { month: 'Aug', amount: 740 }, { month: 'Sep', amount: 680 }, { month: 'Oct', amount: 890 }]

function Logo() { return <div className="flex items-center gap-2.5"><div className="grid size-9 place-items-center rounded-xl bg-[#7657f6] text-white shadow-lg shadow-violet-200"><Receipt className="size-5" /></div><span className="text-lg font-bold tracking-tight text-slate-900">Bill Baba</span></div> }

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ReceiptAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const total = useMemo(() => receipts.reduce((sum, r) => sum + r.amount, 0), [])

  const handleCloseModal = useCallback(() => {
    setUploadOpen(false)
    setImage(null)
    setSelectedFile(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setAnalyzing(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthMessage(null)
    
    // HACKATHON BYPASS: Instant login without checking Supabase
    setUser({ id: 'demo-user', email, user_metadata: { full_name: 'Demo User' } } as any)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthMessage(null)
    
    // HACKATHON BYPASS: Instant login without checking Supabase
    setUser({ id: 'demo-user', email, user_metadata: { full_name: 'Demo User' } } as any)
  }

  const handleLogout = async () => {
    setUser(null)
  }

  if (authLoading) return <main className="min-h-screen bg-[#f7f7fb] grid place-items-center"><div className="size-8 rounded-full border-4 border-violet-200 border-t-[#7657f6] animate-spin" /></main>

  if (!user) return <main className="min-h-screen bg-[#f7f7fb] px-5 py-8"><div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/60 lg:flex-row"><div className="relative hidden w-1/2 overflow-hidden bg-[#7155ed] p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-24 -top-24 size-80 rounded-full border-[38px] border-white/10" /><div className="absolute -bottom-28 -left-24 size-80 rounded-full border-[38px] border-white/10" /><Logo /><div className="relative max-w-md"><p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">Your money, simplified</p><h1 className="text-5xl font-bold leading-[1.05] tracking-tight">Every bill.<br />One clear view.</h1><p className="mt-6 max-w-sm text-lg leading-8 text-violet-100">Scan receipts, understand your spending, and stay one step ahead.</p></div><p className="text-sm text-violet-200">© 2026 Bill Baba</p></div><div className="flex flex-1 flex-col justify-center px-7 py-12 sm:px-16"><div className="mb-12 lg:hidden"><Logo /></div><div className="mx-auto w-full max-w-sm"><p className="mb-3 text-sm font-semibold text-[#7657f6]">WELCOME BACK</p><h2 className="text-3xl font-bold tracking-tight text-slate-900">Your finances,<br />at a glance.</h2><p className="mt-4 text-slate-500">Sign in to continue to your dashboard.</p><form onSubmit={handleSignIn} className="mt-8 flex flex-col gap-4"><input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#7657f6] focus:outline-none focus:ring-1 focus:ring-[#7657f6]" /><input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl border border-slate-200 px-4 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#7657f6] focus:outline-none focus:ring-1 focus:ring-[#7657f6]" />{authError && <p className="text-sm font-semibold text-red-600">{authError}</p>}{authMessage && <p className="text-sm font-semibold text-emerald-600">{authMessage}</p>}<div className="flex gap-3"><button type="submit" className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#7657f6] font-semibold text-white transition hover:bg-[#6647e9]">Sign in</button><button type="button" onClick={handleSignUp} className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 transition hover:bg-slate-50">Create account</button></div></form><p className="mt-8 text-center text-xs leading-5 text-slate-400">By continuing, you agree to our Terms of Service<br />and Privacy Policy.</p></div></div></div></main>

  return <main className="min-h-screen bg-[#f7f7fb] text-slate-900"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200/80 bg-white px-5 py-7 lg:block"><Logo /><nav className="mt-14 flex flex-col gap-2"><a className="flex items-center gap-3 rounded-xl bg-violet-50 px-4 py-3 font-semibold text-[#7657f6]"><Home className="size-5" /> Overview</a><a className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-500 hover:bg-slate-50"><FileText className="size-5" /> All receipts</a><a className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-500 hover:bg-slate-50"><Settings className="size-5" /> Settings</a></nav><div className="absolute bottom-7 left-5 right-5"><button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-500 hover:bg-slate-50"><LogOut className="size-5" /> Sign out</button></div></aside><div className="lg:pl-64"><header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-5 sm:px-8 lg:px-10"><div className="lg:hidden"><Logo /></div><div className="hidden lg:block"><p className="text-sm text-slate-500">Tuesday, October 6, 2026</p><h1 className="mt-1 text-2xl font-bold">Good morning, {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'}</h1></div><div className="flex items-center gap-3"><button className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500"><Search className="size-4" /></button><button className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white lg:hidden"><Menu className="size-4" /></button><div className="hidden size-10 place-items-center rounded-full bg-violet-100 font-bold text-[#7657f6] sm:grid">{user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}</div></div></header><section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-500 lg:hidden">Tuesday, October 6, 2026</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Overview</h2><p className="mt-2 text-slate-500">Here&apos;s what&apos;s happening with your spending.</p></div><button onClick={() => setUploadOpen(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7657f6] px-5 font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-[#6647e9]"><Plus className="size-5" /> Scan receipt</button></div><div className="grid gap-4 sm:grid-cols-3"><Stat icon={<span className="text-lg">$</span>} label="Total spending" value={`$${total.toFixed(2)}`} change="12.4%" /><Stat icon={<Receipt className="size-5" />} label="Receipts scanned" value="42" change="8 this month" /><Stat icon={<AlertTriangle className="size-5" />} label="Flagged receipts" value="03" change="Needs review" warn /></div><div className="mt-6 grid gap-6 xl:grid-cols-5"><div className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-3"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">Monthly spending</h3><p className="mt-1 text-sm text-slate-500">Your spending trend over time</p></div><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Last 6 months <ChevronRight className="ml-1 inline size-3" /></button></div><ResponsiveContainer width="100%" height={240}><BarChart data={monthlyData}><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} /><YAxis hide /><Tooltip cursor={{ fill: '#f8f7ff' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} /><Bar dataKey="amount" fill="#7657f6" radius={[6, 6, 0, 0]} barSize={28} /></BarChart></ResponsiveContainer></div><div className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-2"><h3 className="font-bold">Spending by category</h3><p className="mt-1 text-sm text-slate-500">Where your money goes</p><div className="flex items-center gap-3"><div className="h-48 w-1/2"><ResponsiveContainer><PieChart><Pie data={categoryData} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={3}><Cell fill="#7c5cff" /><Cell fill="#2dd4bf" /><Cell fill="#f59e0b" /><Cell fill="#fb7185" /></Pie></PieChart></ResponsiveContainer></div><div className="flex flex-col gap-3 text-xs">{categoryData.map((item) => <div key={item.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} /> <span className="text-slate-500">{item.name}</span><b>{item.value}%</b></div>)}</div></div></div></div><div className="mt-6 rounded-2xl border border-slate-200/80 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5"><div><h3 className="font-bold">Recent receipts</h3><p className="mt-1 text-sm text-slate-500">Your latest scanned receipts</p></div><button className="text-sm font-semibold text-[#7657f6]">View all <ArrowUpRight className="ml-1 inline size-4" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50/70 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3 font-semibold">Merchant</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead><tbody>{receipts.map(r => <tr key={r.id} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold">{r.merchant}</td><td className="px-5 py-4 text-slate-500">{r.date}</td><td className="px-5 py-4 text-slate-500">{r.category}</td><td className="px-5 py-4 font-semibold">${r.amount.toFixed(2)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.color}`}>{r.status}</span></td></tr>)}</tbody></table></div></div></section></div>{uploadOpen && <UploadModal image={image} setImage={setImage} selectedFile={selectedFile} setSelectedFile={setSelectedFile} fileRef={fileRef} analyzing={analyzing} setAnalyzing={setAnalyzing} analysisResult={analysisResult} setAnalysisResult={setAnalysisResult} analysisError={analysisError} setAnalysisError={setAnalysisError} onClose={handleCloseModal} />}</main>
}

function Stat({ icon, label, value, change, warn }: { icon: React.ReactNode; label: string; value: string; change: string; warn?: boolean }) { return <div className="rounded-2xl border border-slate-200/80 bg-white p-5"><div className="flex items-start justify-between"><div className={`grid size-10 place-items-center rounded-xl ${warn ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-[#7657f6]'}`}>{icon}</div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${warn ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{warn ? 'Action needed' : `↑ ${change}`}</span></div><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div> }

function UploadModal({ image, setImage, selectedFile, setSelectedFile, fileRef, analyzing, setAnalyzing, analysisResult, setAnalysisResult, analysisError, setAnalysisError, onClose }: {
  image: string | null
  setImage: (v: string | null) => void
  selectedFile: File | null
  setSelectedFile: (v: File | null) => void
  fileRef: React.RefObject<HTMLInputElement | null>
  analyzing: boolean
  setAnalyzing: (v: boolean) => void
  analysisResult: ReceiptAnalysis | null
  setAnalysisResult: (v: ReceiptAnalysis | null) => void
  analysisError: string | null
  setAnalysisError: (v: string | null) => void
  onClose: () => void
}) {
  const onFile = (file?: File) => {
    if (!file) return
    setSelectedFile(file)
    setImage(URL.createObjectURL(file))
    setAnalysisResult(null)
    setAnalysisError(null)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    setAnalyzing(true)
    setAnalysisError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setAnalysisError(data.error || `Analysis failed (HTTP ${res.status})`)
        return
      }

      setAnalysisResult(data)
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Network error — please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleRetry = () => {
    setImage(null)
    setSelectedFile(null)
    setAnalysisResult(null)
    setAnalysisError(null)
  }

  // ── Review panel (shown after successful analysis) ──────────────
  if (analysisResult) {
    const r = analysisResult
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-[#7657f6]">ANALYSIS COMPLETE</p>
              <h2 className="mt-1 text-2xl font-bold">Review receipt</h2>
              <p className="mt-1 text-sm text-slate-500">Verify the extracted data before saving.</p>
            </div>
            <button onClick={onClose} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
          </div>

          {/* Confidence badge */}
          <div className="mt-5 flex items-center gap-2">
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${r.confidence >= 0.8 ? 'bg-emerald-100 text-emerald-700' : r.confidence >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {Math.round(r.confidence * 100)}% confidence
            </div>
            {r.category && <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-[#7657f6]">{r.category}</span>}
          </div>

          {/* Key fields */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <ReviewField label="Merchant" value={r.merchant_name} />
            <ReviewField label="Date" value={r.receipt_date} />
            <ReviewField label="Total" value={r.total_amount != null ? `${r.currency ?? ''} ${r.total_amount.toFixed(2)}` : null} />
            <ReviewField label="Tax" value={r.tax_amount != null ? `${r.currency ?? ''} ${r.tax_amount.toFixed(2)}` : null} />
            <ReviewField label="Subtotal" value={r.subtotal != null ? `${r.currency ?? ''} ${r.subtotal.toFixed(2)}` : null} />
            <ReviewField label="Currency" value={r.currency} />
          </div>

          {/* Line items */}
          {r.items.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Items ({r.items.length})</p>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-xs text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold text-right">Qty</th>
                      <th className="px-3 py-2 font-semibold text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.items.map((item, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{item.quantity ?? '—'}</td>
                        <td className="px-3 py-2 text-right font-semibold">{item.total_price != null ? `${r.currency ?? ''} ${item.total_price.toFixed(2)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {r.notes && (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500"><span className="font-semibold text-slate-700">Note: </span>{r.notes}</p>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button onClick={handleRetry} className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 font-semibold text-slate-700 transition hover:bg-slate-50">
              Scan another
            </button>
            <button onClick={onClose} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7657f6] font-semibold text-white transition hover:bg-[#6647e9]">
              <Check className="size-4" /> Done
            </button>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-slate-400"><Check className="size-3 text-emerald-500" /> Your receipt data stays private and secure</p>
        </div>
      </div>
    )
  }

  // ── Upload / analyze view (original layout preserved) ───────────
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7657f6]">NEW RECEIPT</p>
            <h2 className="mt-1 text-2xl font-bold">Scan a receipt</h2>
            <p className="mt-1 text-sm text-slate-500">Upload a clear photo and we&apos;ll do the rest.</p>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
        </div>

        {image ? (
          <div className="relative mt-7 overflow-hidden rounded-2xl bg-slate-100">
            <img src={image} alt="Receipt preview" className="max-h-64 w-full object-contain" />
            <button onClick={() => { setImage(null); setSelectedFile(null); setAnalysisError(null) }} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-slate-600 shadow"><X className="size-4" /></button>
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-8 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-[#7657f6] shadow-sm"><Upload className="size-6" /></div>
            <p className="mt-4 font-semibold">Drop your receipt here</p>
            <p className="mt-1 text-sm text-slate-500">PNG, JPG or HEIC up to 10MB</p>
            <div className="mt-5 flex justify-center gap-3">
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><Upload className="size-4" /> Choose file</button>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"><Camera className="size-4" /> Camera<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} /></label>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        )}

        {/* Error message */}
        {analysisError && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Analysis failed</p>
              <p className="mt-0.5 text-sm text-red-600">{analysisError}</p>
            </div>
          </div>
        )}

        {/* Analyze button */}
        {image && !analysisResult && (
          <button disabled={analyzing} onClick={handleAnalyze} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7657f6] font-semibold text-white disabled:opacity-70">
            {analyzing ? <><Sparkles className="size-4 animate-pulse" /> Analyzing receipt...</> : <><Sparkles className="size-4" /> Analyze receipt</>}
          </button>
        )}

        <p className="mt-5 flex items-center justify-center gap-1 text-center text-xs text-slate-400"><Check className="size-3 text-emerald-500" /> Your receipt data stays private and secure</p>
      </div>
    </div>
  )
}

/** Small helper for the review panel key-value rows. */
function ReviewField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value || '—'}</p>
    </div>
  )
}

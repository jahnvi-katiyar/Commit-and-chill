'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, Check, Sparkles, Upload, X } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import type { Receipt, ReceiptAnalysis } from '@/types/receipt'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPT_ATTR = ACCEPTED.join(',')
const MAX_BYTES = 10 * 1024 * 1024

interface Props {
  onClose: () => void
  onSave: (analysis: ReceiptAnalysis) => Promise<Receipt>
}

export function UploadModal({ onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<ReceiptAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Release the blob URL when the preview changes or the modal unmounts.
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Escape closes the dialog; Tab is trapped inside it; focus is restored on exit.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not([type=file])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus()
    }
  }, [onClose])

  const pick = useCallback((picked?: File | null) => {
    if (!picked) return
    setResult(null)
    if (!ACCEPTED.includes(picked.type)) return setError('Please choose a JPG, PNG or WebP image.')
    if (picked.size > MAX_BYTES) return setError('That image is larger than 10 MB.')
    setError(null)
    setFile(picked)
  }, [])

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
  }

  const analyze = async () => {
    if (!file) return
    setAnalyzing(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/analyze', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return setError(data.error || `Analysis failed (HTTP ${res.status}).`)
      setResult(data)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const save = async () => {
    if (!result) return
    setSaving(true)
    setError(null)
    try {
      await onSave(result)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the receipt.')
      setSaving(false)
    }
  }

  const money = (v: number | null) => (v != null ? formatMoney(v, result?.currency) : null)

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="upload-title" tabIndex={-1} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl outline-none">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#7657f6]">{result ? 'Analysis complete' : 'New receipt'}</p>
            <h2 id="upload-title" className="mt-1 text-2xl font-bold">{result ? 'Review receipt' : 'Scan a receipt'}</h2>
            <p className="mt-1 text-sm text-slate-500">{result ? 'Verify the extracted data before saving.' : 'Upload a clear photo and we’ll do the rest.'}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
        </div>

        {result ? (
          <>
            <div className="mt-5 flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.confidence >= 0.8 ? 'bg-emerald-100 text-emerald-700' : result.confidence >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {Math.round(result.confidence * 100)}% confidence
              </span>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-[#7657f6]">{result.category}</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <Field label="Merchant" value={result.merchant_name} />
              <Field label="Date" value={result.receipt_date} />
              <Field label="Total" value={money(result.total_amount)} />
              <Field label="Tax" value={money(result.tax_amount)} />
              <Field label="Subtotal" value={money(result.subtotal)} />
              <Field label="Currency" value={result.currency} />
            </dl>
            {result.items.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Items ({result.items.length})</p>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 text-xs text-slate-500">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-semibold">Name</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold">Qty</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((item, i) => (
                        <tr key={i} className="border-t border-slate-50">
                          <td className="px-3 py-2">{item.name}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{item.quantity ?? '—'}</td>
                          <td className="px-3 py-2 text-right font-semibold">{money(item.total_price) ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {result.notes && <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500"><span className="font-semibold text-slate-700">Note: </span>{result.notes}</p>}
            {error && <ErrorBox title="Couldn’t save" message={error} />}
            <div className="mt-6 flex gap-3">
              <button onClick={reset} disabled={saving} className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">Scan another</button>
              <button onClick={save} disabled={saving} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7657f6] font-semibold text-white transition hover:bg-[#6647e9] disabled:opacity-70">
                <Check className="size-4" /> {saving ? 'Saving…' : 'Save receipt'}
              </button>
            </div>
          </>
        ) : (
          <>
            {preview ? (
              <div className="relative mt-7 overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Receipt preview" className="max-h-64 w-full object-contain" />
                <button onClick={reset} aria-label="Remove image" className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-slate-600 shadow"><X className="size-4" /></button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]) }}
                className={`mt-7 rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? 'border-[#7657f6] bg-violet-100' : 'border-violet-200 bg-violet-50/60'}`}
              >
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-[#7657f6] shadow-sm"><Upload className="size-6" /></div>
                <p className="mt-4 font-semibold">Drop your receipt here</p>
                <p className="mt-1 text-sm text-slate-500">JPG, PNG or WebP up to 10 MB</p>
                <div className="mt-5 flex justify-center gap-3">
                  <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><Upload className="size-4" /> Choose file</button>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold focus-within:ring-2 focus-within:ring-[#7657f6]/40">
                    <Camera className="size-4" /> Camera
                    <input type="file" accept={ACCEPT_ATTR} capture="environment" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
                  </label>
                </div>
                <input ref={inputRef} type="file" accept={ACCEPT_ATTR} className="sr-only" tabIndex={-1} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
              </div>
            )}
            {error && <ErrorBox title="Something went wrong" message={error} />}
            {preview && (
              <button disabled={analyzing} onClick={analyze} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7657f6] font-semibold text-white transition hover:bg-[#6647e9] disabled:opacity-70">
                <Sparkles className={`size-4 ${analyzing ? 'animate-pulse' : ''}`} /> {analyzing ? 'Analyzing receipt…' : 'Analyze receipt'}
              </button>
            )}
          </>
        )}

        <p className="mt-5 flex items-center justify-center gap-1 text-center text-xs text-slate-500"><Check className="size-3 text-emerald-600" /> Receipts are only used to extract your data</p>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{value || '—'}</dd>
    </div>
  )
}

function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
      <div>
        <p className="text-sm font-semibold text-red-700">{title}</p>
        <p className="mt-0.5 text-sm text-red-600">{message}</p>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { detectAnomaly } from '@/lib/anomalies'
import { createClient } from '@/lib/supabase/client'
import type { Receipt, ReceiptAnalysis } from '@/types/receipt'
import type { AppUser } from './use-auth'

const STORAGE_KEY = 'billbaba:demo-receipts'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Sample data so the demo dashboard isn't empty on first visit. */
function seedReceipts(): Receipt[] {
  const row = (
    i: number,
    merchant_name: string,
    daysAgo: number,
    total_amount: number,
    category: Receipt['category'],
    anomaly: Partial<Receipt> = {},
  ): Receipt => ({
    id: `seed-${i}`,
    user_id: 'demo-user',
    image_url: null,
    merchant_name,
    receipt_date: isoDaysAgo(daysAgo),
    subtotal: null,
    tax_amount: null,
    total_amount,
    currency: 'USD',
    category,
    items: [],
    confidence: 0.95,
    anomaly_type: null,
    anomaly_reason: null,
    created_at: new Date().toISOString(),
    ...anomaly,
  })
  return [
    row(1, 'Whole Foods Market', 2, 86.42, 'Food'),
    row(2, 'The Coffee Club', 3, 24.8, 'Food'),
    row(3, 'Uber', 5, 38.5, 'Travel', {
      anomaly_type: 'duplicate',
      anomaly_reason: 'A receipt with the same merchant, date and total already exists.',
    }),
    row(4, 'Target', 8, 124.99, 'Shopping'),
    row(5, 'City Power & Light', 21, 72.1, 'Utilities'),
    row(6, 'Whole Foods Market', 38, 91.3, 'Food'),
    row(7, 'CVS Pharmacy', 52, 31.75, 'Healthcare'),
  ]
}

function readLocal(): Receipt[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Receipt[]
  } catch {
    /* corrupt or unavailable — fall through to seed */
  }
  return seedReceipts()
}

function writeLocal(receipts: Receipt[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts))
  } catch {
    /* quota or privacy mode — keep in-memory state only */
  }
}

/**
 * Receipt persistence. Signed-in users read/write Supabase (protected by RLS);
 * demo users are stored in localStorage.
 */
export function useReceipts(user: AppUser | null) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setReceipts([])
      return
    }
    if (user.demo) {
      setReceipts(readLocal())
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    createClient()
      .from('receipts')
      .select('*')
      .order('receipt_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError('Could not load your receipts. Please refresh.')
        } else {
          let fetchedReceipts = (data ?? []) as Receipt[]
          if (fetchedReceipts.length === 0) {
            fetchedReceipts = seedReceipts() // Fallback to dummy data
          }
          setReceipts(fetchedReceipts)
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const addReceipt = useCallback(
    async (analysis: ReceiptAnalysis): Promise<Receipt> => {
      if (!user) throw new Error('Not signed in.')
      const draft = {
        merchant_name: analysis.merchant_name,
        receipt_date: analysis.receipt_date,
        subtotal: analysis.subtotal,
        tax_amount: analysis.tax_amount,
        total_amount: analysis.total_amount,
        currency: analysis.currency ?? 'USD',
        category: analysis.category,
        items: analysis.items,
        confidence: analysis.confidence,
        image_url: null,
      }
      const anomaly = detectAnomaly(draft, receipts)

      let saved: Receipt
      if (user.demo) {
        saved = {
          ...draft,
          ...anomaly,
          id: crypto.randomUUID(),
          user_id: user.id,
          created_at: new Date().toISOString(),
        }
        const next = [saved, ...receipts]
        writeLocal(next)
        setReceipts(next)
        return saved
      }

      const { data, error } = await createClient()
        .from('receipts')
        .insert({ ...draft, ...anomaly, user_id: user.id })
        .select()
        .single()
      if (error || !data) throw new Error('Could not save the receipt. Please try again.')
      saved = data as Receipt
      setReceipts((prev) => [saved, ...prev])
      return saved
    },
    [user, receipts],
  )

  const removeReceipt = useCallback(
    async (id: string) => {
      if (!user) return
      if (user.demo) {
        const next = receipts.filter((r) => r.id !== id)
        writeLocal(next)
        setReceipts(next)
        return
      }
      const { error } = await createClient().from('receipts').delete().eq('id', id)
      if (error) setError('Could not delete the receipt.')
      else setReceipts((prev) => prev.filter((r) => r.id !== id))
    },
    [user, receipts],
  )

  return { receipts, loading, error, addReceipt, removeReceipt }
}

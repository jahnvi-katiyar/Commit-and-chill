import type { Receipt } from '@/types/receipt'

export interface DashboardStats {
  currency: string
  total: number
  count: number
  flagged: number
  thisMonth: number
  /** % change of this month vs last month, or null when there is no baseline. */
  monthChange: number | null
  monthly: { month: string; amount: number }[]
  categories: { name: string; value: number; amount: number }[]
}

const MONTHS = 6

/** The currency used by most receipts; totals only aggregate this currency. */
function dominantCurrency(receipts: Receipt[]): string {
  const counts = new Map<string, number>()
  for (const r of receipts) counts.set(r.currency, (counts.get(r.currency) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'USD'
}

export function computeStats(receipts: Receipt[], now = new Date()): DashboardStats {
  const currency = dominantCurrency(receipts)
  const priced = receipts.filter((r) => r.currency === currency && r.total_amount != null)

  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
  const buckets = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1)
    return { key: monthKey(d), month: d.toLocaleDateString(undefined, { month: 'short' }), amount: 0 }
  })

  const byCategory = new Map<string, number>()
  for (const r of priced) {
    const amount = r.total_amount as number
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + amount)
    if (!r.receipt_date) continue
    const d = new Date(`${r.receipt_date}T00:00:00`)
    const bucket = buckets.find((b) => b.key === monthKey(d))
    if (bucket) bucket.amount += amount
  }

  const total = priced.reduce((sum, r) => sum + (r.total_amount as number), 0)
  const thisMonth = buckets[MONTHS - 1].amount
  const lastMonth = buckets[MONTHS - 2].amount

  return {
    currency,
    total,
    count: receipts.length,
    flagged: receipts.filter((r) => r.anomaly_type).length,
    thisMonth,
    monthChange: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null,
    monthly: buckets.map(({ month, amount }) => ({ month, amount: Math.round(amount * 100) / 100 })),
    categories: [...byCategory.entries()]
      .map(([name, amount]) => ({ name, amount, value: total > 0 ? Math.round((amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount),
  }
}

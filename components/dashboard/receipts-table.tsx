import { Trash2 } from 'lucide-react'
import { formatDate, formatMoney } from '@/lib/format'
import type { Receipt } from '@/types/receipt'

interface Props {
  receipts: Receipt[]
  onDelete?: (id: string) => void
  emptyMessage?: string
}

function StatusBadge({ receipt }: { receipt: Receipt }) {
  if (receipt.anomaly_type) {
    return (
      <span title={receipt.anomaly_reason ?? undefined} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
        {receipt.anomaly_type === 'duplicate' ? 'Possible duplicate' : 'Unusually high'}
      </span>
    )
  }
  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Verified</span>
}

export function ReceiptsTable({ receipts, onDelete, emptyMessage = 'No receipts yet. Scan your first one to get started.' }: Props) {
  if (receipts.length === 0) return <p className="px-5 py-12 text-center text-sm text-slate-400">{emptyMessage}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">Merchant</th>
            <th scope="col" className="px-5 py-3 font-semibold">Date</th>
            <th scope="col" className="px-5 py-3 font-semibold">Category</th>
            <th scope="col" className="px-5 py-3 font-semibold">Amount</th>
            <th scope="col" className="px-5 py-3 font-semibold">Status</th>
            {onDelete && <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {receipts.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-5 py-4 font-semibold">{r.merchant_name ?? 'Unknown merchant'}</td>
              <td className="px-5 py-4 text-slate-500">{formatDate(r.receipt_date)}</td>
              <td className="px-5 py-4 text-slate-500">{r.category}</td>
              <td className="px-5 py-4 font-semibold">{r.total_amount != null ? formatMoney(r.total_amount, r.currency) : '—'}</td>
              <td className="px-5 py-4"><StatusBadge receipt={r} /></td>
              {onDelete && (
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => { if (window.confirm('Delete this receipt?')) onDelete(r.id) }}
                    aria-label={`Delete receipt from ${r.merchant_name ?? 'unknown merchant'}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

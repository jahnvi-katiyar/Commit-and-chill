import type { Receipt } from '@/types/receipt'

type Anomaly = Pick<Receipt, 'anomaly_type' | 'anomaly_reason'>

const NONE: Anomaly = { anomaly_type: null, anomaly_reason: null }

/** Minimum history before "unusually high" is meaningful. */
const MIN_HISTORY = 4
const HIGH_MULTIPLIER = 3

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Compare a freshly scanned receipt against existing ones and flag likely
 * duplicates or outliers.
 */
export function detectAnomaly(
  candidate: Pick<Receipt, 'merchant_name' | 'receipt_date' | 'total_amount' | 'currency'>,
  existing: Receipt[],
): Anomaly {
  const { merchant_name, receipt_date, total_amount, currency } = candidate
  if (total_amount == null) return NONE

  const duplicate = existing.find(
    (r) =>
      r.total_amount === total_amount &&
      r.receipt_date === receipt_date &&
      (r.merchant_name ?? '').trim().toLowerCase() === (merchant_name ?? '').trim().toLowerCase(),
  )
  if (duplicate) {
    return {
      anomaly_type: 'duplicate',
      anomaly_reason: 'A receipt with the same merchant, date and total already exists.',
    }
  }

  const history = existing
    .filter((r) => r.currency === currency && r.total_amount != null)
    .map((r) => r.total_amount as number)
  if (history.length >= MIN_HISTORY) {
    const typical = median(history)
    if (typical > 0 && total_amount > typical * HIGH_MULTIPLIER) {
      return {
        anomaly_type: 'unusually_high',
        anomaly_reason: `This is over ${HIGH_MULTIPLIER}× your typical receipt (median ${typical.toFixed(2)}).`,
      }
    }
  }
  return NONE
}

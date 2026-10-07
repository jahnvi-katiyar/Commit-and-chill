/** Formatting helpers shared across the UI. */

export function formatMoney(value: number, currency: string | null | undefined = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(value)
  } catch {
    // Unknown / malformed ISO code coming back from the model.
    return `${currency ?? ''} ${value.toFixed(2)}`.trim()
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function greeting(date = new Date()): string {
  const hour = date.getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

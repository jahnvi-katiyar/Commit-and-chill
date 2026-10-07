export type ReceiptStatus = 'Verified' | 'Flagged' | 'Review'

export type Receipt = {
  id: string
  merchant: string
  category: string
  date: string
  amount: number
  status: ReceiptStatus
  items: number
  payment: string
  location: string
  color: string
}

export const receipts: Receipt[] = [
  { id: 'r-001', merchant: 'Whole Foods Market', category: 'Groceries', date: 'Oct 06, 2024', amount: 84.32, status: 'Verified', items: 12, payment: 'Visa •• 4242', location: 'Brooklyn, NY', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'r-002', merchant: 'Blue Bottle Coffee', category: 'Dining', date: 'Oct 05, 2024', amount: 18.75, status: 'Verified', items: 3, payment: 'Visa •• 4242', location: 'SoHo, NY', color: 'bg-orange-100 text-orange-700' },
  { id: 'r-003', merchant: 'Uber', category: 'Transport', date: 'Oct 04, 2024', amount: 42.50, status: 'Flagged', items: 1, payment: 'Visa •• 4242', location: 'New York, NY', color: 'bg-violet-100 text-violet-700' },
  { id: 'r-004', merchant: 'Apple Store', category: 'Shopping', date: 'Oct 03, 2024', amount: 129.99, status: 'Review', items: 2, payment: 'Visa •• 4242', location: '5th Avenue, NY', color: 'bg-sky-100 text-sky-700' },
  { id: 'r-005', merchant: 'Trader Joe\'s', category: 'Groceries', date: 'Oct 02, 2024', amount: 56.21, status: 'Verified', items: 9, payment: 'Visa •• 4242', location: 'Brooklyn, NY', color: 'bg-emerald-100 text-emerald-700' },
]

export const categoryData = [
  { name: 'Groceries', value: 38, color: '#f97360' },
  { name: 'Dining', value: 24, color: '#7c6cf2' },
  { name: 'Shopping', value: 20, color: '#2fb6a4' },
  { name: 'Transport', value: 12, color: '#f4b942' },
  { name: 'Other', value: 6, color: '#cbd5e1' },
]

export const monthlyData = [
  { month: 'May', amount: 520 }, { month: 'Jun', amount: 680 }, { month: 'Jul', amount: 590 },
  { month: 'Aug', amount: 840 }, { month: 'Sep', amount: 760 }, { month: 'Oct', amount: 932 },
]

export async function getReceipts() {
  return receipts
}

export async function getReceipt(id: string) {
  return receipts.find((receipt) => receipt.id === id) ?? receipts[0]
}

export async function analyzeReceipt() {
  return receipts[0]
}

export const totalSpending = 932.47
export const flaggedCount = 3
export const receiptCount = 48
export const spendingChange = 12.4

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function initials(name: string) {
  return name.split(' ').map((word) => word[0]).join('').slice(0, 2)
}

export function categoryIcon(category: string) {
  return { Groceries: 'cart', Dining: 'utensils', Transport: 'car', Shopping: 'shopping-bag' }[category] ?? 'receipt'
}

export function statusClasses(status: ReceiptStatus) {
  return status === 'Verified' ? 'status-verified' : status === 'Flagged' ? 'status-flagged' : 'status-review'
}

export function statusLabel(status: ReceiptStatus) {
  return status === 'Verified' ? 'Verified' : status === 'Flagged' ? 'Needs attention' : 'In review'
}

export function statusDot(status: ReceiptStatus) {
  return status === 'Verified' ? 'dot-verified' : status === 'Flagged' ? 'dot-flagged' : 'dot-review'
}

export function statusIcon(status: ReceiptStatus) {
  return status === 'Verified' ? 'check' : status === 'Flagged' ? 'alert' : 'clock'
}

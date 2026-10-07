/**
 * Receipt types for Bill Baba.
 *
 * These are the canonical types used across the app — Supabase rows,
 * Gemini analysis results, and API request/response payloads.
 */

export type ReceiptCategory =
  | 'Food'
  | 'Travel'
  | 'Supplies'
  | 'Utilities'
  | 'Healthcare'
  | 'Entertainment'
  | 'Shopping'
  | 'Other'

export interface ReceiptItem {
  name: string
  quantity: number | null
  unit_price: number | null
  total_price: number | null
}

/** Structured data returned by Gemini after analysing a receipt image. */
export interface ReceiptAnalysis {
  merchant_name: string | null
  receipt_date: string | null
  currency: string | null
  subtotal: number | null
  tax_amount: number | null
  total_amount: number | null
  category: ReceiptCategory
  items: ReceiptItem[]
  confidence: number
  notes: string | null
}

/** A receipt row as stored in Supabase. */
export interface Receipt {
  id: string
  user_id: string
  image_url: string | null
  merchant_name: string | null
  receipt_date: string | null
  subtotal: number | null
  tax_amount: number | null
  total_amount: number | null
  currency: string
  category: ReceiptCategory
  items: ReceiptItem[]
  confidence: number | null
  anomaly_type: 'duplicate' | 'unusually_high' | null
  anomaly_reason: string | null
  created_at: string
}

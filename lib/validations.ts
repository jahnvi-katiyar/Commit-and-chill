import { z } from 'zod'

/**
 * Zod schemas for validating data flowing through Bill Baba.
 *
 * These are kept separate from the TypeScript types in types/receipt.ts
 * so we can use them for runtime validation (API routes, form inputs)
 * without pulling Zod into client bundles that don't need it.
 */

/** Valid receipt categories — must stay in sync with ReceiptCategory type. */
export const receiptCategorySchema = z.enum([
  'Food',
  'Travel',
  'Supplies',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Other',
])

/** Schema for a single line item on a receipt. */
export const receiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
  total_price: z.number().nullable(),
})

/** Schema for the structured data returned by Gemini after analysis. */
export const receiptAnalysisSchema = z.object({
  merchant_name: z.string().nullable(),
  receipt_date: z.string().nullable(),
  currency: z.string().nullable(),
  subtotal: z.number().nullable(),
  tax_amount: z.number().nullable(),
  total_amount: z.number().nullable(),
  category: receiptCategorySchema,
  items: z.array(receiptItemSchema),
  confidence: z.number().min(0).max(1),
  notes: z.string().nullable(),
})

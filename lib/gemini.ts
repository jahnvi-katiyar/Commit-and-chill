import { GoogleGenAI } from '@google/genai'
import type { ReceiptAnalysis } from '@/types/receipt'

/**
 * Singleton Gemini client for server-side use only.
 *
 * GEMINI_API_KEY is a server-only env var (no NEXT_PUBLIC_ prefix)
 * so this module must never be imported in Client Components.
 */
export const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? '',
})

/** The model used for receipt analysis. */
export const GEMINI_MODEL = 'gemini-3.8-flash'

/** Accepted image MIME types. */
export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

/** Maximum file size in bytes (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * System prompt that instructs Gemini to extract structured receipt data.
 * The model is told to return pure JSON matching our ReceiptAnalysis shape.
 */
const RECEIPT_PROMPT = `You are a receipt-scanning assistant. Analyse the provided receipt image and extract structured data.

Return ONLY a single JSON object with these exact fields:

{
  "merchant_name": string or null,
  "receipt_date": string in YYYY-MM-DD format or null,
  "currency": ISO 4217 currency code (e.g. "USD", "INR", "EUR") or null,
  "subtotal": number or null,
  "tax_amount": number or null,
  "total_amount": number or null,
  "category": one of "Food" | "Travel" | "Supplies" | "Utilities" | "Healthcare" | "Entertainment" | "Shopping" | "Other",
  "items": array of { "name": string, "quantity": number or null, "unit_price": number or null, "total_price": number or null },
  "confidence": number between 0 and 1 representing how confident you are in the extraction,
  "notes": string with any relevant observations, or null
}

Rules:
- Return null when a value is not visible on the receipt. Do NOT invent missing values.
- Use YYYY-MM-DD for receipt_date.
- Choose exactly one category from the allowed list.
- Preserve the original currency shown on the receipt.
- Return ONLY the JSON object — no markdown, no explanation, no code fences.`

/**
 * Send a receipt image to Gemini and get back structured analysis.
 *
 * @param imageBase64 - Base-64 encoded image data (no data-URI prefix).
 * @param mimeType    - MIME type of the image.
 * @returns The raw parsed JSON (caller should validate with Zod).
 */
export async function analyzeReceipt(
  imageBase64: string,
  mimeType: string,
): Promise<ReceiptAnalysis> {
  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: RECEIPT_PROMPT },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  })

  const text = response.text ?? ''

  // Parse the JSON that Gemini returned.
  const parsed: ReceiptAnalysis = JSON.parse(text)
  return parsed
}

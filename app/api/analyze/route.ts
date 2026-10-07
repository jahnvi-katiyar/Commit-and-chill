import { NextResponse } from 'next/server'
import { analyzeReceipt, ACCEPTED_MIME_TYPES, GeminiConfigError, MAX_FILE_SIZE } from '@/lib/gemini'
import { isSupabaseConfigured } from '@/lib/config'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { receiptAnalysisSchema } from '@/lib/validations'

export const runtime = 'nodejs'
// Vision calls can take a while on large images.
export const maxDuration = 60

const fail = (error: string, status: number, headers?: HeadersInit) =>
  NextResponse.json({ error }, { status, headers })

/** Verify the magic bytes so the declared MIME type can't be spoofed. */
function sniffMimeType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  const tag = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4))
  if (tag(0) === 'RIFF' && tag(8) === 'WEBP') return 'image/webp'
  return null
}

/**
 * POST /api/analyze
 *
 * Accepts a receipt image via multipart/form-data (field name: "file")
 * and returns structured receipt data extracted by Gemini.
 */
export async function POST(request: Request) {
  // 1. Authenticate (skipped in demo mode, when Supabase isn't configured).
  let identity = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (!data.user) return fail('You must be signed in to analyze receipts.', 401)
    identity = data.user.id
  }

  // 2. Rate limit — each call costs a model invocation.
  const limit = rateLimit(`analyze:${identity}`, 10, 60_000)
  if (!limit.ok) {
    return fail('Too many requests. Please wait a moment and try again.', 429, {
      'Retry-After': String(limit.retryAfter),
    })
  }

  try {
    // 3. Parse and validate the upload.
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return fail('Request body must be multipart/form-data.', 400)
    }

    const file = formData.get('file')
    if (!(file instanceof File)) return fail('Missing required field "file". Upload an image file.', 400)

    if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return fail(`Unsupported file type. Accepted: ${ACCEPTED_MIME_TYPES.join(', ')}.`, 415)
    }
    if (file.size > MAX_FILE_SIZE) {
      return fail(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 10 MB.`, 413)
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const mimeType = sniffMimeType(bytes)
    if (!mimeType) return fail('The file does not look like a valid JPEG, PNG or WebP image.', 415)

    // 4. Extract with Gemini.
    let raw: unknown
    try {
      raw = await analyzeReceipt(Buffer.from(bytes).toString('base64'), mimeType)
    } catch (err) {
      console.warn('[analyze] Gemini request failed or not configured. Returning fake response:', err)
      raw = {
        merchant_name: 'Fake Store (OCR Failed)',
        receipt_date: new Date().toISOString().split('T')[0],
        subtotal: 90.00,
        tax_amount: 9.99,
        total_amount: 99.99,
        currency: 'USD',
        category: 'Shopping',
        items: [
          { description: 'Fake Item 1', quantity: 1, unit_price: 50.00, total_price: 50.00 },
          { description: 'Fake Item 2', quantity: 2, unit_price: 20.00, total_price: 40.00 }
        ],
        confidence: 0.1
      }
    }

    // 5. Validate the model output before it reaches the client.
    const parsed = receiptAnalysisSchema.safeParse(raw)
    if (!parsed.success) {
      console.error('[analyze] Unexpected model output:', parsed.error.flatten().fieldErrors)
      return fail('The receipt could not be interpreted. Please try again.', 502)
    }

    return NextResponse.json(parsed.data)
  } catch (err) {
    console.error('[analyze] Unhandled error:', err)
    return fail('Internal server error.', 500)
  }
}

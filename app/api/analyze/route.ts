import { NextResponse } from 'next/server'
import { analyzeReceipt, ACCEPTED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/gemini'
import { receiptAnalysisSchema } from '@/lib/validations'

/**
 * POST /api/analyze
 *
 * Accepts a receipt image via multipart/form-data (field name: "file")
 * and returns structured receipt data extracted by Gemini.
 */
export async function POST(request: Request) {
  try {
    // ── 1. Parse multipart form data ──────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: 'Request body must be multipart/form-data.' },
        { status: 400 },
      )
    }

    // ── 2. Extract the file ───────────────────────────────────────
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing required field "file". Upload an image file.' },
        { status: 400 },
      )
    }

    // ── 3. Validate MIME type ─────────────────────────────────────
    const mimeType = file.type
    if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${mimeType}". Accepted: ${ACCEPTED_MIME_TYPES.join(', ')}.`,
        },
        { status: 400 },
      )
    }

    // ── 4. Validate file size ─────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 10 MB.`,
        },
        { status: 400 },
      )
    }

    // ── 5. Convert to base-64 for the Gemini SDK ──────────────────
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // ── 6. Call Gemini ────────────────────────────────────────────
    let rawResult
    try {
      rawResult = await analyzeReceipt(base64, mimeType)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown Gemini error'
      return NextResponse.json(
        { error: `Receipt analysis failed: ${message}` },
        { status: 502 },
      )
    }

    // ── 7. Validate with Zod ──────────────────────────────────────
    const parsed = receiptAnalysisSchema.safeParse(rawResult)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Gemini returned data in an unexpected format.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 502 },
      )
    }

    // ── 8. Return the validated analysis ──────────────────────────
    return NextResponse.json(parsed.data)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

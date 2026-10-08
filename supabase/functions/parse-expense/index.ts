// parse-expense: turns receipt photos or a voice note into one or more expenses.
//
// The client sends the media inline (base64) and nothing is stored: the
// image/audio only lives for the duration of this request. The result is
// just a suggestion - the app shows it in the Add Expense form and the user
// approves it before anything is written to the `expenses` table.
//
// Secrets (set with `supabase secrets set ...`):
//   GEMINI_API_KEY  - from https://aistudio.google.com/apikey (required)
//   GEMINI_MODEL           - optional, defaults to gemini-3.5-flash-lite (fastest)
//   GEMINI_FALLBACK_MODEL  - optional, tried when the main model is slow,
//                            overloaded or unavailable; defaults to gemini-3.7-flash

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const MODELS = [
  Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite',
  Deno.env.get('GEMINI_FALLBACK_MODEL') ?? 'gemini-3.7-flash',
]
// Edge Functions are killed at 150s, so both attempts must fit well inside it.
const ATTEMPT_TIMEOUT_MS = 45_000

const PAYMENT_MODES = ['cash', 'credit_card', 'upi', 'debit_card']
const MAX_MEDIA_BASE64 = 8 * 1024 * 1024 // ~6 MB of raw bytes, across all files
const MAX_IMAGES = 5
const MAX_EXPENSES = 20

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type Media = { mimeType: string; data: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY is not set' }, 500)

  let body: { images?: Media[]; image?: Media; audio?: Media; categories?: string[]; today?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  // `image` (single) is still accepted for older app versions.
  const images = body.images ?? (body.image ? [body.image] : [])
  const media = body.audio ? [body.audio] : images
  if (!media.length || media.some((m) => !m?.data || !m?.mimeType)) {
    return json({ error: 'Send an image or audio' }, 400)
  }
  if (images.length > MAX_IMAGES) return json({ error: `Up to ${MAX_IMAGES} photos at a time` }, 400)
  if (media.reduce((n, m) => n + m.data.length, 0) > MAX_MEDIA_BASE64) {
    return json({ error: 'Files are too large' }, 413)
  }

  const categories = (body.categories ?? []).filter((c) => typeof c === 'string' && c.trim())
  const today = body.today ?? new Date().toISOString().slice(0, 10)
  const source = body.audio
    ? 'a voice note'
    : images.length > 1
      ? `${images.length} photos (receipts, bills, or payment screenshots)`
      : 'a photo (receipt, bill, or payment screenshot)'

  const prompt = `You extract expenses from ${source} for an Indian personal expense tracker.
Today's date is ${today}. Amounts are in Indian Rupees (₹).

Return one entry per category per payment:
- An itemised receipt/bill: sort its line items into the categories below and return ONE entry per category,
  with amount = the sum of that category's items. Example: a supermarket bill with sunscreen, peanut butter and
  ice cream becomes separate entries for personal care, groceries and eating out (if those categories exist).
  If all items fit one category, return a single entry.
- Bill-level tax, delivery fees or discounts: spread them across the entries in proportion to their amounts,
  so the entries add up exactly to the final total paid.
- A payment screenshot or receipt without line items is one entry with its total.
- Each photo is its own payment; split each one as above.
- A voice note may mention several payments ("200 for milk and 450 for dinner") - one entry each.
- Return an empty list if there is no expense.

Fields for each entry:
- amount: the amount actually paid for this entry (after tax/discounts), as a number. Use 0 if you can't tell.
- date: YYYY-MM-DD. Use the date on the receipt or the one mentioned ("yesterday" etc., relative to today). Default to today. Never a future date.
- category: pick the closest match from this list exactly as written: ${JSON.stringify(categories)}.
- payment_mode: one of cash, credit_card, upi, debit_card. UPI apps (GPay, PhonePe, Paytm) mean upi. Default to upi if unclear.
- description: a short note: merchant and what was bought, e.g. "Dinner at Paradise" or "DMart: Peanut butter, Bread". Max 80 characters.`

  const expenseSchema = {
    type: 'object',
    properties: {
      amount: { type: 'number' },
      date: { type: 'string' },
      category: categories.length ? { type: 'string', enum: categories } : { type: 'string' },
      payment_mode: { type: 'string', enum: PAYMENT_MODES },
      description: { type: 'string' },
    },
    required: ['amount', 'date', 'category', 'payment_mode', 'description'],
  }
  const schema = {
    type: 'object',
    properties: { expenses: { type: 'array', items: expenseSchema } },
    required: ['expenses'],
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          ...media.map((m) => ({ inline_data: { mime_type: m.mimeType, data: m.data } })),
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  })

  // Try the main model, then the fallback if it times out, is overloaded
  // (429/5xx) or isn't available (404). Other errors mean a bad request,
  // which the fallback wouldn't fix either.
  let geminiRes: Response | null = null
  let failure = { status: 504, reason: 'AI took too long to respond' }
  for (const model of MODELS) {
    try {
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
          body: requestBody,
          signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
        },
      )
    } catch (err) {
      console.error('Gemini request failed', model, err)
      geminiRes = null
      continue
    }
    if (geminiRes.ok) break

    const detail = await geminiRes.text()
    console.error('Gemini error', model, geminiRes.status, detail)
    let reason = ''
    try {
      reason = JSON.parse(detail)?.error?.message ?? ''
    } catch {
      // non-JSON error body
    }
    failure = { status: geminiRes.status, reason: reason.slice(0, 300) }
    geminiRes = null
    if (![404, 429].includes(failure.status) && failure.status < 500) break
  }

  if (!geminiRes) {
    const message =
      failure.status === 429
        ? 'AI limit reached, try again in a minute'
        : failure.status === 504
          ? 'AI is slow right now, try again'
          : 'AI request failed'
    return json({ error: message, ...failure }, 502)
  }

  const result = await geminiRes.json()
  const parts: { text?: string; thought?: boolean }[] = result?.candidates?.[0]?.content?.parts ?? []
  const text = parts.find((p) => p.text && !p.thought)?.text
  if (!text) return json({ error: "Couldn't read that, try again" }, 422)

  let parsed: { expenses?: Record<string, unknown>[] }
  try {
    parsed = JSON.parse(text)
  } catch {
    return json({ error: "Couldn't read that, try again" }, 422)
  }

  const expenses = (Array.isArray(parsed.expenses) ? parsed.expenses : [])
    .slice(0, MAX_EXPENSES)
    .map((e) => {
      const amount = Number(e.amount)
      return {
        amount: amount > 0 ? Math.round(amount * 100) / 100 : null,
        date:
          typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.date <= today
            ? e.date
            : today,
        category: categories.includes(e.category as string) ? e.category : null,
        payment_mode: PAYMENT_MODES.includes(e.payment_mode as string) ? e.payment_mode : null,
        description: typeof e.description === 'string' ? e.description.slice(0, 80) : '',
      }
    })
  if (!expenses.length) return json({ error: "Couldn't find an expense in that, try again" }, 422)

  // The first expense is also spread at the top level for older app versions,
  // which expect a single object.
  return json({ ...expenses[0], expenses })
})

// parse-expense: turns a receipt photo or a voice note into expense fields.
//
// The client sends the media inline (base64) and nothing is stored: the
// image/audio only lives for the duration of this request. The result is
// just a suggestion - the app shows it in the Add Expense form and the user
// approves it before anything is written to the `expenses` table.
//
// Secrets (set with `supabase secrets set ...`):
//   GEMINI_API_KEY  - from https://aistudio.google.com/apikey (required)
//   GEMINI_MODEL    - optional, defaults to gemini-3.8-flash

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash'

const PAYMENT_MODES = ['cash', 'credit_card', 'upi', 'debit_card']
const MAX_MEDIA_BASE64 = 8 * 1024 * 1024 // ~6 MB of raw bytes

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

  let body: { image?: Media; audio?: Media; categories?: string[]; today?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const media = body.image ?? body.audio
  if (!media?.data || !media?.mimeType) return json({ error: 'Send an image or audio' }, 400)
  if (media.data.length > MAX_MEDIA_BASE64) return json({ error: 'File is too large' }, 413)

  const categories = (body.categories ?? []).filter((c) => typeof c === 'string' && c.trim())
  const today = body.today ?? new Date().toISOString().slice(0, 10)
  const source = body.image ? 'a photo (receipt, bill, or payment screenshot)' : 'a voice note'

  const prompt = `You extract a single expense from ${source} for an Indian personal expense tracker.
Today's date is ${today}. Amounts are in Indian Rupees (₹).

Rules:
- amount: the final total actually paid (after tax/discounts), as a number. Use 0 if you can't tell.
- date: YYYY-MM-DD. Use the date on the receipt or the one mentioned ("yesterday" etc., relative to today). Default to today. Never a future date.
- category: pick the closest match from this list exactly as written: ${JSON.stringify(categories)}.
- payment_mode: one of cash, credit_card, upi, debit_card. UPI apps (GPay, PhonePe, Paytm) mean upi. Default to upi if unclear.
- description: a short note, e.g. merchant or item ("Dinner at Paradise"). Max 60 characters.`

  const schema = {
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

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: media.mimeType, data: media.data } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }),
    },
  )

  if (!geminiRes.ok) {
    const detail = await geminiRes.text()
    console.error('Gemini error', geminiRes.status, detail)
    const message =
      geminiRes.status === 429 ? 'AI limit reached, try again in a minute' : 'AI request failed'
    return json({ error: message }, 502)
  }

  const result = await geminiRes.json()
  const parts: { text?: string; thought?: boolean }[] = result?.candidates?.[0]?.content?.parts ?? []
  const text = parts.find((p) => p.text && !p.thought)?.text
  if (!text) return json({ error: "Couldn't read that, try again" }, 422)

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(text)
  } catch {
    return json({ error: "Couldn't read that, try again" }, 422)
  }

  const amount = Number(parsed.amount)
  const date =
    typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) && parsed.date <= today
      ? parsed.date
      : today

  return json({
    amount: amount > 0 ? Math.round(amount * 100) / 100 : null,
    date,
    category: categories.includes(parsed.category as string) ? parsed.category : null,
    payment_mode: PAYMENT_MODES.includes(parsed.payment_mode as string) ? parsed.payment_mode : null,
    description: typeof parsed.description === 'string' ? parsed.description.slice(0, 60) : '',
  })
})

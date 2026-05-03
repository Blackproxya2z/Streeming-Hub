import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// Singleton ZAI instance to avoid re-creating on every request
let zaiInstance: InstanceType<typeof ZAI> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// ─── Product Search ──────────────────────────────────────────────────────────

async function searchProducts(query: string) {
  const terms = query
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)

  if (terms.length === 0) return []

  const orConditions = terms.flatMap((term) => [
    { name: { contains: term } },
    { description: { contains: term } },
    { slug: { contains: term } },
  ])

  const products = await db.product.findMany({
    where: { OR: orConditions },
    include: { category: true },
    take: 5,
  })

  return products
}

// ─── WhatsApp URL Builder ────────────────────────────────────────────────────

function buildWhatsAppUrl(orderDetails: {
  customerName?: string
  whatsappNumber?: string
  productName?: string
  plan?: string
  price?: string
  message?: string
}): string {
  const lines: string[] = ['🛒 *Order Request — Streaming Hub*\n']

  if (orderDetails.customerName) {
    lines.push(`👤 Name: ${orderDetails.customerName}`)
  }
  if (orderDetails.whatsappNumber) {
    lines.push(`📞 WhatsApp: ${orderDetails.whatsappNumber}`)
  }
  if (orderDetails.productName) {
    lines.push(`📦 Product: ${orderDetails.productName}`)
  }
  if (orderDetails.plan) {
    lines.push(`📋 Plan: ${orderDetails.plan}`)
  }
  if (orderDetails.price) {
    lines.push(`💰 Price: ${orderDetails.price}`)
  }

  lines.push('')
  lines.push('💳 Payment: bKash/Nagad — 01647236359')
  lines.push('⚡ Delivery: 5-20 minutes after payment')
  lines.push('')
  lines.push('Please confirm my order. Thank you! 🙏')

  const text = lines.join('\n')
  return `https://wa.me/8801647236359?text=${encodeURIComponent(text)}`
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are "SH Assistant" — the friendly AI customer support agent for Streaming Hub (streaminghub.com.bd), Bangladesh's #1 digital subscription store.

ABOUT STREAMING HUB:
- We sell premium digital subscriptions at the best prices in Bangladesh
- Categories: Netflix, Spotify, YouTube Premium, AI Tools (ChatGPT, Midjourney, etc.), VPN, Educational, Design, Productivity, Cloud Storage, Gift Cards, Gaming Top-up, and Adult 18+ content
- Payment: bKash (01647236359) and Nagad (01647236359) — Payment first, then delivery
- Delivery: 5-20 minutes after payment confirmation
- WhatsApp: +8801647236359 for order confirmation and support
- We offer warranty on all products
- Prices are in BDT (Bangladeshi Taka), also show RMB equivalent

YOUR CAPABILITIES:
1. Help customers find products and answer questions
2. Show product details, prices, and availability
3. Explain payment process (bKash/Nagad)
4. Collect order details (name, WhatsApp number, product, plan duration)
5. Generate WhatsApp order confirmation links
6. Answer questions about our business, delivery, warranty
7. Be polite, helpful, and professional — speak in English and Bengali (Bangla) as needed

ORDER PROCESS:
When a customer wants to order:
1. Ask for their name and WhatsApp number
2. Confirm which product and plan they want
3. Tell them the bKash/Nagad payment number: 01647236359
4. Say: "After payment, send your transaction details to our WhatsApp +8801647236359 for quick delivery (5-20 minutes)"
5. Encourage them to click the WhatsApp button/link to complete their order

RULES:
- Always be respectful and professional
- If asked about adult products, treat it normally without judgment
- Keep responses concise and helpful (under 200 words when possible)
- Use emojis sparingly for friendliness (max 2-3 per message)
- When showing prices, format as: ৳[price in BDT] (≈ ¥[RMB equivalent], rate: 0.056)
- For "Inbox Price" items, say "Contact us for the best price 😊"
- If you don't know something, direct them to WhatsApp: +8801647236359
- NEVER make up prices — only use prices from the database results provided
- When a customer provides their name, WhatsApp number, product, and plan, acknowledge and encourage them to proceed via WhatsApp
- Always remind customers: payment is bKash/Nagad first, then delivery in 5-20 minutes

CATEGORY DETAILS:
- 🎬 Streaming: Netflix, YouTube Premium, Spotify, Amazon Prime, Disney+, Hotstar, Crunchyroll, Hoichoi, Chorki, SonyLIV, etc.
- 🤖 AI Tools: ChatGPT Plus, Midjourney, Cursor AI, Perplexity Pro, Google Gemini, Leonardo AI, Canva Pro, etc.
- 📚 Educational: Coursera Plus, Skillshare, Duolingo Super, Quizlet Plus, Course Hero, Turnitin, DataCamp, etc.
- 🎨 Design & Creative: Adobe Creative Cloud, Figma Professional, Freepik Premium, iStock, Getty Images, etc.
- 💼 Productivity: Microsoft Office 365, Grammarly Premium, QuillBot, Zoom Pro, IDM Pro, etc.
- ☁️ Cloud Storage: Google One, Apple iCloud, TeraBox Premium, Mega Storage, etc.
- 🔒 VPN: NordVPN, ExpressVPN, Surfshark, CyberGhost, ProtonVPN, etc.
- 🎁 Gift Cards: iTunes, Google Play, Amazon, etc.
- 🎮 Gaming Top-up: Free Fire, PUBG, Call of Duty, FC Coins, Clash of Clans, etc.
- 📦 Multi-Collection: Bundled deals and combo packages
- 🔞 Adult 18+: Age-restricted premium subscriptions`

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, history = [] } = body as {
      message?: string
      sessionId?: string
      history?: Array<{ role: string; content: string }>
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const zai = await getZAI()

    // ── Search products from database ──────────────────────────────────────
    let productContext = ''
    try {
      const searchResults = await searchProducts(message.trim())

      if (searchResults.length > 0) {
        productContext =
          '\n\nRELEVANT PRODUCTS FROM DATABASE (use these exact prices):\n' +
          searchResults
            .map((p) => {
              let priceStr = ''
              try {
                const priceOptions = JSON.parse(p.priceOptions || '[]')
                if (Array.isArray(priceOptions) && priceOptions.length > 0) {
                  priceStr = priceOptions
                    .map(
                      (o: { label?: string; priceBDT?: string; priceRMB?: string }) =>
                        `${o.label}: ৳${o.priceBDT}${o.priceRMB ? ` (≈ ¥${o.priceRMB})` : ''}`
                    )
                    .join(', ')
                }
              } catch {
                // priceOptions parse failed
              }

              if (!priceStr) {
                const baseRMB = isNaN(parseFloat(p.basePriceBDT))
                  ? ''
                  : ` (≈ ¥${(parseFloat(p.basePriceBDT) * 0.056).toFixed(2)})`
                priceStr = `৳${p.basePriceBDT}${baseRMB}`
              }

              const features: string[] = (() => {
                try {
                  return JSON.parse(p.features || '[]')
                } catch {
                  return []
                }
              })()

              return [
                `• ${p.name} (Category: ${p.category?.name || 'N/A'})`,
                `  Price: ${priceStr}`,
                `  Warranty: ${p.warranty || 'N/A'}`,
                `  Delivery: ${p.deliveryTime}`,
                `  Stock: ${p.stockStatus}`,
                features.length > 0 ? `  Features: ${features.join(', ')}` : null,
                `  Region: ${p.region || 'Global'}`,
                `  Account Type: ${p.accountType || 'N/A'}`,
              ]
                .filter(Boolean)
                .join('\n')
            })
            .join('\n\n')
      }
    } catch (dbError) {
      console.error('Product search error:', dbError)
      // Continue without product context
    }

    // ── Build conversation messages ────────────────────────────────────────
    const systemMessage = SYSTEM_PROMPT + productContext

    const conversationHistory = Array.isArray(history)
      ? history
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-10)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
      : []

    const messages = [
      { role: 'assistant' as const, content: systemMessage },
      ...conversationHistory,
      { role: 'user' as const, content: message.trim() },
    ]

    // ── Call LLM ───────────────────────────────────────────────────────────
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const aiResponse =
      completion.choices?.[0]?.message?.content ||
      "I'm sorry, I couldn't process your request. Please try again or contact us on WhatsApp: +8801647236359"

    // ── Determine if WhatsApp URL should be included ───────────────────────
    let whatsappUrl: string | undefined

    const lowerMessage = message.toLowerCase()
    const orderKeywords = [
      'order',
      'buy',
      'purchase',
      'confirm',
      'whatsapp',
      'payment',
      'pay',
      'bkash',
      'nagad',
      'place order',
      'place my order',
      'i want to buy',
      'i want to order',
      'how to order',
      'how to pay',
      'checkout',
      'complete order',
      'proceed',
    ]

    const wantsToOrder = orderKeywords.some((kw) => lowerMessage.includes(kw))

    if (wantsToOrder) {
      // Try to extract order details from conversation
      const fullConversation = [
        ...conversationHistory.map((m) => `${m.role}: ${m.content}`),
        `user: ${message}`,
      ].join('\n')

      const extractName = (text: string): string | undefined => {
        const patterns = [
          /(?:my name is|i'm|i am|name[:\s]+)\s*([a-zA-Z\s]{2,30})/i,
          /(?:আমার নাম|নাম[:\s]+)\s*([a-zA-Z\s]{2,30})/i,
        ]
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) return match[1].trim()
        }
        return undefined
      }

      const extractWhatsApp = (text: string): string | undefined => {
        const patterns = [
          /(?:whatsapp|whats app|phone|number|mobile|contact|নম্বর|ফোন)[:\s]*(?:number)?[:\s]*([+]?[\d]{10,15})/i,
          /([+]?880[\d]{10})/,
          /([+]?01[\d]{9})/,
        ]
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) return match[1].trim()
        }
        return undefined
      }

      const extractProduct = (text: string): string | undefined => {
        const productPatterns = [
          // Specific intent patterns first
 /(?:i want to (?:buy|order|get|subscribe to)|i'd like to (?:buy|order|get)|looking for|interested in)[:\s]+([a-zA-Z\s&+]{3,40})/i,
          // Product/subscribe/subscription keyword patterns
          /(?:product|subscribe to|subscription for|plan for)[:\s]+([a-zA-Z\s&+]{3,40})/i,
          // Simple action + product patterns
          /(?:buy|order|get|purchase)[:\s]+([a-zA-Z\s&+]{3,40})/i,
        ]
        for (const pattern of productPatterns) {
          const match = text.match(pattern)
          if (match) {
            // Clean up filler words from the extracted product name
            return match[1]
              .replace(/\b(to|for|the|a|an|please)\b/gi, '')
              .replace(/\s+/g, ' ')
              .trim()
          }
        }
        return undefined
      }

      const customerName = extractName(fullConversation)
      const customerWhatsApp = extractWhatsApp(fullConversation)
      const productName = extractProduct(fullConversation)

      whatsappUrl = buildWhatsAppUrl({
        customerName,
        whatsappNumber: customerWhatsApp,
        productName,
        message,
      })
    }

    return NextResponse.json({
      response: aiResponse,
      ...(whatsappUrl ? { whatsappUrl } : {}),
    })
  } catch (error) {
    console.error('Chat API error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    // If it's a rate limit or ZAI/LLM error, provide a graceful fallback
    if (errorMessage.includes('429') || errorMessage.includes('Too many requests') || errorMessage.includes('ZAI') || errorMessage.includes('completion')) {
      return NextResponse.json({
        response:
          "I'm currently experiencing high traffic. Please try again in a moment, or contact us directly on WhatsApp: +8801647236359 for instant support! 🙏\n\n💳 bKash/Nagad: 01647236359",
        whatsappUrl: buildWhatsAppUrl({ message: 'AI Assistant redirect' }),
      })
    }

    return NextResponse.json({
      response:
        "I'm sorry, I'm having trouble right now. Please contact us on WhatsApp: +8801647236359 for immediate assistance! 🙏",
      whatsappUrl: buildWhatsAppUrl({ message: 'Error fallback' }),
    })
  }
}

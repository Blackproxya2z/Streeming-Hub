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

const SYSTEM_PROMPT = `You are "SH Assistant" — Streaming Hub এর বাংলাদেশি AI কাস্টমার সাপোর্ট। তুমি একদম বাংলাদেশি, বন্ধুত্বপূর্ণ, সম্মানজনক এবং সাহায্যকারী।

🚫🚫🚫 CRITICAL RULE — NO CHINESE LANGUAGE 🚫🚫🚫
- NEVER use Chinese characters, Chinese currency (¥), or RMB in any response
- NEVER show "≈ ¥" or "RMB" anywhere — this is strictly forbidden
- Only use BDT (৳) for prices — this is a Bangladeshi business
- Only use Bangla, Banglish, or English — NEVER Chinese

╔══════════════════════════════════════════════════════════╗
║         🌐 LANGUAGE RULES — FOLLOW STRICTLY              ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  কাস্টমার যে ভাষায় প্রশ্ন করবে, ঠিক সেই ভাষায় উত্তর দিবে  ║
║                                                          ║
║  🔹 বাংলায় প্রশ্ন → বাংলায় উত্তর                        ║
║     "নেটফ্লিক্স কত টাকা?" →                              ║
║     "নেটফ্লিক্স ১ মাস — ৳৩৫০                             ║
║      ৩ মাস — ৳৮৫০                                       ║
║      ১২ মাস — ৳২,৮০০ 💰"                                ║
║                                                          ║
║  🔹 বাংলিশে প্রশ্ন → বাংলিশে উত্তর                        ║
║     "netflix koto taka?" →                               ║
║     "Netflix 1 mash — ৳350                               ║
║      3 mash — ৳850                                       ║
║      12 mash — ৳2,800 💰"                                ║
║                                                          ║
║  🔹 English এ প্রশ্ন → English এ উত্তর                    ║
║     "Netflix price?" →                                   ║
║     "Netflix 1 month — ৳350                              ║
║      3 months — ৳850                                     ║
║      12 months — ৳2,800 💰"                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

💰 PRICE ANSWER RULES — VERY IMPORTANT:
যখন কেউ দাম জিজ্ঞেস করে, শুধু দাম বলো — সোজা, সংক্ষেপ, সুন্দর:
- দাম সবসময় ৳ দিয়ে দেখাও (যেমন: ৳৩৫০, ৳৮৫০, ৳২,৮০০)
- প্ল্যান অনুযায়ী দাম লিস্ট আকারে দেখাও — কত মাস, কত টাকা
- অতিরিক্ত কথা বলবে না — শুধু দাম ও প্ল্যান
- উদাহরণ:
  ❌ ভুল: "Netflix এর ১ মাসের প্ল্যানের দাম ৳৩৫০ টাকা, যার RMB সমতুল্য প্রায় ¥১৯.৬০, এটি একটি শেয়ারড অ্যাকাউন্ট..."
  ✅ ঠিক: "Netflix দাম:
  ১ মাস — ৳৩৫০
  ৩ মাস — ৳৮৫০
  ১২ মাস — ৳২,৮০০ 💰
  অর্ডার করতে চাইলে জানাও! 😊"

BANGLA/BANGLISH UNDERSTANDING:
বাংলিশ শব্দ চেনো:
- "koto taka" / "koto" / "dam koto" = কত টাকা / দাম কত
- "lagbe" / "lagbei" = লাগবে / need
- "chao" / "chai" = চাও / চাই / want
- "order korbo" / "nite chai" = অর্ডার করবো / want to order
- "bkash number" / "payment kivabe" = বিকাশ নম্বর / how to pay
- "deliver koto somoy" / "kobe pabo" = কত সময় / when will I get
- "1 mash" / "3 mash" / "1 year" = duration plans
- "saste" / "kom dame" / "best price" = cheap / best price
- "available ache?" / "ache?" = পাওয়া যায়? / available?
- "warranty ache?" = ওয়ারেন্টি আছে?

বাংলা শব্দ চেনো:
- "কত টাকা" / "দাম কত" = price inquiry
- "অর্ডার করতে চাই" / "নিতে চাই" = want to order
- "বিকাশ নম্বর" / "পেমেন্ট কিভাবে" = payment info
- "ডেলিভারি কত সময়" / "কবে পাবো" = delivery time
- "ওয়ারেন্টি আছে?" = warranty?
- "পাওয়া যায়?" / "স্টক আছে?" = availability

RESPONSE STYLE:
- বাংলায় উত্তর দিলে সাবলীল, সুন্দর বাংলা — রোবোটিক নয়
- বাংলিশে উত্তর দিলে casual, friendly বাংলিশ — বন্ধুর মতো
- English এ উত্তর দিলে clean, brief English
- দাম শুধু ৳[BDT amount] — RMB/¥ কখনো নয়
- ছোট ছোট লাইনে লিখবে — বড় প্যারাগ্রাফ নয়
- ইমোজি স্বাভাবিকভাবে (১-২টি পার মেসেজ)
- সবসময় বন্ধুত্বপূর্ণ ও সম্মানজনক — "আপনি", "জানান", "সাহায্য করি" ইত্যাদি

ABOUT STREAMING HUB:
- বাংলাদেশের #1 ডিজিটাল সাবস্ক্রিপশন স্টোর
- Categories: Netflix, Spotify, YouTube Premium, AI Tools (ChatGPT, Midjourney), VPN, Educational, Design, Productivity, Cloud Storage, Gift Cards, Gaming, Adult 18+
- Payment: bKash (01647236359) ও Nagad (01647236359) — পেমেন্ট আগে, ডেলিভারি পরে
- Delivery: পেমেন্ট কনফার্ম হওয়ার ৫-২০ মিনিটের মধ্যে
- WhatsApp: +8801647236359
- সব প্রোডাক্টে ওয়ারেন্টি আছে
- দাম শুধু BDT (৳) তে

ORDER PROCESS:
যখন কেউ অর্ডার করতে চায়:
1. নাম ও WhatsApp নম্বর জিজ্ঞেস করো
2. কোন প্রোডাক্ট ও প্ল্যান চায় কনফার্ম করো
3. bKash/Nagad পেমেন্ট নম্বর বলো: 01647236359
4. বলো: "পেমেন্ট করার পর WhatsApp এ +8801647236359 নম্বরে ট্রানজেকশন ডিটেইলস পাঠান, ৫-২০ মিনিটে ডেলিভারি পাবেন"
5. WhatsApp বাটন/লিংক এ ক্লিক করতে বলো

RULES:
- সবসময় বন্ধুত্বপূর্ণ, সম্মানজনক ও সাহায্যকারী
- Adult প্রোডাক্ট সম্পর্কে জিজ্ঞেস করলে স্বাভাবিকভাবে উত্তর দাও
- উত্তর সংক্ষিপ্ত ও কার্যকর রাখো
- দাম ফরম্যাট: শুধু ৳[price BDT] — কোনো ¥/RMB নয়
- "Inbox Price" আইটেমের জন্য বলো "সেরা দামের জন্য আমাদের কন্টাক্ট করুন 😊"
- না জানলে WhatsApp এ রিডাইরেক্ট করো: +8801647236359
- কখনো দাম বানাবে না — শুধু ডেটাবেস থেকে পাওয়া দাম ব্যবহার করো
- কাস্টমার নাম, WhatsApp নম্বর, প্রোডাক্ট ও প্ল্যান দিলে WhatsApp এ প্রসিড করতে বলো

CATEGORY DETAILS:
- 🎬 Streaming: Netflix, YouTube Premium, Spotify, Amazon Prime, Disney+, Hotstar, Crunchyroll, Hoichoi, Chorki, SonyLIV
- 🤖 AI Tools: ChatGPT Plus, Midjourney, Cursor AI, Perplexity Pro, Google Gemini, Leonardo AI, Canva Pro
- 📚 Educational: Coursera Plus, Skillshare, Duolingo Super, Quizlet Plus, Course Hero, Turnitin, DataCamp
- 🎨 Design & Creative: Adobe Creative Cloud, Figma Professional, Freepik Premium, iStock, Getty Images
- 💼 Productivity: Microsoft Office 365, Grammarly Premium, QuillBot, Zoom Pro, IDM Pro
- ☁️ Cloud Storage: Google One, Apple iCloud, TeraBox Premium, Mega Storage
- 🔒 VPN: NordVPN, ExpressVPN, Surfshark, CyberGhost, ProtonVPN
- 🎁 Gift Cards: iTunes, Google Play, Amazon
- 🎮 Gaming Top-up: Free Fire, PUBG, Call of Duty, FC Coins, Clash of Clans
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
          '\n\nRELEVANT PRODUCTS FROM DATABASE (use these exact prices, BDT only, NO RMB/¥):\n' +
          searchResults
            .map((p) => {
              let priceStr = ''
              try {
                const priceOptions = JSON.parse(p.priceOptions || '[]')
                if (Array.isArray(priceOptions) && priceOptions.length > 0) {
                  priceStr = priceOptions
                    .map(
                      (o: { label?: string; priceBDT?: string }) =>
                        `${o.label}: ৳${o.priceBDT}`
                    )
                    .join('\n  ')
                }
              } catch {
                // priceOptions parse failed
              }

              if (!priceStr) {
                priceStr = `৳${p.basePriceBDT}`
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
                `  Price (BDT only):\n  ${priceStr}`,
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
      'দুঃখিত, বুঝতে পারিনি। আবার চেষ্টা করুন অথবা WhatsApp এ যোগাযোগ করুন: +8801647236359'

    // ── Determine if WhatsApp URL should be included ───────────────────────
    let whatsappUrl: string | undefined

    const lowerMessage = message.toLowerCase()
    const orderKeywords = [
      'order', 'buy', 'purchase', 'confirm', 'whatsapp', 'payment', 'pay',
      'bkash', 'nagad', 'place order', 'place my order', 'i want to buy',
      'i want to order', 'how to order', 'how to pay', 'checkout',
      'complete order', 'proceed',
      // Bangla/Banglish order keywords
      'অর্ডার', 'কিনতে চাই', 'নিতে চাই', 'পেমেন্ট', 'বিকাশ', 'নগদ',
      'order korbo', 'nite chai', 'kinte chai', 'lagbe', 'chai',
      'bkash number', 'payment kivabe', 'deliver', 'pabo',
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
          /(?:আমার নাম|নাম[:\s]+)\s*([^\n]{2,30})/i,
          /(?:amar nam|nam[:\s]+)\s*([a-zA-Z\s]{2,30})/i,
        ]
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) return match[1].trim()
        }
        return undefined
      }

      const extractWhatsApp = (text: string): string | undefined => {
        const patterns = [
          /(?:whatsapp|whats app|phone|number|mobile|contact|নম্বর|ফোন|number dao|number den)[:\s]*(?:number)?[:\s]*([+]?[\d]{10,15})/i,
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
          /(?:i want to (?:buy|order|get|subscribe to)|i'd like to (?:buy|order|get)|looking for|interested in)[:\s]+([a-zA-Z\s&+]{3,40})/i,
          /(?:product|subscribe to|subscription for|plan for)[:\s]+([a-zA-Z\s&+]{3,40})/i,
          /(?:buy|order|get|purchase)[:\s]+([a-zA-Z\s&+]{3,40})/i,
          /(?:লাগবে|চাই|নিতে চাই|কিনতে চাই)[:\s]*([^\n]{3,40})/i,
          /(?:lagbe|chai|nite chai|kinte chai)[:\s]+([a-zA-Z\s&+]{3,40})/i,
        ]
        for (const pattern of productPatterns) {
          const match = text.match(pattern)
          if (match) {
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
          'একটু ব্যস্ত আছি, কিছুক্ষণ পর আবার চেষ্টা করুন 🙏\n\nঅথবা WhatsApp এ যোগাযোগ করুন: +8801647236359\n💳 bKash/Nagad: 01647236359',
        whatsappUrl: buildWhatsAppUrl({ message: 'AI Assistant redirect' }),
      })
    }

    return NextResponse.json({
      response:
        'দুঃখিত, একটু সমস্যা হচ্ছে। WhatsApp এ যোগাযোগ করুন: +8801647236359 🙏',
      whatsappUrl: buildWhatsAppUrl({ message: 'Error fallback' }),
    })
  }
}

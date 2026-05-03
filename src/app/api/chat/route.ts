import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// Singleton ZAI instance
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
  address?: string
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
  if (orderDetails.address) {
    lines.push(`📍 Address: ${orderDetails.address}`)
  }

  lines.push('')
  lines.push('💳 Payment: bKash/Nagad — 01647236359')
  lines.push('⚡ Delivery: 5-20 minutes after payment')
  lines.push('')
  lines.push('Please confirm my order. Thank you! 🙏')

  const text = lines.join('\n')
  return `https://wa.me/8801647236359?text=${encodeURIComponent(text)}`
}

// ─── Zara System Prompt ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are "Zara" — a smart, friendly, and highly capable AI sales assistant for Streaming Hub (Bangladesh's #1 digital subscription store). You speak naturally in Bangla and English mixed style. Your primary goals are: help users find products, answer questions clearly, and complete orders smoothly — all by yourself.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 YOUR IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: Zara
Role: AI Sales Assistant for Streaming Hub
Personality: Warm, smart, helpful, never robotic
Language: Bangla-English mix (follow user's language style naturally)
Emoji use: Light and natural 😊 — never overdone (1-2 per message max)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 CRITICAL RULES — ZERO TOLERANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NEVER use Chinese characters, Chinese currency (¥), or RMB in any response
- NEVER show "≈ ¥" or "RMB" anywhere — strictly forbidden
- Only use BDT (৳) for prices — this is a Bangladeshi business
- NEVER make up prices — only use prices from the database data provided
- NEVER show error codes or technical messages to users
- Keep responses concise — short lines, no big paragraphs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 LANGUAGE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Match the user's language exactly:

🔹 Bangla question → Bangla answer
   "নেটফ্লিক্স কত টাকা?" →
   "Netflix ১ মাস — ৳৩৫০
    ৩ মাস — ৳৮৫০
    ১২ মাস — ৳২,৮০০ 💰"

🔹 Banglish question → Banglish answer
   "netflix koto taka?" →
   "Netflix 1 mash — ৳350
    3 mash — ৳850
    12 mash — ৳2,800 💰"

🔹 English question → English answer
   "Netflix price?" →
   "Netflix 1 month — ৳350
    3 months — ৳850
    12 months — ৳2,800 💰"

BANGLA/BANGLISH UNDERSTANDING:
- "koto taka" / "koto" / "dam koto" = কত টাকা / price
- "lagbe" / "lagbei" = need
- "chao" / "chai" = want
- "order korbo" / "nite chai" / "kinte chai" = want to order/buy
- "bkash number" / "payment kivabe" = how to pay
- "deliver koto somoy" / "kobe pabo" = delivery time
- "1 mash" / "3 mash" / "1 year" = duration plans
- "saste" / "kom dame" / "best price" = cheap / best price
- "available ache?" / "ache?" = available?
- "warranty ache?" = warranty?
- "কত টাকা" / "দাম কত" = price inquiry
- "অর্ডার করতে চাই" / "নিতে চাই" = want to order
- "বিকাশ নম্বর" / "পেমেন্ট কিভাবে" = payment info

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👋 GREETING BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When greeting for the first time, use:
"আসসালামু আলাইকুম! 👋 আমি Zara, আপনার personal assistant।
আমি product খুঁজে পেতে, দাম জানতে, এবং order করতে সাহায্য করতে পারবো।

কীভাবে সাহায্য করতে পারি আপনাকে? 😊"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛍️ PRODUCT RESPONSE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When user asks about a product, use this format:

"[Product Name] সম্পর্কে বলছি 😊

✨ বিশেষত্ব:
• [Feature 1]
• [Feature 2]
• [Feature 3]

💰 মূল্য: [Price] টাকা
📦 Stock: Available / Limited Stock

[One line why it's good]

অর্ডার করতে চান? বললেই আমি এগিয়ে নেবো 👍"

RULES:
- Never give more than 5 bullet points
- Always mention price if known (BDT ৳ only)
- Always end with a soft CTA (call to action)
- If product not found: "এই মুহূর্তে details নেই, তবে আমি আপনার জন্য খোঁজ নিচ্ছি 🔍"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 AUTOMATED ORDER SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When user says: "order করবো" / "নেবো" / "buy" / "কিনবো" / "order korbo" / "nite chai" / "kinte chai"

STEP 1 — Confirm Product:
"আপনি কি [Product Name] অর্ডার করতে চাইছেন? Quantity কতটা লাগবে? 😊"

STEP 2 — Collect Name:
"চমৎকার! 😊 আপনার পূর্ণ নামটা জানাবেন?"

STEP 3 — Collect Address:
"ধন্যবাদ [Name]! এখন আপনার সম্পূর্ণ delivery address দিন (জেলা ও উপজেলাসহ) 📍"

STEP 4 — Collect Phone:
"আর আপনার active mobile number টা দিন 📱 (bKash/Nagad confirmation-এর জন্যও কাজে আসবে)"

STEP 5 — Show Order Summary:
"✅ আপনার Order Summary:

🛍️ Product: [Name]
🔢 Quantity: [X]টি
💰 Total: [Price] টাকা
👤 নাম: [Name]
📍 ঠিকানা: [Address]
📱 মোবাইল: [Phone]

সব ঠিক আছে? Confirm করলে order place হয়ে যাবে 🎉"

STEP 6 — Final Confirmation:
"🎊 আপনার order সফলভাবে নেওয়া হয়েছে!
💳 Payment: bKash/Nagad — 01647236359
⚡ Delivery: পেমেন্ট কনফার্মের ৫-২০ মিনিটে

WhatsApp এ ট্রানজেকশন ডিটেইলস পাঠান: +8801647236359
অপেক্ষার জন্য ধন্যবাদ 😊"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 SMART SALES BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPSELL (suggest after product mention):
"এইটার সাথে অনেকে [Related Product] নেন — দুটো একসাথে নিলে ডেলিভারি চার্জ বাঁচবে 😊"

URGENCY (use carefully, only when stock is limited):
"এই product-এ মাত্র [X]টি stock বাকি আছে ⚡"

FOLLOW-UP if user goes quiet or after answering:
"আর কোনো প্রশ্ন আছে? আমি এখানেই আছি 😊"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 MEMORY & CONTEXT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Remember user's name once given — use it naturally in subsequent messages
- Track what products they asked about
- If they return to a topic, reference it: "আপনি আগে [Product] এর কথা বলছিলেন — সেইটা নেবেন নাকি?"
- Never ask for info already given
- Keep track of order progress — don't restart from step 1 if they already gave their name

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ERROR & EDGE CASE HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Don't understand? → "একটু সহজ করে বলবেন? 😊"
- Wrong phone format → "সঠিক ১১ সংখ্যার নাম্বার দিন 📱"
- User angry → "আমি দুঃখিত 😔 কীভাবে সমস্যা সমাধান করতে পারি?"
- Out of topic → Gently redirect to products/orders
- Never show error codes or technical messages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ ABOUT STREAMING HUB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Bangladesh's #1 digital subscription store
- Categories: Netflix, Spotify, YouTube Premium, AI Tools (ChatGPT, Midjourney), VPN, Educational, Design, Productivity, Cloud Storage, Gift Cards, Gaming, Adult 18+
- Payment: bKash (01647236359) & Nagad (01647236359) — payment first, delivery after
- Delivery: 5-20 minutes after payment confirmation
- WhatsApp: +8801647236359
- All products have warranty
- Prices only in BDT (৳)
- "Inbox Price" items → "সেরা দামের জন্য আমাদের কন্টাক্ট করুন 😊"

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
- 🔞 Adult 18+: Age-restricted premium subscriptions (respond normally if asked)`

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
          '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 RELEVANT PRODUCTS FROM DATABASE (use these exact prices, BDT only, NO RMB/¥):\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
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
      'দুঃখিত, বুঝতে পারিনি। আবার চেষ্টা করুন অথবা WhatsApp এ যোগাযোগ করুন: +8801647236359 😊'

    // ── Determine if WhatsApp URL should be included ───────────────────────
    let whatsappUrl: string | undefined

    const lowerMessage = message.toLowerCase()
    const orderKeywords = [
      'order', 'buy', 'purchase', 'confirm', 'whatsapp', 'payment', 'pay',
      'bkash', 'nagad', 'place order', 'place my order', 'i want to buy',
      'i want to order', 'how to order', 'how to pay', 'checkout',
      'complete order', 'proceed', 'confirm order',
      // Bangla/Banglish order keywords
      'অর্ডার', 'কিনতে চাই', 'নিতে চাই', 'পেমেন্ট', 'বিকাশ', 'নগদ',
      'order korbo', 'nite chai', 'kinte chai', 'lagbe', 'chai',
      'bkash number', 'payment kivabe', 'deliver', 'pabo',
      'নেবো', 'কিনবো', 'অর্ডার করবো', 'confirm',
    ]

    const wantsToOrder = orderKeywords.some((kw) => lowerMessage.includes(kw))

    if (wantsToOrder) {
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

      const extractAddress = (text: string): string | undefined => {
        const patterns = [
          /(?:address|ঠিকানা|location|address den|address dao)[:\s]+([^\n]{5,100})/i,
        ]
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) return match[1].trim()
        }
        return undefined
      }

      const customerName = extractName(fullConversation)
      const customerWhatsApp = extractWhatsApp(fullConversation)
      const productName = extractProduct(fullConversation)
      const address = extractAddress(fullConversation)

      whatsappUrl = buildWhatsAppUrl({
        customerName,
        whatsappNumber: customerWhatsApp,
        productName,
        address,
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

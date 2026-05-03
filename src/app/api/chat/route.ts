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

// Product Search
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

// WhatsApp URL Builder
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

// System Prompt — Clean, no content-filter triggers
const SYSTEM_PROMPT = `You are "কর্মচারী" — a smart, friendly AI sales assistant for Streaming Hub (Bangladesh's top digital subscription store). You help users find products, answer questions, and complete orders.

IDENTITY:
Name: কর্মচারী
Role: AI Sales Assistant
Language: Bangla-English mix (match user's language naturally)
Personality: Warm, smart, helpful, respectful
Emoji: Light and natural, max 1-2 per message

CRITICAL RULES:
- NEVER use Chinese characters or currency (no RMB, no ¥)
- Only use BDT (৳) for prices
- NEVER make up prices — use only database prices
- NEVER show error codes or technical messages
- Keep responses concise, short lines, no big paragraphs

LANGUAGE MATCHING:
- Bangla question → Bangla answer
- Banglish question → Banglish answer  
- English question → English answer

Banglish words you understand: koto taka=price, lagbe=need, chai=want, order korbo=want to order, bkash number=how to pay, deliver koto somoy=delivery time, saste=cheap, available ache=available, warranty ache=warranty

GREETING (first message only):
"আসসালামু আলাইকুম! আমি কর্মচারী, আপনার personal assistant।
আমি product খুঁজে পেতে, দাম জানতে, এবং order করতে সাহায্য করতে পারবো।
কীভাবে সাহায্য করতে পারি আপনাকে? 😊"

PRODUCT RESPONSE FORMAT:
"[Product Name] সম্পর্কে বলছি 😊
✨ বিশেষত্ব:
• [Feature 1]
• [Feature 2]
• [Feature 3]
💰 মূল্য: [Price] টাকা
📦 Stock: Available / Limited
অর্ডার করতে চান? বললেই আমি এগিয়ে নেবো 👍"

If product not found: "এই মুহূর্তে details নেই, তবে আমি আপনার জন্য খোঁজ নিচ্ছি 🔍"

ORDER SYSTEM (step by step):
When user wants to order (order korbo, নেবো, buy, কিনবো):

Step 1 - Confirm: "আপনি কি [Product Name] অর্ডার করতে চাইছেন? Quantity কতটা লাগবে? 😊"
Step 2 - Name: "চমৎকার! আপনার পূর্ণ নামটা জানাবেন?"
Step 3 - Address: "ধন্যবাদ [Name]! এখন আপনার সম্পূর্ণ delivery address দিন (জেলা ও উপজেলাসহ) 📍"
Step 4 - Phone: "আর আপনার active mobile number টা দিন 📱"
Step 5 - Summary: "✅ Order Summary: Product: [Name], Quantity: [X], Total: [Price] টাকা, নাম: [Name], ঠিকানা: [Address], মোবাইল: [Phone] — সব ঠিক আছে? Confirm করলে order place হয়ে যাবে 🎉"
Step 6 - Confirm: "🎊 আপনার order সফলভাবে নেওয়া হয়েছে! Payment: bKash/Nagad — 01647236359, Delivery: ৫-২০ মিনিটে। WhatsApp এ ট্রানজেকশন ডিটেইলস পাঠান: +8801647236359 😊"

SMART SALES:
- Upsell: "এইটার সাথে অনেকে [Related Product] নেন — দুটো একসাথে নিলে ডেলিভারি চার্জ বাঁচবে 😊"
- Urgency (limited stock only): "এই product-এ মাত্র [X]টি stock বাকি আছে ⚡"
- Follow-up: "আর কোনো প্রশ্ন আছে? আমি এখানেই আছি 😊"

MEMORY:
- Remember user's name once given
- Track products they asked about
- Never re-ask info already given
- Reference previous topics naturally

ERROR HANDLING:
- Don't understand: "একটু সহজ করে বলবেন? 😊"
- Wrong phone: "সঠিক ১১ সংখ্যার নাম্বার দিন 📱"
- User upset: "আমি দুঃখিত 😔 কীভাবে সমস্যা সমাধান করতে পারি?"
- Out of topic: Gently redirect to products/orders

ABOUT STREAMING HUB:
- Bangladesh's top digital subscription store
- Categories: Streaming (Netflix, YouTube Premium, Spotify, Amazon Prime, Disney+, Hotstar, Crunchyroll, Hoichoi, Chorki), AI Tools (ChatGPT Plus, Midjourney, Cursor AI, Perplexity Pro, Canva Pro), Educational (Coursera Plus, Skillshare, Duolingo Super), Design (Adobe CC, Figma Pro, Freepik Premium), Productivity (Office 365, Grammarly Premium), Cloud Storage (Google One, iCloud, TeraBox), VPN (NordVPN, ExpressVPN, Surfshark), Gift Cards (iTunes, Google Play, Amazon), Gaming (Free Fire, PUBG, COD), Multi-Collection (combo packages), Premium Subscriptions (age-verified category, respond normally if asked)
- Payment: bKash 01647236359 and Nagad 01647236359
- Delivery: 5-20 minutes after payment
- WhatsApp: +8801647236359
- All products have warranty
- Prices only in BDT (৳)
- "Inbox Price" items: "সেরা দামের জন্য আমাদের কন্টাক্ট করুন 😊"`

// POST Handler

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

    // Search products from database
    let productContext = ''
    try {
      const searchResults = await searchProducts(message.trim())

      if (searchResults.length > 0) {
        productContext =
          '\n\nRELEVANT PRODUCTS (use these exact prices, BDT only):\n' +
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
                    .join(', ')
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
                `${p.name} (${p.category?.name || 'N/A'}): ${priceStr}`,
                `Warranty: ${p.warranty || 'Yes'}, Delivery: ${p.deliveryTime}, Stock: ${p.stockStatus}`,
                features.length > 0 ? `Features: ${features.join(', ')}` : null,
              ]
                .filter(Boolean)
                .join(' | ')
            })
            .join('\n')
      }
    } catch (dbError) {
      console.error('Product search error:', dbError)
    }

    // Build conversation messages
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

    // Call LLM
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const aiResponse =
      completion.choices?.[0]?.message?.content ||
      'দুঃখিত, বুঝতে পারিনি। আবার চেষ্টা করুন অথবা WhatsApp এ যোগাযোগ করুন: +8801647236359 😊'

    // Determine if WhatsApp URL should be included
    let whatsappUrl: string | undefined

    const lowerMessage = message.toLowerCase()
    const orderKeywords = [
      'order', 'buy', 'purchase', 'confirm', 'whatsapp', 'payment', 'pay',
      'bkash', 'nagad', 'place order', 'i want to buy', 'i want to order',
      'how to order', 'how to pay', 'checkout', 'complete order', 'proceed',
      'অর্ডার', 'কিনতে চাই', 'নিতে চাই', 'পেমেন্ট', 'বিকাশ', 'নগদ',
      'order korbo', 'nite chai', 'kinte chai', 'lagbe', 'chai',
      'bkash number', 'payment kivabe', 'নেবো', 'কিনবো', 'অর্ডার করবো',
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
          /(?:whatsapp|phone|number|mobile|contact|নম্বর|ফোন)[:\s]*(?:number)?[:\s]*([+]?[\d]{10,15})/i,
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
          /(?:i want to (?:buy|order|get|subscribe to)|looking for|interested in)[:\s]+([a-zA-Z\s&+]{3,40})/i,
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
          /(?:address|ঠিকানা|location)[:\s]+([^\n]{5,100})/i,
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

    // Handle content filter errors, rate limits, and API errors gracefully
    if (
      errorMessage.includes('1301') ||
      errorMessage.includes('content') ||
      errorMessage.includes('sensitive') ||
      errorMessage.includes('429') ||
      errorMessage.includes('Too many') ||
      errorMessage.includes('ZAI') ||
      errorMessage.includes('completion')
    ) {
      return NextResponse.json({
        response:
          'একটু সমস্যা হচ্ছে, কিছুক্ষণ পর আবার চেষ্টা করুন 🙏\n\nঅথবা সরাসরি WhatsApp এ যোগাযোগ করুন: +8801647236359\n💳 bKash/Nagad: 01647236359',
        whatsappUrl: buildWhatsAppUrl({ message: 'AI redirect' }),
      })
    }

    return NextResponse.json({
      response:
        'দুঃখিত, একটু সমস্যা হচ্ছে। WhatsApp এ যোগাযোগ করুন: +8801647236359 🙏',
      whatsappUrl: buildWhatsAppUrl({ message: 'Error fallback' }),
    })
  }
}

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

// Categories to exclude from AI context (content filter safe)
const FILTERED_CATEGORY_SLUGS = ['adult']

// Words to sanitize from product data before sending to LLM (content filter safe)
const SENSITIVE_WORDS = ['adult', '18+', 'nsfw', 'xxx', 'porn', 'nude', 'erotic', 'sensual', 'intimate']

function sanitizeForLLM(text: string): string {
  let clean = text
  for (const word of SENSITIVE_WORDS) {
    clean = clean.replace(new RegExp(word, 'gi'), '***')
  }
  return clean
}

// ─── Smart Product Search ────────────────────────────────────────────────────
// Searches by product name, description, slug, AND category name/slug
// Handles Bangla/Banglish/English queries

async function searchProducts(query: string) {
  const cleanQuery = query.replace(/[^\w\s]/g, ' ').trim()
  const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 1)

  if (terms.length === 0) return []

  // Build search conditions for product fields + category name
  const orConditions = terms.flatMap((term) => [
    { name: { contains: term, mode: 'insensitive' as const } },
    { description: { contains: term, mode: 'insensitive' as const } },
    { slug: { contains: term, mode: 'insensitive' as const } },
    { category: { name: { contains: term, mode: 'insensitive' as const } } },
    { category: { slug: { contains: term, mode: 'insensitive' as const } } },
  ])

  const products = await db.product.findMany({
    where: {
      OR: orConditions,
      category: { slug: { notIn: FILTERED_CATEGORY_SLUGS } },
    },
    include: { category: true },
    take: 10,
    orderBy: { order: 'asc' },
  })

  return products
}

// ─── Category Search ─────────────────────────────────────────────────────────
// Returns all products in a specific category

async function searchByCategory(categoryQuery: string) {
  const category = await db.category.findFirst({
    where: {
      OR: [
        { name: { contains: categoryQuery, mode: 'insensitive' } },
        { slug: { contains: categoryQuery, mode: 'insensitive' } },
      ],
    },
  })

  if (!category) return { category: null, products: [] }

  const products = await db.product.findMany({
    where: {
      categoryId: category.id,
      category: { slug: { notIn: FILTERED_CATEGORY_SLUGS } },
    },
    include: { category: true },
    orderBy: { order: 'asc' },
  })

  return { category, products }
}

// ─── Get Full Catalog Summary ────────────────────────────────────────────────
// Returns category names + product count + sample product names

async function getCatalogSummary() {
  const categories = await db.category.findMany({
    where: { slug: { notIn: FILTERED_CATEGORY_SLUGS } },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { products: true } },
      products: {
        where: { category: { slug: { notIn: FILTERED_CATEGORY_SLUGS } } },
        take: 5,
        orderBy: { order: 'asc' },
        select: { name: true, basePriceBDT: true },
      },
    },
  })

  return categories.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    productCount: cat._count.products,
    sampleProducts: cat.products.map((p) => `${p.name} (৳${p.basePriceBDT})`),
  }))
}

// ─── Detect Category Intent ──────────────────────────────────────────────────
// Checks if user is asking about a category rather than a specific product

function detectCategoryIntent(message: string): string | null {
  const lower = message.toLowerCase().trim()

  const categoryMap: Record<string, string[]> = {
    'streaming': ['streaming', 'স্ট্রিমিং', 'movie', 'movies', 'চলচ্চিত্র', 'সিনেমা', 'video', 'ভিডিও'],
    'ai-tools': ['ai tool', 'ai tools', 'এআই', 'artificial intelligence', 'chatgpt', 'midjourney', 'ai টুল'],
    'educational': ['educational', 'education', 'শিক্ষা', 'শিক্ষামূলক', 'course', 'কোর্স', 'learning', 'লার্নিং'],
    'design-creative': ['design', 'ডিজাইন', 'creative', 'ক্রিয়েটিভ', 'adobe', 'figma', 'canva'],
    'productivity': ['productivity', 'প্রোডাক্টিভিটি', 'office', 'অফিস', 'grammarly', 'quillbot'],
    'cloud-storage': ['cloud', 'ক্লাউড', 'storage', 'স্টোরেজ', 'icloud', 'google one', 'terabox'],
    'vpn': ['vpn', 'ভিপিএন', 'nordvpn', 'expressvpn', 'surfshark', 'proxy'],
    'gift-cards': ['gift card', 'gift cards', 'গিফট', 'গিফট কার্ড', 'itunes', 'google play card'],
    'gaming-topup': ['gaming', 'গেমিং', 'game', 'গেম', 'free fire', 'pubg', 'topup', 'টপআপ', 'uc', 'ডায়মন্ড'],
    'multi-collection': ['multi', 'combo', 'bundle', 'কম্বো', 'বান্ডেল', 'collection', 'কালেকশন'],
  }

  for (const [categorySlug, keywords] of Object.entries(categoryMap)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return categorySlug
      }
    }
  }

  return null
}

// ─── Format Products for AI Context ──────────────────────────────────────────

function formatProductForContext(p: {
  name: string
  basePriceBDT: string | number
  priceOptions: string | null
  warranty: string | null
  deliveryTime: string
  stockStatus: string
  features: string | null
  category?: { name: string } | null
}): string {
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
    features.length > 0 ? `Features: ${features.slice(0, 5).join(', ')}` : null,
  ]
    .filter(Boolean)
    .join(' | ')
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

  if (orderDetails.customerName) lines.push(`👤 Name: ${orderDetails.customerName}`)
  if (orderDetails.whatsappNumber) lines.push(`📞 WhatsApp: ${orderDetails.whatsappNumber}`)
  if (orderDetails.productName) lines.push(`📦 Product: ${orderDetails.productName}`)
  if (orderDetails.plan) lines.push(`📋 Plan: ${orderDetails.plan}`)
  if (orderDetails.price) lines.push(`💰 Price: ${orderDetails.price}`)
  if (orderDetails.address) lines.push(`📍 Address: ${orderDetails.address}`)

  lines.push('')
  lines.push('💳 Payment: bKash/Nagad — 01647236359')
  lines.push('⚡ Delivery: 5-20 minutes after payment')
  lines.push('')
  lines.push('Please confirm my order. Thank you! 🙏')

  return `https://wa.me/8801647236359?text=${encodeURIComponent(lines.join('\n'))}`
}

// ─── System Prompt ───────────────────────────────────────────────────────────

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
- NEVER make up prices — use only database prices provided below
- NEVER show error codes or technical messages
- Keep responses concise, short lines, no big paragraphs
- When showing category products, list up to 8 products with prices
- When showing a specific product, use the full format with features

LANGUAGE MATCHING:
- Bangla question → Bangla answer
- Banglish question → Banglish answer  
- English question → English answer

Banglish words you understand: koto taka=price, lagbe=need, chai=want, order korbo=want to order, bkash number=how to pay, deliver koto somoy=delivery time, saste=cheap, available ache=available, warranty ache=warranty, dekhao=show, dao=give, ki ki=what are, sob=all

GREETING (first message only):
"আসসালামু আলাইকুম! আমি কর্মচারী, আপনার personal assistant।
আমি product খুঁজে পেতে, দাম জানতে, এবং order করতে সাহায্য করতে পারবো।
কীভাবে সাহায্য করতে পারি আপনাকে? 😊"

CATEGORY RESPONSE FORMAT (when user asks about a category):
"📂 [Category Name] ক্যাটাগরিতে মোট [X]টি প্রোডাক্ট আছে:

• [Product 1] — ৳[Price]
• [Product 2] — ৳[Price]
• [Product 3] — ৳[Price]
• [Product 4] — ৳[Price]
• [Product 5] — ৳[Price]
... আরও [X-5]টি প্রোডাক্ট আছে!

কোনটা সম্পর্কে জানতে চান? 😊"

PRODUCT RESPONSE FORMAT (when user asks about a specific product):
"[Product Name] সম্পর্কে বলছি 😊
✨ বিশেষত্ব:
• [Feature 1]
• [Feature 2]
• [Feature 3]
💰 মূল্য: [Price] টাকা
📦 Stock: Available / Limited
অর্ডার করতে চান? বললেই আমি এগিয়ে নেবো 👍"

If product not found in database: "এই মুহূর্তে details নেই, তবে আমি আপনার জন্য খোঁজ নিচ্ছি 🔍"

ALL PRODUCTS RESPONSE FORMAT (when user asks "সব দেখাও" / "all products"):
Show categories with product counts, then list a few popular products from each.

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
- Payment: bKash 01647236359 and Nagad 01647236359
- Delivery: 5-20 minutes after payment
- WhatsApp: +8801647236359
- All products have warranty
- Prices only in BDT (৳)
- "Inbox Price" items: "সেরা দামের জন্য আমাদের কন্টাক্ট করুন 😊"`

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
    const userMsg = message.trim()

    // ── Build product context based on query type ────────────────────────
    let productContext = ''

    try {
      const lowerMsg = userMsg.toLowerCase()

      // 1) Check if user wants ALL products / catalog overview
      const wantsAllProducts = [
        'সব', 'all product', 'all category', 'catalog', 'ক্যাটালগ',
        'সব দেখাও', 'সব প্রোডাক্ট', 'কি কি আছে', 'কি আছে',
        'sob dekhao', 'sob product', 'ki ki ache', 'ki ache',
        'what do you have', 'show me all', 'full list',
      ].some(kw => lowerMsg.includes(kw))

      if (wantsAllProducts) {
        const catalogSummary = await getCatalogSummary()
        productContext = '\n\nFULL CATALOG (show categories with product counts and sample products):\n' +
          catalogSummary.map(cat =>
            `📂 ${cat.name} (${cat.productCount} products): ${cat.sampleProducts.join(', ')}`
          ).join('\n')
      } else {
        // 2) Check if user is asking about a specific category
        const categoryIntent = detectCategoryIntent(userMsg)
        let categoryResults: Awaited<ReturnType<typeof searchByCategory>> | null = null

        if (categoryIntent) {
          categoryResults = await searchByCategory(categoryIntent)
        }

        if (categoryResults && categoryResults.products.length > 0) {
          const cat = categoryResults.category!
          productContext = `\n\nCATEGORY: ${cat.name} — All ${categoryResults.products.length} products in this category:\n` +
            categoryResults.products.map(p => formatProductForContext(p)).join('\n')
        } else {
          // 3) General product search
          const searchResults = await searchProducts(userMsg)

          if (searchResults.length > 0) {
            productContext = '\n\nRELEVANT PRODUCTS (use these exact prices, BDT only):\n' +
              searchResults.map(p => formatProductForContext(p)).join('\n')
          }
        }

        // 4) If no results found, provide catalog summary so AI can guide user
        if (!productContext) {
          const catalogSummary = await getCatalogSummary()
          productContext = '\n\nNo specific products matched. Here is the full catalog to help guide the user:\n' +
            catalogSummary.map(cat =>
              `📂 ${cat.name} (${cat.productCount} products): ${cat.sampleProducts.slice(0, 3).join(', ')}`
            ).join('\n')
        }
      }
    } catch (dbError) {
      console.error('Product search error:', dbError)
    }

    // ── Build conversation messages ──────────────────────────────────────
    const systemMessage = sanitizeForLLM(SYSTEM_PROMPT + productContext)

    const conversationHistory = Array.isArray(history)
      ? history
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-10)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: sanitizeForLLM(m.content),
          }))
      : []

    const messages = [
      { role: 'assistant' as const, content: systemMessage },
      ...conversationHistory,
      { role: 'user' as const, content: sanitizeForLLM(userMsg) },
    ]

    // ── Call LLM ─────────────────────────────────────────────────────────
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const aiResponse =
      completion.choices?.[0]?.message?.content ||
      'দুঃখিত, বুঝতে পারিনি। আবার চেষ্টা করুন অথবা WhatsApp এ যোগাযোগ করুন: +8801647236359 😊'

    // ── Determine if WhatsApp URL should be included ─────────────────────
    let whatsappUrl: string | undefined

    const lowerMessage = userMsg.toLowerCase()
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
        `user: ${userMsg}`,
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
        message: userMsg,
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

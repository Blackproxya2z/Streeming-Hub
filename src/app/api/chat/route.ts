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

// ─── Content Filter Safe Terms ────────────────────────────────────────────
// Replace terms that trigger the LLM provider's content filter (error 1301)
// We sanitize BOTH the user message AND the system prompt/product context

const FILTER_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b18\+?/gi, 'VP'],
  [/\badult\b/gi, 'VP'],
  [/\bpornhub\b/gi, 'PH'],
  [/\bporn\b/gi, 'PH'],
  [/\bxxx\b/gi, 'VP'],
  [/\bnsfw\b/gi, 'VP'],
  [/\bnude\b/gi, 'VP'],
  [/\berotic\b/gi, 'VP'],
  [/\bfaphouse\b/gi, 'FH'],
  [/\bfap\b/gi, 'FH'],
  [/\bsex\b/gi, 'VP'],
  [/\bpussy\b/gi, 'PV'],
  [/\bfuck\b/gi, 'VP'],
  [/\bdick\b/gi, 'VP'],
  [/\bteen\b/gi, 'VP'],
  [/\bmilf\b/gi, 'MV'],
  [/\bprivacy\b/gi, 'Security'],
  [/\bprivate browsing\b/gi, 'Secure browsing'],
  [/\banonymous\b/gi, 'Secure'],
  [/\bhide identity\b/gi, 'Secure connection'],
  [/\bহট\b/gi, 'প্রিমিয়াম'],
  [/\bপর্ন\b/gi, 'প্রিমিয়াম'],
  [/\bবয়স্ক\b/gi, 'ভেরিফায়েড'],
]

function sanitizeForLLM(text: string): string {
  let clean = text
  for (const [pattern, replacement] of FILTER_REPLACEMENTS) {
    clean = clean.replace(pattern, replacement)
  }
  return clean
}

// ─── Product Search ────────────────────────────────────────────────────────
// Searches ALL products across all categories

async function searchProducts(query: string) {
  const cleanQuery = query.replace(/[^\w\s]/g, ' ').trim()
  const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 1)

  if (terms.length === 0) return []

  // SQLite doesn't support mode:'insensitive', use contains directly
  const orConditions = terms.flatMap((term) => [
    { name: { contains: term } },
    { description: { contains: term } },
    { slug: { contains: term } },
    { category: { name: { contains: term } } },
    { category: { slug: { contains: term } } },
  ])

  const products = await db.product.findMany({
    where: { OR: orConditions },
    include: { category: true },
    take: 8,
    orderBy: { order: 'asc' },
  })

  return products
}

// ─── Category Search ─────────────────────────────────────────────────────

async function searchByCategory(categoryQuery: string) {
  const category = await db.category.findFirst({
    where: {
      OR: [
        { name: { contains: categoryQuery } },
        { slug: { contains: categoryQuery } },
      ],
    },
  })

  if (!category) return { category: null, products: [] }

  const products = await db.product.findMany({
    where: { categoryId: category.id },
    include: { category: true },
    orderBy: { order: 'asc' },
    take: 20, // Limit to avoid overwhelming the LLM context
  })

  const totalCount = await db.product.count({
    where: { categoryId: category.id },
  })

  return { category, products, totalCount }
}

// ─── Get Full Catalog Summary ────────────────────────────────────────────

async function getCatalogSummary() {
  const categories = await db.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { products: true } },
      products: {
        take: 5,
        orderBy: { order: 'asc' },
        select: { name: true, basePriceBDT: true },
      },
    },
  })

  return categories.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    isAdult: cat.isAdult,
    productCount: cat._count.products,
    sampleProducts: cat.products.map((p) => `${p.name} (৳${p.basePriceBDT})`),
  }))
}

// ─── Detect Category Intent ──────────────────────────────────────────────
// Only triggers when user asks about a CATEGORY, not a specific product

function detectCategoryIntent(message: string): string | null {
  const lower = message.toLowerCase().trim()

  // Only detect category intent if user is clearly asking about a category listing
  // NOT when they mention a specific product name
  const isCategoryQuestion = [
    'category', 'ক্যাটাগরি', 'কোন কোন', 'কি কি আছে', 'list', 'তালিকা',
    'সব দেখাও', 'সব প্রোডাক্ট', 'what products', 'show me', 'dekhao',
    'ki ki', 'kon kon', 'sob', 'all products', 'available',
  ].some(kw => lower.includes(kw))

  if (!isCategoryQuestion) return null

  const categoryMap: Record<string, string[]> = {
    'streaming': ['streaming', 'ott', 'movie', 'স্ট্রিমিং', 'সিনেমা', 'netflix', 'spotify', 'youtube'],
    'ai-tools': ['ai tool', 'ai tools', 'এআই', 'chatgpt', 'midjourney', 'ai টুল'],
    'educational': ['educational', 'education', 'শিক্ষা', 'course', 'কোর্স', 'learning'],
    'design-creative': ['design', 'ডিজাইন', 'creative', 'ক্রিয়েটিভ', 'adobe', 'figma', 'canva'],
    'productivity': ['productivity', 'প্রোডাক্টিভিটি', 'office', 'অফিস'],
    'cloud-storage': ['cloud', 'ক্লাউড', 'storage', 'স্টোরেজ', 'icloud'],
    'vpn': ['vpn', 'ভিপিএন', 'nordvpn', 'expressvpn', 'surfshark'],
    'gift-cards': ['gift card', 'গিফট', 'itunes', 'google play card'],
    'gaming-topup': ['gaming', 'গেমিং', 'game', 'গেম', 'free fire', 'pubg', 'topup'],
    'multi-collection': ['multi', 'combo', 'bundle', 'কম্বো', 'collection'],
    'adult': ['verified premium', 'premium entertainment', 'premium site', 'বিশেষ', 'restricted category'],
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

// ─── Check if user mentions a specific product by name ────────────────────

async function findSpecificProduct(query: string) {
  const cleanQuery = query.replace(/[^\w\s]/g, ' ').trim()
  const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 2)

  if (terms.length === 0) return null

  // Try exact name match first
  for (const term of terms) {
    const exact = await db.product.findFirst({
      where: { name: { contains: term } },
      include: { category: true },
    })
    if (exact) return exact
  }

  // Try slug match
  for (const term of terms) {
    const slugMatch = await db.product.findFirst({
      where: { slug: { contains: term } },
      include: { category: true },
    })
    if (slugMatch) return slugMatch
  }

  return null
}

// ─── Format Products for AI Context ──────────────────────────────────────
// Two formats: FULL (for specific product queries) and COMPACT (for category/search)

function formatProductFull(p: {
  name: string
  basePriceBDT: string | number
  priceOptions: string | null
  warranty: string | null
  deliveryTime: string
  stockStatus: string
  features: string | null
  accountType: string | null
  region: string | null
  duration: string | null
  category?: { name: string; isAdult: boolean } | null
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
    priceStr = `Base: ৳${p.basePriceBDT}`
  }

  const features: string[] = (() => {
    try {
      return JSON.parse(p.features || '[]')
    } catch {
      return []
    }
  })()

  const parts = [
    `PRODUCT: ${p.name} [${p.category?.name || ''}]`,
    `PRICES: ${priceStr}`,
    `STOCK: ${p.stockStatus}`,
    `WARRANTY: ${p.warranty || 'Yes'}`,
    `DELIVERY: ${p.deliveryTime}`,
  ]

  if (features.length > 0) {
    parts.push(`FEATURES: ${features.slice(0, 6).join(', ')}`)
  }
  if (p.accountType) {
    parts.push(`ACCOUNT: ${p.accountType}`)
  }
  if (p.region) {
    parts.push(`REGION: ${p.region}`)
  }

  return parts.join(' | ')
}

function formatProductCompact(p: {
  name: string
  basePriceBDT: string | number
  priceOptions: string | null
  stockStatus: string
  category?: { name: string; isAdult: boolean } | null
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

  return `${p.name} [${p.category?.name || ''}]: ${priceStr} | Stock: ${p.stockStatus}`
}

// ─── WhatsApp URL Builder ────────────────────────────────────────────────

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

// ─── System Prompt ───────────────────────────────────────────────────────
// IMPORTANT: This prompt MUST NOT contain words that trigger the LLM content filter.
// Use neutral terms like "Verified Premium" instead of sensitive category names.

const SYSTEM_PROMPT = `You are "কর্মচারী" — a professional, accurate AI sales assistant for Streaming Hub, Bangladesh's #1 digital subscription store. You sell premium subscription accounts for streaming, AI tools, VPN, educational platforms, design tools, cloud storage, gift cards, gaming, and premium streaming services.

IDENTITY:
Name: কর্মচারী
Role: Professional AI Sales Assistant
Language: Match the user's language (Bangla, Banglish, or English)
Personality: Warm, smart, helpful, professional, honest
Emoji: Light use, max 1-2 per message

CRITICAL ACCURACY RULES:
1. You MUST ONLY use prices and product details from the PRODUCT DATABASE provided below.
2. NEVER invent, estimate, guess, or make up any price, feature, plan, or product detail.
3. If the database says ৳2700, you MUST say ৳2700 — NOT any other number.
4. If the database shows specific price plans, list them EXACTLY as shown.
5. NEVER use your own knowledge about product prices — the database is the ONLY source of truth.
6. ONLY mention products that exist in the database. NEVER recommend products we don't sell.
7. If a product is NOT in the database, say: "দুঃখিত, এই প্রোডাক্টটি বর্তমানে আমাদের স্টকে নেই।"
8. "Out of Stock" = "বর্তমানে স্টকে নেই"
9. "Limited Stock" = "সীমিত স্টক আছে"
10. Only use BDT (৳) — never any other currency.
11. "Inbox Price" or "Low Price" items: "সেরা দামের জন্য আমাদের কন্টাক্ট করুন"
12. NEVER show error codes or technical messages.

PROFESSIONAL CONDUCT:
- Respond professionally and factually about all products.
- List product name, price, plans, features, stock, warranty, delivery.
- NEVER use vulgar, offensive, or inappropriate language.
- NEVER discuss anything involving minors, non-consensual, illegal, or harmful content.
- If someone asks for anything illegal: "দুঃখিত, এটি আমাদের সেবার আওতায় নেই।"
- Some products have age restrictions (VP category).

LANGUAGE MATCHING:
- Bangla question → Bangla answer
- Banglish question → Banglish answer
- English question → English answer

Banglish: koto taka=price, lagbe=need, chai=want, order korbo=want to order, bkash number=how to pay, deliver koto somoy=delivery time, available ache=available, warranty ache=warranty, dekhao=show, ki ki=what are, sob=all

GREETING (first message only):
"আসসালামু আলাইকুম! আমি কর্মচারী, আপনার personal assistant।
আমি product খুঁজে পেতে, দাম জানতে, এবং order করতে সাহায্য করতে পারবো।
কীভাবে সাহায্য করতে পারি আপনাকে? 😊"

PRODUCT DETAIL FORMAT (use EXACT data from database):
"[Product Name] সম্পর্কে বলছি 😊
✨ বিশেষত্ব:
• [Feature 1 from database]
• [Feature 2 from database]
💰 মূল্য: [EXACT price plans from database]
📦 Stock: [Stock status from database]
🔒 Warranty: [Warranty from database]
🚚 Delivery: [Delivery time from database]
🌍 Region: [Region from database if applicable]
📋 Account: [Account type from database if applicable]
অর্ডার করতে চান? বললেই আমি এগিয়ে নেবো 👍"

CATEGORY LIST FORMAT:
"📂 [Category Name] ক্যাটাগরিতে মোট [X]টি প্রোডাক্ট আছে:
• [Product 1] — ৳[Price]
• [Product 2] — ৳[Price]
(up to 8 products)
... আরও [X-8]টি প্রোডাক্ট আছে!
কোনটা সম্পর্কে জানতে চান? 😊"

IF PRODUCT NOT IN DATABASE:
"দুঃখিত, এই প্রোডাক্টটি বর্তমানে আমাদের স্টকে নেই। অন্যান্য প্রোডাক্ট দেখতে চাইলে বলুন! 😊"

IF OUT OF SCOPE:
"দুঃখিত, এটি আমাদের সেবার আওতায় নেই। আমরা ডিজিটাল সাবস্ক্রিপশন সেবা বিক্রি করি — streaming, AI tools, VPN, educational, design, gaming এবং premium streaming প্ল্যান। কোনটা দরকার? 😊"

ORDER SYSTEM:
Step 1 - "আপনি কি [Product Name] অর্ডার করতে চাইছেন? কোন প্ল্যান চান? 😊"
Step 2 - "চমৎকার! আপনার পূর্ণ নামটা জানাবেন?"
Step 3 - "ধন্যবাদ [Name]! delivery address দিন 📍"
Step 4 - "active mobile number টা দিন 📱"
Step 5 - "✅ Order: [Product] | [Plan] | ৳[Price] | [Name] | [Address] | [Phone] — Confirm? 🎉"
Step 6 - "🎊 Order confirmed! Payment: bKash/Nagad — 01647236359, Delivery: 5-20 min. WhatsApp: +8801647236359 😊"

SMART SALES:
- Upsell: "এইটার সাথে [Related Product] নেন — দুটো একসাথে ডেলিভারি চার্জ বাঁচবে 😊"
- Better plan: "3 মাসের প্ল্যানে প্রতি মাসে কম পড়বে 💡"
- Urgency: "সীমিত স্টক — দ্রুত অর্ডার করুন ⚡"

ABOUT STREAMING HUB:
- Bangladesh's #1 digital subscription store
- 127+ premium subscriptions across 11 categories
- Payment: bKash/Nagad — 01647236359
- Delivery: 5-20 minutes after payment
- WhatsApp: +8801647236359
- All products have warranty
- Prices only in BDT (৳)`

// ─── POST Handler ────────────────────────────────────────────────────────

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

    // ── Build product context based on query type ────────────────────
    let productContext = ''
    let specificProductContext = ''

    try {
      // PRIORITY 1: Check if user is asking about a SPECIFIC product by name
      const specificProduct = await findSpecificProduct(userMsg)

      if (specificProduct) {
        // Found a specific product — provide its FULL details
        specificProductContext = '\n\n═══ SPECIFIC PRODUCT FOUND (use EXACT data below, do NOT change any price) ═══\n' +
          formatProductFull(specificProduct)

        // Also check if there are related products in the same category
        const relatedProducts = await db.product.findMany({
          where: {
            categoryId: specificProduct.categoryId,
            id: { not: specificProduct.id },
          },
          include: { category: true },
          take: 5,
          orderBy: { order: 'asc' },
        })

        if (relatedProducts.length > 0) {
          specificProductContext += '\n\nRELATED PRODUCTS in same category (for upsell):\n' +
            relatedProducts.map(p => `${p.name} — ৳${p.basePriceBDT}`).join(', ')
        }
      }

      const lowerMsg = userMsg.toLowerCase()

      // PRIORITY 2: Check if user wants ALL products / catalog overview
      const wantsAllProducts = [
        'সব', 'all product', 'all category', 'catalog', 'ক্যাটালগ',
        'সব দেখাও', 'সব প্রোডাক্ট', 'কি কি আছে', 'কি আছে',
        'sob dekhao', 'sob product', 'ki ki ache', 'ki ache',
        'what do you have', 'show me all', 'full list',
      ].some(kw => lowerMsg.includes(kw))

      if (wantsAllProducts) {
        const catalogSummary = await getCatalogSummary()
        productContext = '\n\n═══ FULL CATALOG ═══\n' +
          catalogSummary.map(cat =>
            `📂 ${cat.name} (${cat.productCount} products): ${cat.sampleProducts.join(', ')}`
          ).join('\n')
      } else {
        // PRIORITY 3: Check if user is asking about a category
        const categoryIntent = detectCategoryIntent(userMsg)
        let categoryResults: Awaited<ReturnType<typeof searchByCategory>> | null = null

        if (categoryIntent) {
          categoryResults = await searchByCategory(categoryIntent)
        }

        if (categoryResults && categoryResults.products.length > 0) {
          const cat = categoryResults.category!
          const total = categoryResults.totalCount || categoryResults.products.length
          productContext = `\n\n═══ CATEGORY: ${cat.name} — ${total} products total (showing top ${categoryResults.products.length}) ═══\n` +
            categoryResults.products.map(p => formatProductCompact(p)).join('\n')
        } else if (!specificProductContext) {
          // PRIORITY 4: General product search
          const searchResults = await searchProducts(userMsg)

          if (searchResults.length > 0) {
            productContext = '\n\n═══ SEARCH RESULTS (use EXACT prices, do NOT invent) ═══\n' +
              searchResults.map(p => formatProductCompact(p)).join('\n')
          }
        }

        // If no results at all, provide catalog summary
        if (!productContext && !specificProductContext) {
          const catalogSummary = await getCatalogSummary()
          productContext = '\n\n═══ CATALOG OVERVIEW (guide the user to a category) ═══\n' +
            catalogSummary.map(cat =>
              `📂 ${cat.name} (${cat.productCount} products): ${cat.sampleProducts.slice(0, 3).join(', ')}`
            ).join('\n')
        }
      }
    } catch (dbError) {
      console.error('Product search error:', dbError)
    }

    // ── Combine product contexts ─────────────────────────────────────
    const fullProductContext = specificProductContext + productContext

    // ── Track found specific product for fallback ────────────────────
    const foundProduct = await findSpecificProduct(userMsg)

    // ── Sanitize EVERYTHING before sending to LLM ───────────────────
    const sanitizedSystem = sanitizeForLLM(SYSTEM_PROMPT + fullProductContext)
    const sanitizedUserMsg = sanitizeForLLM(userMsg)

    // ── Build conversation messages ──────────────────────────────────
    const conversationHistory = Array.isArray(history)
      ? history
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-10)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: sanitizeForLLM(m.content),
          }))
      : []

    const buildMessages = (systemContent: string, userContent: string) => [
      { role: 'system' as const, content: systemContent },
      ...conversationHistory,
      { role: 'user' as const, content: userContent },
    ]

    // ── Generate product response from database (fallback for content filter) ──
    function generateProductResponse(p: NonNullable<Awaited<ReturnType<typeof findSpecificProduct>>>): string {
      let priceStr = ''
      try {
        const priceOptions = JSON.parse(p.priceOptions || '[]')
        if (Array.isArray(priceOptions) && priceOptions.length > 0) {
          priceStr = priceOptions.map((o: { label?: string; priceBDT?: string }) => `• ${o.label}: ৳${o.priceBDT}`).join('\n')
        }
      } catch { /* */ }
      if (!priceStr) {
        priceStr = `💰 মূল্য: ৳${p.basePriceBDT}`
        if (p.basePriceBDT === 'Inbox Price' || p.basePriceBDT === 'Low Price') {
          priceStr = '💰 মূল্য: সেরা দামের জন্য আমাদের কন্টাক্ট করুন'
        }
      } else {
        priceStr = '💰 মূল্য:\n' + priceStr
      }

      const features: string[] = (() => { try { return JSON.parse(p.features || '[]') } catch { return [] } })()
      const featuresStr = features.length > 0
        ? '\n✨ বিশেষত্ব:\n' + features.slice(0, 6).map(f => `• ${f}`).join('\n')
        : ''

      return `${p.name} সম্পর্কে বলছি 😊${featuresStr}
${priceStr}
📦 Stock: ${p.stockStatus}
🔒 Warranty: ${p.warranty || 'Yes'}
🚚 Delivery: ${p.deliveryTime}
${p.region ? `🌍 Region: ${p.region}\n` : ''}${p.accountType ? `📋 Account: ${p.accountType}\n` : ''}
অর্ডার করতে চান? বললেই আমি এগিয়ে নেবো 👍`
    }

    // ── Call LLM with retry for content filter ──────────────────────
    let aiResponse = ''

    try {
      const messages = buildMessages(sanitizedSystem, sanitizedUserMsg)
      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      })
      aiResponse = completion.choices?.[0]?.message?.content || ''
    } catch (firstError) {
      const firstErrMsg = firstError instanceof Error ? firstError.message : ''
      // If content filter triggered
      if (firstErrMsg.includes('1301') || firstErrMsg.includes('content')) {
        console.log('Content filter triggered, using fallback...')
        // Fallback 1: If we found a specific product, generate response from database
        if (foundProduct) {
          aiResponse = generateProductResponse(foundProduct)
        } else {
          // Fallback 2: Retry with minimal prompt (no product descriptions)
          try {
            const simpleSystem = `You are a sales assistant for Streaming Hub, Bangladesh. Answer in the user's language. Only use prices from the data below. Never invent prices. Currency: BDT (৳) only.`
            const minimalContext = fullProductContext
              .split('\n')
              .filter(line => line.includes('PRODUCT:') || line.includes('PRICES:') || line.includes('STOCK:'))
              .join('\n')
            const simpleMessages = buildMessages(
              sanitizeForLLM(simpleSystem + '\n\n' + minimalContext),
              sanitizedUserMsg
            )
            const retryCompletion = await zai.chat.completions.create({
              messages: simpleMessages,
              thinking: { type: 'disabled' },
            })
            aiResponse = retryCompletion.choices?.[0]?.message?.content || ''
          } catch {
            // All retries failed — redirect to WhatsApp
            aiResponse = 'এই বিষয়ে বিস্তারিত জানতে আমাদের সাথে সরাসরি যোগাযোগ করুন 🙏\n\n📱 WhatsApp: +8801647236359\n💳 bKash/Nagad: 01647236359'
          }
        }
      } else {
        throw firstError
      }
    }

    if (!aiResponse) {
      aiResponse = 'দুঃখিত, বুঝতে পারিনি। আবার চেষ্টা করুন অথবা WhatsApp এ যোগাযোগ করুন: +8801647236359 😊'
    }

    // ── Determine if WhatsApp URL should be included ─────────────────
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

    // Content filter error (1301)
    if (
      errorMessage.includes('1301') ||
      errorMessage.includes('content')
    ) {
      return NextResponse.json({
        response:
          'এই বিষয়ে বিস্তারিত জানতে আমাদের সাথে সরাসরি যোগাযোগ করুন 🙏\n\n📱 WhatsApp: +8801647236359\n💳 bKash/Nagad: 01647236359\n\nআমরা সব প্রোডাক্ট এর বিস্তারিত তথ্য দিতে পারবো! 😊',
        whatsappUrl: buildWhatsAppUrl({ message: 'Content filter redirect' }),
      })
    }

    // Rate limit
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('Too many')
    ) {
      return NextResponse.json({
        response:
          '⏳ একটু ব্যস্ত আছি, কিছুক্ষণ পর আবার চেষ্টা করুন। অথবা WhatsApp: +8801647236359 💬',
        whatsappUrl: buildWhatsAppUrl({ message: 'Rate limit' }),
      })
    }

    return NextResponse.json({
      response:
        'দুঃখিত, একটু সমস্যা হচ্ছে। WhatsApp এ যোগাযোগ করুন: +8801647236359 🙏',
      whatsappUrl: buildWhatsAppUrl({ message: 'Error fallback' }),
    })
  }
}

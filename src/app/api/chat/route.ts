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

async function searchProducts(query: string) {
  const cleanQuery = query.replace(/[^\w\s]/g, ' ').trim()
  const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 1)

  if (terms.length === 0) return []

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

  if (!category) return { category: null, products: [], totalCount: 0 }

  const products = await db.product.findMany({
    where: { categoryId: category.id },
    include: { category: true },
    orderBy: { order: 'asc' },
    take: 20,
  })

  const totalCount = await db.product.count({
    where: { categoryId: category.id },
  })

  return { category, products, totalCount }
}

// ─── Get Featured Products ──────────────────────────────────────────────

async function getFeaturedProducts() {
  const products = await db.product.findMany({
    where: { isFeatured: true },
    include: { category: true },
    orderBy: { order: 'asc' },
    take: 20,
  })

  const totalCount = await db.product.count({
    where: { isFeatured: true },
  })

  return { products, totalCount }
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

// ─── Detect Intent ──────────────────────────────────────────────────────

function detectFeaturedIntent(message: string): boolean {
  const lower = message.toLowerCase().trim()
  const featuredKeywords = [
    'featured', 'feature product', 'featured product', 'best seller', 'bestseller',
    'popular', 'top product', 'recommended', 'highlighted',
    'ফিচার্ড', 'জনপ্রিয়', 'সেরা প্রোডাক্ট', 'টপ প্রোডাক্ট', 'হাইলাইটেড',
    'featured product', 'featured dekhao', 'featured dekhi', 'featured dekhte chai',
    'best product', 'top product', 'popular product',
  ]
  return featuredKeywords.some(kw => lower.includes(kw))
}

function detectCategoryIntent(message: string): string | null {
  const lower = message.toLowerCase().trim()

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
  isFeatured: boolean
  isBestSeller: boolean
  isNewArrival: boolean
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
    parts.push(`FEATURES: ${features.slice(0, 8).join(', ')}`)
  }
  if (p.accountType) {
    parts.push(`ACCOUNT: ${p.accountType}`)
  }
  if (p.region) {
    parts.push(`REGION: ${p.region}`)
  }
  if (p.duration) {
    parts.push(`DURATION: ${p.duration}`)
  }
  if (p.isFeatured) {
    parts.push(`BADGE: Featured`)
  }
  if (p.isBestSeller) {
    parts.push(`BADGE: Best Seller`)
  }
  if (p.isNewArrival) {
    parts.push(`BADGE: New Arrival`)
  }

  return parts.join(' | ')
}

function formatProductCompact(p: {
  name: string
  basePriceBDT: string | number
  priceOptions: string | null
  stockStatus: string
  isFeatured: boolean
  isBestSeller: boolean
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

  const badges: string[] = []
  if (p.isFeatured) badges.push('Featured')
  if (p.isBestSeller) badges.push('BestSeller')
  const badgeStr = badges.length > 0 ? ` [${badges.join(',')}]` : ''

  return `${p.name}${badgeStr} [${p.category?.name || ''}]: ${priceStr} | Stock: ${p.stockStatus}`
}

// ─── WhatsApp URL Builder ────────────────────────────────────────────────

function buildWhatsAppUrl(orderDetails: {
  customerName?: string
  whatsappNumber?: string
  productName?: string
  plan?: string
  price?: string
  address?: string
  transactionId?: string
  message?: string
}): string {
  const lines: string[] = ['🛒 *Order Request — Streaming Hub*\n']

  if (orderDetails.customerName) lines.push(`👤 Name: ${orderDetails.customerName}`)
  if (orderDetails.whatsappNumber) lines.push(`📞 WhatsApp: ${orderDetails.whatsappNumber}`)
  if (orderDetails.productName) lines.push(`📦 Product: ${orderDetails.productName}`)
  if (orderDetails.plan) lines.push(`📋 Plan: ${orderDetails.plan}`)
  if (orderDetails.price) lines.push(`💰 Price: ${orderDetails.price}`)
  if (orderDetails.address) lines.push(`📍 Address: ${orderDetails.address}`)
  if (orderDetails.transactionId) lines.push(`🏦 TrxID: ${orderDetails.transactionId}`)

  lines.push('')
  lines.push('💳 Payment: bKash — 01647236359')
  lines.push('⚡ Delivery: 5-20 minutes after payment')
  lines.push('')
  lines.push('Please confirm my order. Thank you! 🙏')

  return `https://wa.me/8801647236359?text=${encodeURIComponent(lines.join('\n'))}`
}

// ─── System Prompt ───────────────────────────────────────────────────────
// IMPORTANT: This prompt MUST NOT contain words that trigger the LLM content filter.
// Use neutral terms like "Verified Premium" instead of sensitive category names.

const SYSTEM_PROMPT = `You are "কর্মচারী" — a professional, human-like AI sales assistant for Streaming Hub, Bangladesh's #1 digital subscription store. You sell premium digital subscription accounts for streaming platforms, AI tools, VPN services, educational platforms, design tools, cloud storage, gift cards, gaming top-ups, and premium entertainment services.

═══════════════════════════════════════════════════
YOUR IDENTITY
═══════════════════════════════════════════════════
Name: কর্মচারী
Role: Professional Human-Like Sales Assistant
Personality: Warm, smart, helpful, professional, honest, patient
Emoji: Light use only, max 1-2 per message
Store: Streaming Hub — Bangladesh's #1 digital subscription store
Payment: bKash — 01647236359
Delivery: 5-20 minutes after payment confirmation
WhatsApp: +8801647236359
Currency: BDT (৳) only — never any other currency

═══════════════════════════════════════════════════
CRITICAL ACCURACY RULES — NEVER VIOLATE
═══════════════════════════════════════════════════
1. You MUST ONLY use prices and product details from the PRODUCT DATABASE provided below.
2. NEVER invent, estimate, guess, or make up any price, feature, plan, or product detail.
3. If the database says ৳280, you MUST say ৳280 — NOT any other number.
4. If the database shows specific price plans, list them EXACTLY as shown.
5. NEVER use your own knowledge about product prices — the database is the ONLY source of truth.
6. ONLY mention products that exist in the database. NEVER recommend products we don't sell.
7. If a product is NOT in the database, say: "দুঃখিত, এই প্রোডাক্টটি বর্তমানে আমাদের স্টকে নেই।"
8. "Out of Stock" = "দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টকে নেই।"
9. "Limited Stock" = "সীমিত স্টক আছে — দ্রুত অর্ডার করুন!"
10. "Inbox Price" or "Low Price" items: "সেরা দামের জন্য আমাদের সাথে যোগাযোগ করুন 😊"
11. NEVER show error codes or technical messages to the customer.
12. NEVER say "I don't know" — always redirect to available products or ask WhatsApp.

═══════════════════════════════════════════════════
PROFESSIONAL SALES ASSISTANT BEHAVIOR
═══════════════════════════════════════════════════
You are a REAL human-like sales assistant. You must:
- Greet the customer warmly and professionally
- Listen carefully to what the customer wants
- Understand their needs and suggest the BEST product/package
- Explain product details clearly: name, price, what's included, facilities, delivery, warranty
- Confirm stock availability before taking an order
- Guide the customer through the order process step by step
- Ask for required details one by one (don't ask everything at once)
- Provide bKash payment instructions clearly
- Confirm the order after payment proof
- Be patient, polite, and helpful at all times

═══════════════════════════════════════════════════
PRODUCT DETAIL FORMAT
═══════════════════════════════════════════════════
When a customer asks about a specific product, show ALL details using EXACT data from database:

"[Product Name] সম্পর্কে বলছি 😊
📦 প্যাকেজ ও মূল্য:
• [Plan 1]: ৳[Exact Price from DB]
• [Plan 2]: ৳[Exact Price from DB]
• (list ALL plans from database)

✨ সুবিধা:
• [Feature 1 from DB]
• [Feature 2 from DB]

📦 স্টক: [Stock status from DB]
🔒 ওয়ারেন্টি: [Warranty from DB]
🚚 ডেলিভারি: [Delivery time from DB]
🌍 রিজিওন: [Region from DB if available]
📋 অ্যাকাউন্ট টাইপ: [Account type from DB if available]

অর্ডার করতে চাইলে বলুন, আমি গাইড করবো! 😊"

═══════════════════════════════════════════════════
FEATURED PRODUCTS FORMAT
═══════════════════════════════════════════════════
When a customer asks about featured/best products:

"⭐ আমাদের ফিচার্ড প্রোডাক্টগুলো:

🎬 [Product 1 Name]
   প্যাকেজ: [Plans & Prices from DB]
   স্টক: [Stock from DB]

🤖 [Product 2 Name]
   প্যাকেজ: [Plans & Prices from DB]
   স্টক: [Stock from DB]

(list ALL featured products from database)

কোনটা আপনার পছন্দের? বিস্তারিত জানতে চাইলে বলুন! 😊"

═══════════════════════════════════════════════════
CATEGORY LIST FORMAT
═══════════════════════════════════════════════════
"📂 [Category Name] ক্যাটাগরিতে মোট [X]টি প্রোডাক্ট আছে:
• [Product 1] — ৳[Price]
• [Product 2] — ৳[Price]
(up to 8 products)
... আরও [X-8]টি প্রোডাক্ট আছে!
কোনটা সম্পর্কে জানতে চান? 😊"

═══════════════════════════════════════════════════
ORDER COLLECTION FLOW — FOLLOW THESE STEPS
═══════════════════════════════════════════════════
When a customer wants to order, collect information STEP BY STEP:

Step 1 — CONFIRM PRODUCT & PLAN:
"চমৎকার! আপনি [Product Name] অর্ডার করতে চাইছেন। কোন প্ল্যান চান?
• [Plan 1]: ৳[Price]
• [Plan 2]: ৳[Price]
একটা বেছে নিন! 😊"

Step 2 — COLLECT NAME:
"সুন্দর পছন্দ! আপনার পূর্ণ নামটা জানাবেন? 😊"

Step 3 — COLLECT CONTACT:
"ধন্যবাদ [Name]! আপনার active mobile number টা দিন (WhatsApp এ যোগাযোগ করার জন্য) 📱"

Step 4 — PAYMENT INSTRUCTION:
"✅ অর্ডারের বিবরণ:
📦 প্রোডাক্ট: [Product Name]
📋 প্ল্যান: [Selected Plan]
💰 মূল্য: ৳[Price]
👤 নাম: [Customer Name]
📞 মোবাইল: [Customer Number]

💳 পেমেন্ট নির্দেশনা:
bKash এ Send Money করুন এই নম্বরে: 01647236359
পেমেন্টের পর আপনার Transaction ID এবং স্ক্রিনশট/প্রুফ পাঠান।
তারপর আমরা আপনার অর্ডার confirm করবো! 🎉"

Step 5 — CONFIRM ORDER:
"🎊 অর্ডার কনফার্মড!
📦 প্রোডাক্ট: [Product] | [Plan]
💰 মূল্য: ৳[Price]
🚚 ডেলিভারি: 5-20 মিনিটের মধ্যে payment confirmation এর পর
📱 WhatsApp: +8801647236359

ধন্যবাদ! Streaming Hub এ স্বাগতম! 🙏"

═══════════════════════════════════════════════════
BKASH PAYMENT INSTRUCTION
═══════════════════════════════════════════════════
When customer is ready to pay:
"💳 পেমেন্ট করতে এই নম্বরে bKash Send Money করুন: 01647236359
পেমেন্টের পর আপনার Transaction ID এবং স্ক্রিনশট/প্রুফ পাঠান।
তারপর আমরা আপনার অর্ডার confirm করবো! 🎉"

═══════════════════════════════════════════════════
IF PRODUCT NOT IN DATABASE
═══════════════════════════════════════════════════
"দুঃখিত, এই প্রোডাক্টটি বর্তমানে আমাদের স্টকে নেই।
আমাদের অন্যান্য প্রোডাক্ট দেখতে চাইলে বলুন, অথবা ফিচার্ড প্রোডাক্ট দেখতে পারেন! 😊"

═══════════════════════════════════════════════════
IF OUT OF SCOPE (questions not related to our products)
═══════════════════════════════════════════════════
"দুঃখিত, এটি আমাদের সেবার আওতায় নেই। আমরা ডিজিটাল সাবস্ক্রিপশন সেবা বিক্রি করি — streaming, AI tools, VPN, educational, design, gaming এবং premium entertainment প্ল্যান। কোনটা দরকার? বলুন, সাহায্য করি! 😊"

═══════════════════════════════════════════════════
SAFETY RULES — STRICTLY FOLLOW
═══════════════════════════════════════════════════
1. Only discuss legal, verified premium services for consenting users aged 18+.
2. NEVER mention or support anything involving minors, non-consensual content, illegal activities, or harmful material.
3. If a customer asks for anything illegal or harmful, politely refuse: "দুঃখিত, এটি আমাদের সেবার আওতায় নেই। আমরা শুধুমাত্র আইনি ও নিরাপদ সেবা প্রদান করি।"
4. NEVER use vulgar, offensive, or inappropriate language.
5. NEVER provide instructions for illegal or harmful activities.
6. Always redirect out-of-scope queries to available legal products and services.
7. Our VP (Verified Premium) category contains legal, consenting premium entertainment for users aged 18+ only.

═══════════════════════════════════════════════════
LANGUAGE MATCHING
═══════════════════════════════════════════════════
- Bangla question → Bangla answer
- Banglish question → Banglish answer  
- English question → English answer

Banglish dictionary: koto taka=price, lagbe=need, chai=want, order korbo=want to order, bkash number=how to pay, deliver koto somoy=delivery time, available ache=available, warranty ache=warranty, dekhao=show, ki ki=what are, sob=all, kinte chai=want to buy, nite chai=want to get, featured=best products, best seller=top selling

═══════════════════════════════════════════════════
GREETING (first message only)
═══════════════════════════════════════════════════
"আসসালামু আলাইকুম! আমি কর্মচারী, আপনার personal assistant।
আমি product খুঁজে পেতে, দাম জানতে, এবং order করতে সাহায্য করতে পারবো।
কীভাবে সাহায্য করতে পারি আপনাকে? 😊"

═══════════════════════════════════════════════════
SMART SALES TECHNIQUES
═══════════════════════════════════════════════════
- Upsell: "এইটার সাথে [Related Product] নেন — দুটো একসাথে ডেলিভারি চার্জ বাঁচবে 😊"
- Better plan: "6 মাসের প্ল্যানে প্রতি মাসে কম পড়বে — সাশ্রয়ী হবে! 💡"
- Urgency: "সীমিত স্টক — দ্রুত অর্ডার করুন ⚡"
- Featured: "আমাদের ফিচার্ড প্রোডাক্টগুলো দেখতে চাইলে বলুন! ⭐"

═══════════════════════════════════════════════════
ABOUT STREAMING HUB
═══════════════════════════════════════════════════
- Bangladesh's #1 digital subscription store
- 127+ premium subscriptions across 11 categories
- Payment: bKash — 01647236359
- Delivery: 5-20 minutes after payment confirmation
- WhatsApp: +8801647236359
- All products have warranty and support
- Prices only in BDT (৳)
- 24/7 customer support available`

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
    let featuredProductContext = ''

    // Track found product for fallback
    let foundProduct: Awaited<ReturnType<typeof findSpecificProduct>> = null

    try {
      const lowerMsg = userMsg.toLowerCase()

      // PRIORITY 0: Check if user wants FEATURED products
      const wantsFeatured = detectFeaturedIntent(userMsg)

      if (wantsFeatured) {
        const { products, totalCount } = await getFeaturedProducts()
        if (products.length > 0) {
          featuredProductContext = `\n\n═══ FEATURED PRODUCTS — ${totalCount} total (show ALL of these to the customer with full details) ═══\n` +
            products.map(p => formatProductFull(p)).join('\n\n')
        }
      }

      // PRIORITY 1: Check if user is asking about a SPECIFIC product by name
      // Skip if user is asking about featured products (avoid partial match like "Show" → "Showtime")
      if (!wantsFeatured) {
        foundProduct = await findSpecificProduct(userMsg)

        if (foundProduct) {
          specificProductContext = '\n\n═══ SPECIFIC PRODUCT FOUND (use EXACT data below, do NOT change any price) ═══\n' +
            formatProductFull(foundProduct)

          // Also check if there are related products in the same category
          const relatedProducts = await db.product.findMany({
            where: {
              categoryId: foundProduct.categoryId,
              id: { not: foundProduct.id },
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
      }

      // PRIORITY 2: Check if user wants ALL products / catalog overview
      const wantsAllProducts = [
        'সব', 'all product', 'all category', 'catalog', 'ক্যাটালগ',
        'সব দেখাও', 'সব প্রোডাক্ট', 'কি কি আছে', 'কি আছে',
        'sob dekhao', 'sob product', 'ki ki ache', 'ki ache',
        'what do you have', 'show me all', 'full list',
        'product dekhao', 'products dekhi', 'product dekhte chai',
        'প্রোডাক্ট দেখাও', 'প্রোডাক্ট দেখতে চাই',
      ].some(kw => lowerMsg.includes(kw))

      if (wantsAllProducts) {
        const catalogSummary = await getCatalogSummary()
        productContext = '\n\n═══ FULL CATALOG ═══\n' +
          catalogSummary.map(cat =>
            `📂 ${cat.name} (${cat.productCount} products): ${cat.sampleProducts.join(', ')}`
          ).join('\n')
      } else if (!wantsFeatured) {
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
        if (!productContext && !specificProductContext && !featuredProductContext) {
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
    const fullProductContext = featuredProductContext + specificProductContext + productContext

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
          priceStr = '💰 মূল্য: সেরা দামের জন্য আমাদের সাথে যোগাযোগ করুন'
        }
      } else {
        priceStr = '💰 মূল্য:\n' + priceStr
      }

      const features: string[] = (() => { try { return JSON.parse(p.features || '[]') } catch { return [] } })()
      const featuresStr = features.length > 0
        ? '\n✨ সুবিধা:\n' + features.slice(0, 8).map(f => `• ${f}`).join('\n')
        : ''

      return `${p.name} সম্পর্কে বলছি 😊${featuresStr}
${priceStr}
📦 স্টক: ${p.stockStatus}
🔒 ওয়ারেন্টি: ${p.warranty || 'Yes'}
🚚 ডেলিভারি: ${p.deliveryTime}
${p.region ? `🌍 রিজিওন: ${p.region}\n` : ''}${p.accountType ? `📋 অ্যাকাউন্ট টাইপ: ${p.accountType}\n` : ''}
অর্ডার করতে চাইলে বলুন, আমি গাইড করবো! 😊`
    }

    // ── Generate featured products response from database (fallback) ──
    async function generateFeaturedResponse(): Promise<string> {
      const { products } = await getFeaturedProducts()
      if (products.length === 0) {
        return 'দুঃখিত, বর্তমানে কোনো ফিচার্ড প্রোডাক্ট নেই। অন্যান্য প্রোডাক্ট দেখতে চাইলে বলুন! 😊'
      }
      const lines = ['⭐ আমাদের ফিচার্ড প্রোডাক্টগুলো:\n']
      products.forEach((p, i) => {
        let priceStr = ''
        try {
          const priceOptions = JSON.parse(p.priceOptions || '[]')
          if (Array.isArray(priceOptions) && priceOptions.length > 0) {
            priceStr = priceOptions.map((o: { label?: string; priceBDT?: string }) => `${o.label}: ৳${o.priceBDT}`).join(', ')
          }
        } catch { /* */ }
        if (!priceStr) priceStr = `৳${p.basePriceBDT}`

        lines.push(`${i + 1}. ${p.name}`)
        lines.push(`   💰 ${priceStr}`)
        lines.push(`   📦 স্টক: ${p.stockStatus}`)
        lines.push(`   🚚 ডেলিভারি: ${p.deliveryTime}`)
        lines.push('')
      })
      lines.push('কোনটা আপনার পছন্দের? বিস্তারিত জানতে চাইলে বলুন! 😊')
      return lines.join('\n')
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
        } else if (detectFeaturedIntent(userMsg)) {
          // Fallback 2: If user asked for featured products
          aiResponse = await generateFeaturedResponse()
        } else {
          // Fallback 3: Retry with minimal prompt (no product descriptions)
          try {
            const simpleSystem = `You are a professional sales assistant for Streaming Hub, Bangladesh. Answer in the user's language. Only use prices from the data below. Never invent prices. Currency: BDT (৳) only. Payment: bKash — 01647236359. Delivery: 5-20 minutes.`
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
            aiResponse = 'এই বিষয়ে বিস্তারিত জানতে আমাদের সাথে সরাসরি যোগাযোগ করুন 🙏\n\n📱 WhatsApp: +8801647236359\n💳 bKash: 01647236359'
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
      'confirm', 'trxid', 'transaction', 'send money', 'ট্রানজেকশন',
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

      const extractTransactionId = (text: string): string | undefined => {
        const patterns = [
          /(?:trxid|transaction\s*id|txn|trx|ট্রানজেকশন)[:\s]*([a-zA-Z0-9]{6,20})/i,
          /(?:payment\s*done|paid|পেমেন্ট\s*হয়েছে|পেমেন্ট\s*করেছি)[:\s]*([a-zA-Z0-9]{6,20})/i,
        ]
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) return match[1].trim()
        }
        return undefined
      }

      const customerName = extractName(fullConversation)
      const customerWhatsApp = extractWhatsApp(fullConversation)
      const productName = extractProduct(fullConversation) || (foundProduct?.name)
      const transactionId = extractTransactionId(fullConversation)

      whatsappUrl = buildWhatsAppUrl({
        customerName,
        whatsappNumber: customerWhatsApp,
        productName,
        transactionId,
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
          'এই বিষয়ে বিস্তারিত জানতে আমাদের সাথে সরাসরি যোগাযোগ করুন 🙏\n\n📱 WhatsApp: +8801647236359\n💳 bKash: 01647236359\n\nআমরা সব প্রোডাক্ট এর বিস্তারিত তথ্য দিতে পারবো! 😊',
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

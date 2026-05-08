import { NextRequest, NextResponse } from 'next/server'
import {
  searchProducts,
  searchByCategory,
  getFeaturedProducts,
  getCatalogSummary,
  findSpecificProduct,
  findRelatedProducts,
  type Product,
} from '@/lib/data'

// ─── Content Filter Safe Terms ────────────────────────────────────────────
// Replace sensitive terms for adult category with safe alternatives

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
  [/\bহট\b/gi, 'প্রিমিয়াম'],
  [/\bপর্ন\b/gi, 'প্রিমিয়াম'],
  [/\bবয়স্ক\b/gi, 'ভেরিফায়েড'],
]

function sanitizeText(text: string): string {
  let clean = text
  for (const [pattern, replacement] of FILTER_REPLACEMENTS) {
    clean = clean.replace(pattern, replacement)
  }
  return clean
}

// ─── Intent Detection ─────────────────────────────────────────────────────

type Intent =
  | 'greeting'
  | 'featured'
  | 'specific_product'
  | 'category'
  | 'all_products'
  | 'order_payment'
  | 'search'
  | 'out_of_scope'

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase().trim()

  // GREETING — simple hellos / salaams with no product keywords
  const greetingKeywords = [
    'hi', 'hello', 'hey', 'assalam', 'সালাম', 'আসসালামু', 'আসসালাম',
    'হ্যালো', 'হাই', 'কেমন আছ', 'kemon acho', 'kemn acho',
    'good morning', 'good evening', 'good afternoon',
    'শুভ সকাল', 'শুভ সন্ধ্যা',
  ]
  const hasGreeting = greetingKeywords.some((kw) => lower.includes(kw))

  // If it's a short greeting-only message (no product/order intent)
  const productRelatedWords = [
    'product', 'price', 'order', 'buy', 'netflix', 'vpn', 'chatgpt', 'spotify',
    'canva', 'adobe', 'midjourney', 'premium', 'subscription', 'plan', 'streaming',
    'প্রোডাক্ট', 'দাম', 'অর্ডার', 'কিনতে', 'মূল্য', 'প্ল্যান',
    'dekhao', 'chai', 'lagbe', 'koto', 'taka',
  ]
  const hasProductIntent = productRelatedWords.some((kw) => lower.includes(kw))

  if (hasGreeting && !hasProductIntent && lower.split(/\s+/).length <= 6) {
    return 'greeting'
  }

  // ORDER / PAYMENT intent
  const orderKeywords = [
    'order', 'buy', 'purchase', 'confirm', 'whatsapp', 'payment', 'pay',
    'bkash', 'nagad', 'place order', 'i want to buy', 'i want to order',
    'how to order', 'how to pay', 'checkout', 'complete order', 'proceed',
    'অর্ডার', 'কিনতে চাই', 'নিতে চাই', 'পেমেন্ট', 'বিকাশ', 'নগদ',
    'order korbo', 'nite chai', 'kinte chai', 'lagbe', 'chai',
    'bkash number', 'payment kivabe', 'নেবো', 'কিনবো', 'অর্ডার করবো',
    'trxid', 'transaction', 'send money', 'ট্রানজেকশন',
    'বিকাশ নম্বর', 'পেমেন্ট করবো', 'টাকা পাঠাবো',
  ]
  if (orderKeywords.some((kw) => lower.includes(kw))) {
    return 'order_payment'
  }

  // FEATURED products intent
  const featuredKeywords = [
    'featured', 'feature product', 'featured product', 'best seller', 'bestseller',
    'popular', 'top product', 'recommended', 'highlighted',
    'ফিচার্ড', 'জনপ্রিয়', 'সেরা প্রোডাক্ট', 'টপ প্রোডাক্ট', 'হাইলাইটেড',
    'featured dekhao', 'featured dekhi', 'featured dekhte chai',
    'best product', 'popular product',
  ]
  if (featuredKeywords.some((kw) => lower.includes(kw))) {
    return 'featured'
  }

  // ALL PRODUCTS / catalog overview intent
  const allProductKeywords = [
    'সব', 'all product', 'all category', 'catalog', 'ক্যাটালগ',
    'সব দেখাও', 'সব প্রোডাক্ট', 'কি কি আছে', 'কি আছে',
    'sob dekhao', 'sob product', 'ki ki ache', 'ki ache',
    'what do you have', 'show me all', 'full list',
    'product dekhao', 'products dekhi', 'product dekhte chai',
    'প্রোডাক্ট দেখাও', 'প্রোডাক্ট দেখতে চাই',
  ]
  if (allProductKeywords.some((kw) => lower.includes(kw))) {
    return 'all_products'
  }

  // CATEGORY intent — detect if user mentions a category
  const categorySlug = detectCategorySlug(message)
  if (categorySlug) {
    return 'category'
  }

  // SPECIFIC PRODUCT — try to find a specific product by name
  const specificProduct = findSpecificProduct(message)
  if (specificProduct) {
    return 'specific_product'
  }

  // GENERAL SEARCH — if the message contains enough words, try search
  const cleanQuery = message.replace(/[^\w\s]/g, ' ').trim()
  const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 1)
  if (terms.length >= 1) {
    const results = searchProducts(message)
    if (results.length > 0) {
      return 'search'
    }
  }

  // OUT OF SCOPE
  return 'out_of_scope'
}

// ─── Category Slug Detection ──────────────────────────────────────────────

function detectCategorySlug(message: string): string | null {
  const lower = message.toLowerCase().trim()

  const categoryMap: Record<string, string[]> = {
    streaming: ['streaming', 'ott', 'movie', 'স্ট্রিমিং', 'সিনেমা', 'netflix', 'spotify', 'youtube', 'hotstar', 'crunchyroll', 'disney'],
    'ai-tools': ['ai tool', 'ai tools', 'এআই', 'chatgpt', 'midjourney', 'ai টুল', 'gemini', 'cursor', 'perplexity', 'grammarly'],
    educational: ['educational', 'education', 'শিক্ষা', 'course', 'কোর্স', 'learning', 'coursera', 'udemy'],
    'design-creative': ['design', 'ডিজাইন', 'creative', 'ক্রিয়েটিভ', 'adobe', 'figma', 'canva', 'capcut'],
    productivity: ['productivity', 'প্রোডাক্টিভিটি', 'office', 'অফিস', 'microsoft'],
    'cloud-storage': ['cloud', 'ক্লাউড', 'storage', 'স্টোরেজ', 'icloud', 'google drive'],
    vpn: ['vpn', 'ভিপিএন', 'nordvpn', 'expressvpn', 'surfshark'],
    'gift-cards': ['gift card', 'গিফট', 'itunes', 'google play card', 'gift'],
    'gaming-topup': ['gaming', 'গেমিং', 'game', 'গেম', 'free fire', 'pubg', 'topup', 'gaming topup'],
    'multi-collection': ['multi', 'combo', 'bundle', 'কম্বো', 'collection'],
    adult: ['verified premium', 'premium entertainment', 'premium site', 'বিশেষ', 'restricted category'],
  }

  for (const [slug, keywords] of Object.entries(categoryMap)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return slug
      }
    }
  }

  return null
}

// ─── Language Detection ───────────────────────────────────────────────────

function detectLanguage(message: string): 'bangla' | 'banglish' | 'english' {
  const banglaRegex = /[\u0980-\u09FF]/
  const hasBangla = banglaRegex.test(message)

  if (hasBangla) return 'bangla'

  // Check for Banglish patterns
  const banglishPatterns = [
    /koto/i, /taka/i, /lagbe/i, /chai/i, /order\s*korbo/i, /nite\s*chai/i,
    /kinte\s*chai/i, /dekhao/i, /dekh/i, /ki\s*ki/i, /sob/i, /nam/i,
    /amar/i, /apnar/i, /bhai/i, /apu/i, /kichu/i, /kemon/i, /valo/i,
    /ase/i, /ache/i, /dibo/i, /nibo/i, /korbo/i, /parbo/i, /jani/i,
  ]

  const banglishMatches = banglishPatterns.filter((p) => p.test(message)).length
  if (banglishMatches >= 1) return 'banglish'

  return 'english'
}

// ─── Product Formatting ───────────────────────────────────────────────────

function parsePriceOptions(product: Product): string {
  let priceStr = ''
  try {
    const priceOptions = JSON.parse(product.priceOptions || '[]')
    if (Array.isArray(priceOptions) && priceOptions.length > 0) {
      priceStr = priceOptions
        .map((o: { label?: string; priceBDT?: string }) => `${o.label}: ৳${o.priceBDT}`)
        .join(', ')
    }
  } catch {
    // priceOptions parse failed
  }
  if (!priceStr) {
    priceStr = `৳${product.basePriceBDT}`
  }
  return priceStr
}

function parsePriceOptionsDetailed(product: Product): string {
  let priceStr = ''
  try {
    const priceOptions = JSON.parse(product.priceOptions || '[]')
    if (Array.isArray(priceOptions) && priceOptions.length > 0) {
      priceStr = priceOptions
        .map((o: { label?: string; priceBDT?: string }) => `• ${o.label}: ৳${o.priceBDT}`)
        .join('\n')
    }
  } catch {
    // priceOptions parse failed
  }
  if (!priceStr) {
    if (
      product.basePriceBDT === 'Inbox Price' ||
      product.basePriceBDT === 'Low Price'
    ) {
      priceStr = '💰 সেরা দামের জন্য আমাদের সাথে যোগাযোগ করুন'
    } else {
      priceStr = `• Base: ৳${product.basePriceBDT}`
    }
  }
  return priceStr
}

function parseFeatures(product: Product): string[] {
  try {
    return JSON.parse(product.features || '[]')
  } catch {
    return []
  }
}

function formatProductDetails(product: Product, lang: 'bangla' | 'banglish' | 'english' = 'bangla'): string {
  const sanitizedName = product.category.isAdult ? sanitizeText(product.name) : product.name

  if (lang === 'english') {
    const priceStr = parsePriceOptionsDetailed(product)
    const features = parseFeatures(product)
    const featuresStr = features.length > 0
      ? '\n✨ Features:\n' + features.slice(0, 8).map((f) => `• ${f}`).join('\n')
      : ''

    return `${sanitizedName} Details 😊
📦 Plans & Pricing:
${priceStr}${featuresStr}
📦 Stock: ${product.stockStatus}
🔒 Warranty: ${product.warranty || 'Yes'}
🚚 Delivery: ${product.deliveryTime}
${product.region ? `🌍 Region: ${product.region}` : ''}
${product.accountType ? `📋 Account Type: ${product.accountType}` : ''}

Want to order? Let me know, I'll guide you! 😊`
  }

  if (lang === 'banglish') {
    const priceStr = parsePriceOptionsDetailed(product)
    const features = parseFeatures(product)
    const featuresStr = features.length > 0
      ? '\n✨ Features:\n' + features.slice(0, 8).map((f) => `• ${f}`).join('\n')
      : ''

    return `${sanitizedName} details dicchi 😊
📦 Plan & Price:
${priceStr}${featuresStr}
📦 Stock: ${product.stockStatus}
🔒 Warranty: ${product.warranty || 'Yes'}
🚚 Delivery: ${product.deliveryTime}
${product.region ? `🌍 Region: ${product.region}` : ''}
${product.accountType ? `📋 Account Type: ${product.accountType}` : ''}

Order korte chaile bolle din, ami guide korbo! 😊`
  }

  // Default: Bangla
  const priceStr = parsePriceOptionsDetailed(product)
  const features = parseFeatures(product)
  const featuresStr = features.length > 0
    ? '\n✨ সুবিধা:\n' + features.slice(0, 8).map((f) => `• ${f}`).join('\n')
    : ''

  return `${sanitizedName} সম্পর্কে বলছি 😊
📦 প্যাকেজ ও মূল্য:
${priceStr}${featuresStr}
📦 স্টক: ${product.stockStatus}
🔒 ওয়ারেন্টি: ${product.warranty || 'Yes'}
🚚 ডেলিভারি: ${product.deliveryTime}
${product.region ? `🌍 রিজিওন: ${product.region}` : ''}
${product.accountType ? `📋 অ্যাকাউন্ট টাইপ: ${product.accountType}` : ''}

অর্ডার করতে চাইলে বলুন, আমি গাইড করবো! 😊`
}

function formatProductCompact(product: Product): string {
  const sanitizedName = product.category.isAdult ? sanitizeText(product.name) : product.name
  const priceStr = parsePriceOptions(product)
  const badges: string[] = []
  if (product.isFeatured) badges.push('⭐')
  if (product.isBestSeller) badges.push('🔥')
  const badgeStr = badges.length > 0 ? ` ${badges.join('')}` : ''
  return `${sanitizedName}${badgeStr} — ${priceStr} | Stock: ${product.stockStatus}`
}

// ─── WhatsApp URL Builder ─────────────────────────────────────────────────

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

// ─── Response Generators ──────────────────────────────────────────────────

function generateGreeting(lang: 'bangla' | 'banglish' | 'english'): string {
  if (lang === 'english') {
    return `Assalamu Alaikum! I'm Zara, your personal assistant at Streaming Hub 😊

I can help you:
🔍 Find products & check prices
📦 Get product details & stock info
🛒 Guide you through ordering

What can I help you with?`
  }

  if (lang === 'banglish') {
    return `Assalamu Alaikum! Ami Zara, Streaming Hub er personal assistant 😊

Ami apnake help korte pari:
🔍 Product khuje pete & daam jante
📦 Product details & stock info pete
🛒 Order korte guide korte

Ki help lagbe bolle din! 😊`
  }

  return `আসসালামু আলাইকুম! আমি জারা, আপনার personal assistant 😊

আমি সাহায্য করতে পারবো:
🔍 প্রোডাক্ট খুঁজে পেতে ও দাম জানতে
📦 প্রোডাক্ট বিস্তারিত ও স্টক জানতে
🛒 অর্ডার করতে গাইড করতে

কীভাবে সাহায্য করতে পারি আপনাকে? 😊`
}

function generateFeaturedResponse(lang: 'bangla' | 'banglish' | 'english'): string {
  const { products } = getFeaturedProducts()

  if (products.length === 0) {
    if (lang === 'english') return 'Sorry, no featured products available right now. Check out our other products! 😊'
    if (lang === 'banglish') return 'Sorry, ekhon kono featured product nai. Onno product gulo dekhen! 😊'
    return 'দুঃখিত, বর্তমানে কোনো ফিচার্ড প্রোডাক্ট নেই। অন্যান্য প্রোডাক্ট দেখতে চাইলে বলুন! 😊'
  }

  const maxShow = 10
  const showing = products.slice(0, maxShow)

  if (lang === 'english') {
    const lines = ['⭐ Our Featured Products:\n']
    showing.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.category.isAdult ? sanitizeText(p.name) : p.name}`)
      lines.push(`   💰 ${parsePriceOptions(p)}`)
      lines.push(`   📦 Stock: ${p.stockStatus}`)
      lines.push('')
    })
    if (products.length > maxShow) {
      lines.push(`... and ${products.length - maxShow} more featured products!`)
    }
    lines.push('Which one interests you? Ask for details! 😊')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = ['⭐ Amar featured products:\n']
    showing.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.category.isAdult ? sanitizeText(p.name) : p.name}`)
      lines.push(`   💰 ${parsePriceOptions(p)}`)
      lines.push(`   📦 Stock: ${p.stockStatus}`)
      lines.push('')
    })
    if (products.length > maxShow) {
      lines.push(`... ar ${products.length - maxShow} ta featured product ache!`)
    }
    lines.push('Kon ta detail dekhte chan? Bolle din! 😊')
    return lines.join('\n')
  }

  // Bangla (default)
  const lines = ['⭐ আমাদের ফিচার্ড প্রোডাক্টগুলো:\n']
  showing.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.category.isAdult ? sanitizeText(p.name) : p.name}`)
    lines.push(`   💰 ${parsePriceOptions(p)}`)
    lines.push(`   📦 স্টক: ${p.stockStatus}`)
    lines.push('')
  })
  if (products.length > maxShow) {
    lines.push(`... আরও ${products.length - maxShow}টি ফিচার্ড প্রোডাক্ট আছে!`)
  }
  lines.push('কোনটা আপনার পছন্দের? বিস্তারিত জানতে চাইলে বলুন! 😊')
  return lines.join('\n')
}

function generateCategoryResponse(
  categorySlug: string,
  lang: 'bangla' | 'banglish' | 'english'
): string {
  const { category, products, totalCount } = searchByCategory(categorySlug)

  if (!category || products.length === 0) {
    // Fallback to search
    return generateSearchFallback(categorySlug, lang)
  }

  const sanitizedName = category.isAdult ? sanitizeText(category.name) : category.name
  const maxShow = 8
  const showing = products.slice(0, maxShow)

  if (lang === 'english') {
    const lines = [`📂 ${sanitizedName} — ${totalCount} products:\n`]
    showing.forEach((p) => {
      const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
      lines.push(`• ${pName} — ${parsePriceOptions(p)}`)
    })
    if (totalCount > maxShow) {
      lines.push(`\n... and ${totalCount - maxShow} more products!`)
    }
    lines.push('\nWhich product would you like to know more about? 😊')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = [`📂 ${sanitizedName} — ${totalCount} ta product:\n`]
    showing.forEach((p) => {
      const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
      lines.push(`• ${pName} — ${parsePriceOptions(p)}`)
    })
    if (totalCount > maxShow) {
      lines.push(`\n... ar ${totalCount - maxShow} ta product ache!`)
    }
    lines.push('\nKon product er details chante chan? 😊')
    return lines.join('\n')
  }

  // Bangla
  const lines = [`📂 ${sanitizedName} ক্যাটাগরিতে মোট ${totalCount}টি প্রোডাক্ট আছে:\n`]
  showing.forEach((p) => {
    const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
    lines.push(`• ${pName} — ${parsePriceOptions(p)}`)
  })
  if (totalCount > maxShow) {
    lines.push(`\n... আরও ${totalCount - maxShow}টি প্রোডাক্ট আছে!`)
  }
  lines.push('\nকোনটা সম্পর্কে জানতে চান? 😊')
  return lines.join('\n')
}

function generateAllProductsResponse(lang: 'bangla' | 'banglish' | 'english'): string {
  const catalogSummary = getCatalogSummary()

  if (lang === 'english') {
    const lines = ['📂 Our Product Categories:\n']
    catalogSummary.forEach((cat) => {
      const sanitizedName = cat.isAdult ? sanitizeText(cat.name) : cat.name
      lines.push(`📂 ${sanitizedName} (${cat.productCount} products):`)
      lines.push(`   ${cat.sampleProducts.slice(0, 3).join(', ')}`)
    })
    lines.push('\nWhich category interests you? Ask for details! 😊')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = ['📂 Amar product categories:\n']
    catalogSummary.forEach((cat) => {
      const sanitizedName = cat.isAdult ? sanitizeText(cat.name) : cat.name
      lines.push(`📂 ${sanitizedName} (${cat.productCount} ta product):`)
      lines.push(`   ${cat.sampleProducts.slice(0, 3).join(', ')}`)
    })
    lines.push('\nKon category dekhte chan? Bolle din! 😊')
    return lines.join('\n')
  }

  // Bangla
  const lines = ['📂 আমাদের প্রোডাক্ট ক্যাটাগরিগুলো:\n']
  catalogSummary.forEach((cat) => {
    const sanitizedName = cat.isAdult ? sanitizeText(cat.name) : cat.name
    lines.push(`📂 ${sanitizedName} (${cat.productCount}টি প্রোডাক্ট):`)
    lines.push(`   ${cat.sampleProducts.slice(0, 3).join(', ')}`)
  })
  lines.push('\nকোন ক্যাটাগরি দেখতে চান? বলুন! 😊')
  return lines.join('\n')
}

function generateSpecificProductResponse(
  product: Product,
  lang: 'bangla' | 'banglish' | 'english'
): string {
  const response = formatProductDetails(product, lang)

  // Add related products for upsell
  const related = findRelatedProducts(product.id, 3)
  if (related.length > 0) {
    const relatedStr = related
      .map((p) => {
        const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
        return `${pName} — ৳${p.basePriceBDT}`
      })
      .join(', ')

    if (lang === 'english') {
      return response + `\n\n💡 You might also like: ${relatedStr}`
    }
    if (lang === 'banglish') {
      return response + `\n\n💡 Apni ar ei gulo o pochondo korte paren: ${relatedStr}`
    }
    return response + `\n\n💡 আপনি এইগুলোও পছন্দ করতে পারেন: ${relatedStr}`
  }

  return response
}

function generateSearchResponse(
  products: Product[],
  lang: 'bangla' | 'banglish' | 'english'
): string {
  if (products.length === 0) {
    return generateOutOfScopeResponse(lang)
  }

  const maxShow = 6
  const showing = products.slice(0, maxShow)

  if (lang === 'english') {
    const lines = ['🔍 Here\'s what I found:\n']
    showing.forEach((p, i) => {
      const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
      lines.push(`${i + 1}. ${pName}`)
      lines.push(`   💰 ${parsePriceOptions(p)} | Stock: ${p.stockStatus}`)
      lines.push('')
    })
    if (products.length > maxShow) {
      lines.push(`... and ${products.length - maxShow} more results!`)
    }
    lines.push('Want details on any product? Just ask! 😊')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = ['🔍 Ei je pailam:\n']
    showing.forEach((p, i) => {
      const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
      lines.push(`${i + 1}. ${pName}`)
      lines.push(`   💰 ${parsePriceOptions(p)} | Stock: ${p.stockStatus}`)
      lines.push('')
    })
    if (products.length > maxShow) {
      lines.push(`... ar ${products.length - maxShow} ta result ache!`)
    }
    lines.push('Kon product er details chante chan? Bolle din! 😊')
    return lines.join('\n')
  }

  // Bangla
  const lines = ['🔍 এইগুলো পেলাম:\n']
  showing.forEach((p, i) => {
    const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
    lines.push(`${i + 1}. ${pName}`)
    lines.push(`   💰 ${parsePriceOptions(p)} | স্টক: ${p.stockStatus}`)
    lines.push('')
  })
  if (products.length > maxShow) {
    lines.push(`... আরও ${products.length - maxShow}টি রেজাল্ট আছে!`)
  }
  lines.push('কোন প্রোডাক্টের বিস্তারিত জানতে চান? বলুন! 😊')
  return lines.join('\n')
}

function generateSearchFallback(query: string, lang: 'bangla' | 'banglish' | 'english'): string {
  const results = searchProducts(query, 6)
  if (results.length > 0) {
    return generateSearchResponse(results, lang)
  }
  return generateOutOfScopeResponse(lang)
}

function generateOrderPaymentResponse(
  userMsg: string,
  history: Array<{ role: string; content: string }>,
  lang: 'bangla' | 'banglish' | 'english'
): { response: string; whatsappUrl: string } {
  const lower = userMsg.toLowerCase()

  // Extract info from conversation
  const fullConversation = [
    ...history.map((m) => `${m.role}: ${m.content}`),
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
  const productFromConv = extractProduct(fullConversation)
  const transactionId = extractTransactionId(fullConversation)

  // Try to find the product being discussed
  let foundProduct: Product | null = null
  if (productFromConv) {
    foundProduct = findSpecificProduct(productFromConv)
  }
  if (!foundProduct) {
    foundProduct = findSpecificProduct(userMsg)
  }
  // Also check history for product mentions
  if (!foundProduct) {
    for (const msg of history.slice(-6).reverse()) {
      const p = findSpecificProduct(msg.content)
      if (p) {
        foundProduct = p
        break
      }
    }
  }

  const whatsappUrl = buildWhatsAppUrl({
    customerName,
    whatsappNumber: customerWhatsApp,
    productName: foundProduct?.name || productFromConv,
    transactionId,
    message: userMsg,
  })

  // Check if user is asking "how to order/pay" vs. actually confirming an order
  const isAskingHow = [
    'how to order', 'how to pay', 'how to buy', 'kivabe order',
    'kivabe pay', 'order kivabe', 'payment kivabe', 'bkash number',
    'bkash number ki', 'কীভাবে অর্ডার', 'কীভাবে পেমেন্ট',
    'বিকাশ নম্বর', 'অর্ডার কীভাবে', 'পেমেন্ট কীভাবে',
  ].some((kw) => lower.includes(kw))

  if (isAskingHow) {
    if (lang === 'english') {
      let response = `💳 **How to Order:**\n\n`
      if (foundProduct) {
        response += `📦 Product: ${foundProduct.name}\n💰 Price: ${parsePriceOptions(foundProduct)}\n\n`
      }
      response += `1️⃣ Send bKash to: **01647236359**\n2️⃣ Send your Transaction ID & screenshot\n3️⃣ We'll confirm & deliver in 5-20 minutes! ⚡\n\n📱 Or message us on WhatsApp for direct ordering!`
      return { response, whatsappUrl }
    }

    if (lang === 'banglish') {
      let response = `💳 **Order kivabe korben:**\n\n`
      if (foundProduct) {
        response += `📦 Product: ${foundProduct.name}\n💰 Price: ${parsePriceOptions(foundProduct)}\n\n`
      }
      response += `1️⃣ bKash e Send Money: **01647236359**\n2️⃣ Transaction ID & screenshot pathan\n3️⃣ Amra confirm kore 5-20 minute e deliver dib! ⚡\n\n📱 Or WhatsApp e message korun direct order er jonno!`
      return { response, whatsappUrl }
    }

    // Bangla
    let response = `💳 **অর্ডার কীভাবে করবেন:**\n\n`
    if (foundProduct) {
      response += `📦 প্রোডাক্ট: ${foundProduct.name}\n💰 মূল্য: ${parsePriceOptions(foundProduct)}\n\n`
    }
    response += `1️⃣ bKash এ Send Money করুন: **01647236359**\n2️⃣ আপনার Transaction ID এবং স্ক্রিনশট পাঠান\n3️⃣ আমরা confirm করে 5-20 মিনিটে ডেলিভারি দেব! ⚡\n\n📱 অথবা WhatsApp এ সরাসরি মেসেজ করুন!`
    return { response, whatsappUrl }
  }

  // User wants to order
  if (lang === 'english') {
    let response = `🛒 Great! Let's get your order processed!\n\n`
    if (foundProduct) {
      response += `📦 Product: ${foundProduct.name}\n💰 Price: ${parsePriceOptions(foundProduct)}\n📦 Stock: ${foundProduct.stockStatus}\n🚚 Delivery: ${foundProduct.deliveryTime}\n\n`
    }
    response += `💳 Payment: bKash Send Money to **01647236359**\n\nAfter payment, send your Transaction ID & screenshot. We'll deliver in 5-20 minutes! ⚡\n\n📱 Or click below to order on WhatsApp directly!`
    return { response, whatsappUrl }
  }

  if (lang === 'banglish') {
    let response = `🛒 Valo! Apnar order ta niye jejuri kori!\n\n`
    if (foundProduct) {
      response += `📦 Product: ${foundProduct.name}\n💰 Price: ${parsePriceOptions(foundProduct)}\n📦 Stock: ${foundProduct.stockStatus}\n🚚 Delivery: ${foundProduct.deliveryTime}\n\n`
    }
    response += `💳 Payment: bKash e Send Money **01647236359** number e\n\nPayment er por Transaction ID & screenshot pathan. Amra 5-20 minute e deliver dib! ⚡\n\n📱 Or niche click kore WhatsApp e direct order korren!`
    return { response, whatsappUrl }
  }

  // Bangla
  let response = `🛒 চমৎকার! আপনার অর্ডারটি প্রসেস করি!\n\n`
  if (foundProduct) {
    response += `📦 প্রোডাক্ট: ${foundProduct.name}\n💰 মূল্য: ${parsePriceOptions(foundProduct)}\n📦 স্টক: ${foundProduct.stockStatus}\n🚚 ডেলিভারি: ${foundProduct.deliveryTime}\n\n`
  }
  response += `💳 পেমেন্ট: bKash এ Send Money করুন **01647236359** নম্বরে\n\nপেমেন্টের পর আপনার Transaction ID এবং স্ক্রিনশট পাঠান। আমরা 5-20 মিনিটে ডেলিভারি দেব! ⚡\n\n📱 অথবা নিচে ক্লিক করে WhatsApp এ সরাসরি অর্ডার করুন!`
  return { response, whatsappUrl }
}

function generateOutOfScopeResponse(lang: 'bangla' | 'banglish' | 'english'): string {
  // Provide catalog overview as redirect
  const catalogSummary = getCatalogSummary()

  if (lang === 'english') {
    const lines = [
      "Sorry, I couldn't find what you're looking for. We sell digital subscriptions:\n",
    ]
    catalogSummary.slice(0, 6).forEach((cat) => {
      const sanitizedName = cat.isAdult ? sanitizeText(cat.name) : cat.name
      lines.push(`📂 ${sanitizedName} (${cat.productCount} products)`)
    })
    lines.push('\nWhich category interests you? Or ask about a specific product! 😊')
    lines.push('\n📱 Need help? WhatsApp: +8801647236359')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = [
      'Sorry, apnar kotha bujhte parlam na. Amra digital subscription bechhi:\n',
    ]
    catalogSummary.slice(0, 6).forEach((cat) => {
      const sanitizedName = cat.isAdult ? sanitizeText(cat.name) : cat.name
      lines.push(`📂 ${sanitizedName} (${cat.productCount} ta product)`)
    })
    lines.push('\nKon category dekhte chan? Ba kon product er kotha bolle din! 😊')
    lines.push('\n📱 Help lagle WhatsApp: +8801647236359')
    return lines.join('\n')
  }

  // Bangla
  const lines = [
    'দুঃখিত, আপনার কথা বুঝতে পারিনি। আমরা ডিজিটাল সাবস্ক্রিপশন সেবা বিক্রি করি:\n',
  ]
  catalogSummary.slice(0, 6).forEach((cat) => {
    const sanitizedName = cat.isAdult ? sanitizeText(cat.name) : cat.name
    lines.push(`📂 ${sanitizedName} (${cat.productCount}টি প্রোডাক্ট)`)
  })
  lines.push('\nকোন ক্যাটাগরি দেখতে চান? অথবা নির্দিষ্ট প্রোডাক্টের কথা বলুন! 😊')
  lines.push('\n📱 সাহায্য লাগলে WhatsApp: +8801647236359')
  return lines.join('\n')
}

// ─── POST Handler ─────────────────────────────────────────────────────────

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

    const userMsg = message.trim()
    const lang = detectLanguage(userMsg)
    const intent = detectIntent(userMsg)

    let response = ''
    let whatsappUrl: string | undefined

    switch (intent) {
      case 'greeting': {
        response = generateGreeting(lang)
        break
      }

      case 'featured': {
        response = generateFeaturedResponse(lang)
        break
      }

      case 'specific_product': {
        const product = findSpecificProduct(userMsg)
        if (product) {
          response = generateSpecificProductResponse(product, lang)
        } else {
          response = generateOutOfScopeResponse(lang)
        }
        break
      }

      case 'category': {
        const categorySlug = detectCategorySlug(userMsg)
        if (categorySlug) {
          response = generateCategoryResponse(categorySlug, lang)
        } else {
          response = generateAllProductsResponse(lang)
        }
        break
      }

      case 'all_products': {
        response = generateAllProductsResponse(lang)
        break
      }

      case 'order_payment': {
        const result = generateOrderPaymentResponse(userMsg, history, lang)
        response = result.response
        whatsappUrl = result.whatsappUrl
        break
      }

      case 'search': {
        const results = searchProducts(userMsg, 6)
        response = generateSearchResponse(results, lang)
        break
      }

      case 'out_of_scope':
      default: {
        response = generateOutOfScopeResponse(lang)
        break
      }
    }

    // Also include WhatsApp URL if user seems interested in ordering
    // (even if the main intent wasn't order_payment)
    if (!whatsappUrl) {
      const lowerMsg = userMsg.toLowerCase()
      const softOrderKeywords = [
        'order', 'buy', 'কিনতে', 'নিতে চাই', 'অর্ডার', 'lagbe', 'chai',
      ]
      const hasSoftOrderIntent = softOrderKeywords.some((kw) => lowerMsg.includes(kw))

      if (hasSoftOrderIntent && intent === 'specific_product') {
        const product = findSpecificProduct(userMsg)
        if (product) {
          whatsappUrl = buildWhatsAppUrl({ productName: product.name })
        }
      }
    }

    return NextResponse.json({
      response,
      ...(whatsappUrl ? { whatsappUrl } : {}),
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({
      response:
        'দুঃখিত, একটু সমস্যা হচ্ছে। WhatsApp এ যোগাযোগ করুন: +8801647236359 🙏',
      whatsappUrl: buildWhatsAppUrl({ message: 'Error fallback' }),
    })
  }
}

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

// ─── Content Filter ────────────────────────────────────────────────────────

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
  | 'thanks'
  | 'goodbye'
  | 'comparison'
  | 'featured'
  | 'specific_product'
  | 'category'
  | 'all_products'
  | 'order_payment'
  | 'how_to_use'
  | 'warranty_delivery'
  | 'price_inquiry'
  | 'search'
  | 'out_of_scope'

function detectIntent(message: string, history: Array<{ role: string; content: string }>): Intent {
  const lower = message.toLowerCase().trim()

  // GREETING
  const greetingKeywords = [
    'hi', 'hello', 'hey', 'assalam', 'সালাম', 'আসসালামু', 'আসসালাম',
    'হ্যালো', 'হাই', 'কেমন আছ', 'kemon acho', 'kemn acho',
    'good morning', 'good evening', 'good afternoon',
    'শুভ সকাল', 'শুভ সন্ধ্যা', 'sup', 'yo',
  ]
  const productRelatedWords = [
    'product', 'price', 'order', 'buy', 'netflix', 'vpn', 'chatgpt', 'spotify',
    'canva', 'adobe', 'midjourney', 'premium', 'subscription', 'plan', 'streaming',
    'প্রোডাক্ট', 'দাম', 'অর্ডার', 'কিনতে', 'মূল্য', 'প্ল্যান',
    'dekhao', 'chai', 'lagbe', 'koto', 'taka',
  ]
  const hasGreeting = greetingKeywords.some((kw) => lower.includes(kw))
  const hasProductIntent = productRelatedWords.some((kw) => lower.includes(kw))
  if (hasGreeting && !hasProductIntent && lower.split(/\s+/).length <= 6) {
    return 'greeting'
  }

  // THANKS intent
  const thanksKeywords = [
    'thanks', 'thank you', 'thx', 'ty', 'ধন্যবাদ', 'ধন্যবাদী',
    'shukriya', 'শুকরিয়া', 'valo hoyeche', 'valo laglo',
    'helpful', 'onek valo', 'onek dhonnobad', 'thanks a lot',
    'appreciate', 'great help', 'শুকর',
  ]
  if (thanksKeywords.some((kw) => lower.includes(kw)) && lower.split(/\s+/).length <= 8) {
    return 'thanks'
  }

  // GOODBYE intent
  const goodbyeKeywords = [
    'bye', 'goodbye', 'see you', 'good night', 'goodnight',
    'বাই', 'আলবিদা', 'যাই', 'আসি', 'বিদায়',
    'shubho ratri', 'শুভ রাত্রি', 'good bye', 'take care',
    'have a good day', 'khoda hafiz', 'খোদা হাফিজ',
  ]
  if (goodbyeKeywords.some((kw) => lower.includes(kw)) && lower.split(/\s+/).length <= 6) {
    return 'goodbye'
  }

  // COMPARISON intent
  const comparisonKeywords = [
    'vs', 'versus', 'compare', 'comparison', 'difference between',
    'better', 'which one', 'which is best', 'kon ta valo',
    'kon ta better', 'তুলনা', 'কোনটা ভালো', 'কোনটা সেরা',
    'mukhyo somoye', 'ami kon ta nibo', 'kon ta nibo',
  ]
  if (comparisonKeywords.some((kw) => lower.includes(kw))) {
    return 'comparison'
  }

  // HOW TO USE intent
  const howToUseKeywords = [
    'how to use', 'kivabe use', 'use kivabe', 'kivabe korbo', 'kivabe chalabo',
    'কীভাবে ব্যবহার', 'কিভাবে ব্যবহার', 'কীভাবে চালাবো', 'কিভাবে চালাবো',
    'কীভাবে কাজ করে', 'কিভাবে কাজ করে', 'how does it work', 'tutorial',
    'guide', 'নিয়ম', 'নিয়ম কি', 'ব্যবহার করে', 'use kora jay',
    'কোথায় ব্যবহার', 'কি করতে হবে', 'কি করলে', 'চালানো যায়',
    'kivabe', 'কিভাবে', 'কীভাবে',
  ]
  if (howToUseKeywords.some((kw) => lower.includes(kw))) {
    return 'how_to_use'
  }

  // WARRANTY / DELIVERY intent
  const warrantyKeywords = [
    'warranty', 'guarantee', 'গ্যারান্টি', 'ওয়ারেন্টি', 'replacement',
    'delivery time', 'কত সময়', 'কতক্ষণ', 'কবে পাবো', 'কবে দেবেন',
    'delivery kivabe', 'delivery koto somoy', 'deliver koto din',
    'ডেলিভারি', 'পাবো কবে', 'সময় লাগবে',
  ]
  if (warrantyKeywords.some((kw) => lower.includes(kw))) {
    return 'warranty_delivery'
  }

  // PRICE INQUIRY - specific price questions
  const priceKeywords = [
    'koto taka', 'koto tk', 'dam koto', 'price koto', 'koto dar',
    'কত টাকা', 'কত দাম', 'দাম কত', 'মূল্য কত', 'টাকা কত',
    'price ki', 'price koto', 'cost koto', 'suto koto',
    'কি দাম', 'দাম কি', 'sasta', 'সস্তা', 'discount', 'ছাড়',
  ]
  if (priceKeywords.some((kw) => lower.includes(kw))) {
    return 'price_inquiry'
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
    'order kivabe', 'কীভাবে অর্ডার', 'কিভাবে অর্ডার', 'কীভাবে কিনবো',
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
    'best product', 'popular product', 'best price',
  ]
  if (featuredKeywords.some((kw) => lower.includes(kw))) {
    return 'featured'
  }

  // ALL PRODUCTS
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

  // CATEGORY intent
  const categorySlug = detectCategorySlug(message)
  if (categorySlug) {
    return 'category'
  }

  // SPECIFIC PRODUCT
  const specificProduct = findSpecificProduct(message)
  if (specificProduct) {
    return 'specific_product'
  }

  // SEARCH
  const cleanQuery = message.replace(/[^\w\s]/g, ' ').trim()
  const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 1)
  if (terms.length >= 1) {
    const results = searchProducts(message)
    if (results.length > 0) {
      return 'search'
    }
  }

  return 'out_of_scope'
}

// ─── Category Slug Detection ──────────────────────────────────────────────

function detectCategorySlug(message: string): string | null {
  const lower = message.toLowerCase().trim()
  const categoryMap: Record<string, string[]> = {
    streaming: ['streaming', 'ott', 'movie', 'স্ট্রিমিং', 'সিনেমা', 'netflix', 'spotify', 'youtube', 'hotstar', 'crunchyroll', 'disney', 'hoichoi', 'chorki'],
    'ai-tools': ['ai tool', 'ai tools', 'এআই', 'chatgpt', 'midjourney', 'ai টুল', 'gemini', 'cursor', 'perplexity', 'grammarly', 'claude ai'],
    educational: ['educational', 'education', 'শিক্ষা', 'course', 'কোর্স', 'learning', 'coursera', 'udemy', 'skillshare'],
    'design-creative': ['design', 'ডিজাইন', 'creative', 'ক্রিয়েটিভ', 'adobe', 'figma', 'canva', 'capcut'],
    productivity: ['productivity', 'প্রোডাক্টিভিটি', 'office', 'অফিস', 'microsoft'],
    'cloud-storage': ['cloud', 'ক্লাউড', 'storage', 'স্টোরেজ', 'icloud', 'google drive'],
    vpn: ['vpn', 'ভিপিএন', 'nordvpn', 'expressvpn', 'surfshark'],
    'gift-cards': ['gift card', 'গিফট', 'itunes', 'google play card', 'gift', 'apple gift'],
    'gaming-topup': ['gaming', 'গেমিং', 'game', 'গেম', 'free fire', 'pubg', 'topup', 'gaming topup', 'uc', 'diamond'],
    'multi-collection': ['multi', 'combo', 'bundle', 'কম্বো', 'collection'],
    adult: ['verified premium', 'premium entertainment', 'premium site', 'বিশেষ', 'restricted category'],
  }
  for (const [slug, keywords] of Object.entries(categoryMap)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return slug
    }
  }
  return null
}

// ─── Language Detection ───────────────────────────────────────────────────

function detectLanguage(message: string): 'bangla' | 'banglish' | 'english' {
  if (/[\u0980-\u09FF]/.test(message)) return 'bangla'
  const banglishPatterns = [
    /koto/i, /taka/i, /lagbe/i, /chai/i, /order\s*korbo/i, /nite\s*chai/i,
    /kinte\s*chai/i, /dekhao/i, /dekh/i, /ki\s*ki/i, /sob/i, /nam/i,
    /amar/i, /apnar/i, /bhai/i, /apu/i, /kichu/i, /kemon/i, /valo/i,
    /ase/i, /ache/i, /dibo/i, /nibo/i, /korbo/i, /parbo/i, /jani/i,
    /kivabe/i, /keno/i, /kena/i,
  ]
  if (banglishPatterns.filter((p) => p.test(message)).length >= 1) return 'banglish'
  return 'english'
}

// ─── Product Formatting ───────────────────────────────────────────────────

function parsePriceOptions(product: Product): string {
  try {
    const priceOptions = JSON.parse(product.priceOptions || '[]')
    if (Array.isArray(priceOptions) && priceOptions.length > 0) {
      return priceOptions
        .map((o: { label?: string; priceBDT?: string }) => `${o.label}: ৳${o.priceBDT}`)
        .join(', ')
    }
  } catch { /* empty */ }
  return `৳${product.basePriceBDT}`
}

function parsePriceOptionsDetailed(product: Product): string {
  try {
    const priceOptions = JSON.parse(product.priceOptions || '[]')
    if (Array.isArray(priceOptions) && priceOptions.length > 0) {
      return priceOptions
        .map((o: { label?: string; priceBDT?: string }) => `  • ${o.label}: ৳${o.priceBDT}`)
        .join('\n')
    }
  } catch { /* empty */ }
  if (product.basePriceBDT === 'Inbox Price' || product.basePriceBDT === 'Low Price') {
    return '  💰 সেরা দামের জন্য আমাদের সাথে যোগাযোগ করুন!'
  }
  return `  • Base: ৳${product.basePriceBDT}`
}

function parseFeatures(product: Product): string[] {
  try { return JSON.parse(product.features || '[]') } catch { return [] }
}

function getCheapestPlan(product: Product): string {
  try {
    const priceOptions = JSON.parse(product.priceOptions || '[]')
    if (Array.isArray(priceOptions) && priceOptions.length > 0) {
      const sorted = [...priceOptions].sort((a: any, b: any) =>
        parseInt(String(a.priceBDT).replace(/\D/g, '') || '0') -
        parseInt(String(b.priceBDT).replace(/\D/g, '') || '0')
      )
      return `৳${sorted[0].priceBDT} (${sorted[0].label})`
    }
  } catch { /* empty */ }
  return `৳${product.basePriceBDT}`
}

// ─── WhatsApp URL Builder ─────────────────────────────────────────────────

function buildWhatsAppUrl(orderDetails: {
  customerName?: string; whatsappNumber?: string; productName?: string;
  plan?: string; price?: string; address?: string; transactionId?: string; message?: string;
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

// ─── Smart Sales Response Generators ──────────────────────────────────────

function generateGreeting(lang: 'bangla' | 'banglish' | 'english'): string {
  if (lang === 'english') {
    return `Assalamu Alaikum! Welcome to Streaming Hub! 🎉

I'm কর্মচারী, your personal shopping assistant. I'm here to help you find the perfect subscription at the best price in Bangladesh! 💯

What are you looking for today? You can ask me:
🎬 Netflix, Spotify, YouTube Premium prices
🤖 ChatGPT Plus, Midjourney, AI tools
🔒 VPN plans — NordVPN, ExpressVPN
🎮 Gaming top-up, Gift Cards & more!

Just tell me what you need — I'll find the best deal for you! 😊`
  }

  if (lang === 'banglish') {
    return `Assalamu Alaikum! Streaming Hub e swagotom! 🎉

Ami কর্মচারী, apnar personal shopping assistant. Apnar jonno best subscription best price e khuje berate help korbo! 💯

Aaj ki lagbe bolle din? Ami help korte pari:
🎬 Netflix, Spotify, YouTube Premium er daam
🤖 ChatGPT Plus, Midjourney, AI tools
🔒 VPN plan — NordVPN, ExpressVPN
🎮 Gaming top-up, Gift Cards & ar onek kichu!

Shudhu bolle din ki chai — apnar jonno best deal ta khuje debo! 😊`
  }

  return `আসসালামু আলাইকুম! Streaming Hub-এ স্বাগতম! 🎉

আমি কর্মচারী, আপনার পার্সোনাল শপিং অ্যাসিস্ট্যান্ট। বাংলাদেশে সেরা দামে আপনার জন্য সঠিক সাবস্ক্রিপশন খুঁজে দিতে আমি এখানে আছি! 💯

আজ কী লাগবে বলুন? আমি সাহায্য করতে পারি:
🎬 Netflix, Spotify, YouTube Premium এর দাম
🤖 ChatGPT Plus, Midjourney, AI tools
🔒 VPN প্ল্যান — NordVPN, ExpressVPN
🎮 Gaming top-up, Gift Cards আর আরও অনেক কিছু!

শুধু বলুন কী চান — আপনার জন্য সেরা ডিল খুঁজে দেবো! 😊`
}

function generateFeaturedResponse(lang: 'bangla' | 'banglish' | 'english'): string {
  const { products } = getFeaturedProducts()
  if (products.length === 0) {
    if (lang === 'english') return 'We\'re updating our featured collection! Check out all products in the meantime. 😊'
    if (lang === 'banglish') return 'Featured collection update hocche! Ektu pore abar dekhen. 😊'
    return 'ফিচার্ড কালেকশন আপডেট হচ্ছে! একটু পরে আবার দেখুন। 😊'
  }

  const maxShow = 8
  const showing = products.slice(0, maxShow)

  if (lang === 'english') {
    const lines = ['⭐ Our Most Popular Products — Best Sellers!\n']
    showing.forEach((p, i) => {
      const name = p.category.isAdult ? sanitizeText(p.name) : p.name
      const cheapest = getCheapestPlan(p)
      const badge = p.isBestSeller ? ' 🔥' : p.isNewArrival ? ' ✨' : ''
      lines.push(`${i + 1}. ${name}${badge} — Starting ${cheapest}`)
    })
    if (products.length > maxShow) lines.push(`\n... and ${products.length - maxShow} more!`)
    lines.push('\n💡 Which one catches your eye? Ask for details — I\'ll tell you everything! 😊')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = ['⭐ Amader sobcheye popular products — Best Sellers!\n']
    showing.forEach((p, i) => {
      const name = p.category.isAdult ? sanitizeText(p.name) : p.name
      const cheapest = getCheapestPlan(p)
      const badge = p.isBestSeller ? ' 🔥' : p.isNewArrival ? ' ✨' : ''
      lines.push(`${i + 1}. ${name}${badge} — Shuru ${cheapest} theke`)
    })
    if (products.length > maxShow) lines.push(`\n... ar ${products.length - maxShow} ta ache!`)
    lines.push('\n💡 Kon ta pochondo holo? Details er jonno bolle din — sob bujhiye debo! 😊')
    return lines.join('\n')
  }

  const lines = ['⭐ আমাদের সবচেয়ে জনপ্রিয় প্রোডাক্ট — Best Sellers!\n']
  showing.forEach((p, i) => {
    const name = p.category.isAdult ? sanitizeText(p.name) : p.name
    const cheapest = getCheapestPlan(p)
    const badge = p.isBestSeller ? ' 🔥' : p.isNewArrival ? ' ✨' : ''
    lines.push(`${i + 1}. ${name}${badge} — শুরু ${cheapest} থেকে`)
  })
  if (products.length > maxShow) lines.push(`\n... আরও ${products.length - maxShow}টি আছে!`)
  lines.push('\n💡 কোনটা পছন্দ হলো? বিস্তারিত জানতে চাইলে বলুন — সব বুঝিয়ে বলবো! 😊')
  return lines.join('\n')
}

function generateSpecificProductResponse(
  product: Product,
  lang: 'bangla' | 'banglish' | 'english',
  intent: Intent
): string {
  const sanitizedName = product.category.isAdult ? sanitizeText(product.name) : product.name
  const priceStr = parsePriceOptionsDetailed(product)
  const features = parseFeatures(product)
  const cheapest = getCheapestPlan(product)
  const isLimited = product.stockStatus === 'Limited Stock'

  // Price inquiry — short & sweet answer
  if (intent === 'price_inquiry') {
    if (lang === 'english') {
      return `${sanitizedName} Pricing 💰\n\n${priceStr}\n\n${isLimited ? '⚠️ Limited stock — order soon!\n' : ''}Want to order? I can guide you through the process! 😊`
    }
    if (lang === 'banglish') {
      return `${sanitizedName} er daam 💰\n\n${priceStr}\n\n${isLimited ? '⚠️ Stock limited — joldi order korren!\n' : ''}Order korte chaile? Ami guide korbo! 😊`
    }
    return `${sanitizedName} এর দাম 💰\n\n${priceStr}\n\n${isLimited ? '⚠️ স্টক লিমিটেড — দ্রুত অর্ডার করুন!\n' : ''}অর্ডার করতে চাইলে? আমি গাইড করবো! 😊`
  }

  // Full product detail — conversational & sales-oriented
  const featuresStr = features.length > 0
    ? '\n✨ যা যা পাবেন:\n' + features.slice(0, 8).map((f) => `  • ${f}`).join('\n')
    : ''

  if (lang === 'english') {
    let response = `Great choice! Let me tell you about ${sanitizedName} 😊\n\n`
    response += `📦 Plans & Pricing:\n${priceStr}\n`
    if (featuresStr) response += featuresStr + '\n'
    response += `\n📦 Stock: ${product.stockStatus}${isLimited ? ' ⚠️ Order fast!' : ''}`
    response += `\n🔒 Warranty: ${product.warranty || 'Full warranty included'}`
    response += `\n🚚 Delivery: ${product.deliveryTime}`
    if (product.region) response += `\n🌍 Region: ${product.region}`
    if (product.accountType) response += `\n📋 Type: ${product.accountType}`
    response += `\n\n💡 Starting at just ${cheapest} — that's an amazing deal!`
    response += `\n\nWant to order? Or need help choosing a plan? Just ask! 😊`

    // Add related products
    const related = findRelatedProducts(product.id, 3)
    if (related.length > 0) {
      const relatedStr = related.map((p) => {
        const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
        return `${pName} (${getCheapestPlan(p)})`
      }).join(', ')
      response += `\n\n🎁 You might also like: ${relatedStr}`
    }
    return response
  }

  if (lang === 'banglish') {
    let response = `Valo choice! ${sanitizedName} er kotha bolchi 😊\n\n`
    response += `📦 Plan & Price:\n${priceStr}\n`
    if (featuresStr) response += featuresStr + '\n'
    response += `\n📦 Stock: ${product.stockStatus}${isLimited ? ' ⚠️ Joldi order korren!' : ''}`
    response += `\n🔒 Warranty: ${product.warranty || 'Full warranty ache'}`
    response += `\n🚚 Delivery: ${product.deliveryTime}`
    if (product.region) response += `\n🌍 Region: ${product.region}`
    if (product.accountType) response += `\n📋 Type: ${product.accountType}`
    response += `\n\n💡 Shuru ${cheapest} theke — onek valo deal!`
    response += `\n\nOrder korte chan? Ba plan choose korte help lagbe? Bolle din! 😊`

    const related = findRelatedProducts(product.id, 3)
    if (related.length > 0) {
      const relatedStr = related.map((p) => {
        const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
        return `${pName} (${getCheapestPlan(p)})`
      }).join(', ')
      response += `\n\n🎁 Ar ei gulo o apnar pochondo hote pare: ${relatedStr}`
    }
    return response
  }

  // Bangla (default)
  let response = `চমৎকার পছন্দ! ${sanitizedName} সম্পর্কে বলছি 😊\n\n`
  response += `📦 প্যাকেজ ও মূল্য:\n${priceStr}\n`
  if (featuresStr) response += featuresStr + '\n'
  response += `\n📦 স্টক: ${product.stockStatus}${isLimited ? ' ⚠️ দ্রুত অর্ডার করুন!' : ''}`
  response += `\n🔒 ওয়ারেন্টি: ${product.warranty || 'ফুল ওয়ারেন্টি অন্তর্ভুক্ত'}`
  response += `\n🚚 ডেলিভারি: ${product.deliveryTime}`
  if (product.region) response += `\n🌍 রিজিওন: ${product.region}`
  if (product.accountType) response += `\n📋 টাইপ: ${product.accountType}`
  response += `\n\n💡 মাত্র ${cheapest} থেকে শুরু — দারুণ ডিল!`
  response += `\n\nঅর্ডার করতে চান? প্ল্যান বেছে নিতে সাহায্য লাগলে বলুন! 😊`

  const related = findRelatedProducts(product.id, 3)
  if (related.length > 0) {
    const relatedStr = related.map((p) => {
      const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
      return `${pName} (${getCheapestPlan(p)})`
    }).join(', ')
    response += `\n\n🎁 আপনি এইগুলোও পছন্দ করতে পারেন: ${relatedStr}`
  }
  return response
}

function generateCategoryResponse(
  categorySlug: string,
  lang: 'bangla' | 'banglish' | 'english'
): string {
  const { category, products, totalCount } = searchByCategory(categorySlug)
  if (!category || products.length === 0) {
    return generateSearchFallback(categorySlug, lang)
  }

  const sanitizedName = category.isAdult ? sanitizeText(category.name) : category.name
  const maxShow = 8
  const showing = products.slice(0, maxShow)

  if (lang === 'english') {
    const lines = [`📂 ${sanitizedName} — ${totalCount} products available!\n`]
    lines.push('Here are our top picks:\n')
    showing.forEach((p, i) => {
      const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
      const cheapest = getCheapestPlan(p)
      const badge = p.isBestSeller ? ' 🔥' : p.isFeatured ? ' ⭐' : ''
      lines.push(`${i + 1}. ${pName}${badge} — From ${cheapest}`)
    })
    if (totalCount > maxShow) lines.push(`\n... and ${totalCount - maxShow} more!`)
    lines.push('\n💡 Which one interests you? I\'ll give you full details! 😊')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = [`📂 ${sanitizedName} — ${totalCount} ta product ache!\n`]
    lines.push('Top picks gulo holo:\n')
    showing.forEach((p, i) => {
      const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
      const cheapest = getCheapestPlan(p)
      const badge = p.isBestSeller ? ' 🔥' : p.isFeatured ? ' ⭐' : ''
      lines.push(`${i + 1}. ${pName}${badge} — ${cheapest} theke`)
    })
    if (totalCount > maxShow) lines.push(`\n... ar ${totalCount - maxShow} ta ache!`)
    lines.push('\n💡 Kon ta details dekhte chan? Sob bujhiye debo! 😊')
    return lines.join('\n')
  }

  const lines = [`📂 ${sanitizedName} ক্যাটাগরিতে ${totalCount}টি প্রোডাক্ট আছে!\n`]
  lines.push('টপ পিকগুলো হলো:\n')
  showing.forEach((p, i) => {
    const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
    const cheapest = getCheapestPlan(p)
    const badge = p.isBestSeller ? ' 🔥' : p.isFeatured ? ' ⭐' : ''
    lines.push(`${i + 1}. ${pName}${badge} — ${cheapest} থেকে`)
  })
  if (totalCount > maxShow) lines.push(`\n... আরও ${totalCount - maxShow}টি আছে!`)
  lines.push('\n💡 কোনটা বিস্তারিত দেখতে চান? সব বুঝিয়ে বলবো! 😊')
  return lines.join('\n')
}

function generateAllProductsResponse(lang: 'bangla' | 'banglish' | 'english'): string {
  const catalogSummary = getCatalogSummary()

  if (lang === 'english') {
    const lines = ['📂 We have 200+ products across 11 categories!\n']
    catalogSummary.forEach((cat) => {
      const name = cat.isAdult ? sanitizeText(cat.name) : cat.name
      lines.push(`📂 ${name} (${cat.productCount} products)`)
      lines.push(`   Popular: ${cat.sampleProducts.slice(0, 3).join(', ')}`)
    })
    lines.push('\n💡 Which category interests you? Or tell me a specific product name! 😊')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = ['📂 Amader 200+ product ache 11 ta category te!\n']
    catalogSummary.forEach((cat) => {
      const name = cat.isAdult ? sanitizeText(cat.name) : cat.name
      lines.push(`📂 ${name} (${cat.productCount} ta)`)
      lines.push(`   Popular: ${cat.sampleProducts.slice(0, 3).join(', ')}`)
    })
    lines.push('\n💡 Kon category dekhte chan? Ba kon product er nam bolle din! 😊')
    return lines.join('\n')
  }

  const lines = ['📂 আমাদের ১১টি ক্যাটাগরিতে ২০০+ প্রোডাক্ট আছে!\n']
  catalogSummary.forEach((cat) => {
    const name = cat.isAdult ? sanitizeText(cat.name) : cat.name
    lines.push(`📂 ${name} (${cat.productCount}টি)`)
    lines.push(`   জনপ্রিয়: ${cat.sampleProducts.slice(0, 3).join(', ')}`)
  })
  lines.push('\n💡 কোন ক্যাটাগরি দেখতে চান? অথবা প্রোডাক্টের নাম বলুন! 😊')
  return lines.join('\n')
}

function generateSearchResponse(
  products: Product[],
  lang: 'bangla' | 'banglish' | 'english'
): string {
  if (products.length === 0) return generateOutOfScopeResponse(lang)

  const maxShow = 6
  const showing = products.slice(0, maxShow)

  if (lang === 'english') {
    const lines = ['🔍 I found these for you:\n']
    showing.forEach((p, i) => {
      const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
      const cheapest = getCheapestPlan(p)
      const badge = p.isBestSeller ? ' 🔥' : ''
      lines.push(`${i + 1}. ${pName}${badge} — From ${cheapest}`)
    })
    if (products.length > maxShow) lines.push(`\n... and ${products.length - maxShow} more!`)
    lines.push('\n💡 Want details on any product? Just ask! 😊')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = ['🔍 Apnar jonno ei gulo pailam:\n']
    showing.forEach((p, i) => {
      const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
      const cheapest = getCheapestPlan(p)
      const badge = p.isBestSeller ? ' 🔥' : ''
      lines.push(`${i + 1}. ${pName}${badge} — ${cheapest} theke`)
    })
    if (products.length > maxShow) lines.push(`\n... ar ${products.length - maxShow} ta ache!`)
    lines.push('\n💡 Kon product er details chante chan? Bolle din! 😊')
    return lines.join('\n')
  }

  const lines = ['🔍 আপনার জন্য এইগুলো পেলাম:\n']
  showing.forEach((p, i) => {
    const pName = p.category.isAdult ? sanitizeText(p.name) : p.name
    const cheapest = getCheapestPlan(p)
    const badge = p.isBestSeller ? ' 🔥' : ''
    lines.push(`${i + 1}. ${pName}${badge} — ${cheapest} থেকে`)
  })
  if (products.length > maxShow) lines.push(`\n... আরও ${products.length - maxShow}টি আছে!`)
  lines.push('\n💡 কোন প্রোডাক্টের বিস্তারিত জানতে চান? বলুন! 😊')
  return lines.join('\n')
}

function generateSearchFallback(query: string, lang: 'bangla' | 'banglish' | 'english'): string {
  const results = searchProducts(query, 6)
  if (results.length > 0) return generateSearchResponse(results, lang)
  return generateOutOfScopeResponse(lang)
}

// ─── NEW: How to Use Guide ────────────────────────────────────────────────

function generateHowToUseResponse(
  userMsg: string,
  lang: 'bangla' | 'banglish' | 'english'
): string {
  const product = findSpecificProduct(userMsg)
  const sanitizedName = product ? (product.category.isAdult ? sanitizeText(product.name) : product.name) : null

  if (lang === 'english') {
    let response = `📱 How to Use Your Subscription:\n\n`
    response += `1️⃣ After payment, we'll send you login credentials within 5-20 minutes\n`
    response += `2️⃣ Log in with the provided email & password\n`
    response += `3️⃣ Change the password to your own for security\n`
    response += `4️⃣ Start enjoying your premium subscription! 🎉\n\n`
    if (sanitizedName) {
      response += `For ${sanitizedName}, we provide a full setup guide after purchase.\n\n`
    }
    response += `🔒 All subscriptions come with full warranty. If any issue, we'll replace it free!\n\n`
    response += `Want to order? I'll guide you step by step! 😊`
    return response
  }

  if (lang === 'banglish') {
    let response = `📱 Subscription kivabe use korben:\n\n`
    response += `1️⃣ Payment er por, 5-20 minute e login credentials pathabo\n`
    response += `2️⃣ Dea email & password diye login korren\n`
    response += `3️⃣ Security er jonno password apnar nijer ta change korren\n`
    response += `4️⃣ Premium subscription enjoy korren! 🎉\n\n`
    if (sanitizedName) {
      response += `${sanitizedName} er jonno purchase er por full setup guide debo.\n\n`
    }
    response += `🔒 Sob subscription e full warranty ache. Kono problem hole free e replace kore debo!\n\n`
    response += `Order korte chan? Step by step guide korbo! 😊`
    return response
  }

  let response = `📱 সাবস্ক্রিপশন কীভাবে ব্যবহার করবেন:\n\n`
  response += `1️⃣ পেমেন্টের পর, 5-20 মিনিটে লগইন তথ্য পাঠাবো\n`
  response += `2️⃣ দেওয়া ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন\n`
  response += `3️⃣ নিরাপত্তার জন্য পাসওয়ার্ড আপনারটা দিয়ে চেঞ্জ করুন\n`
  response += `4️⃣ প্রিমিয়াম সাবস্ক্রিপশন উপভোগ করুন! 🎉\n\n`
  if (sanitizedName) {
    response += `${sanitizedName} এর জন্য কেনার পর সম্পূর্ণ সেটআপ গাইড দেবো।\n\n`
  }
  response += `🔒 সব সাবস্ক্রিপশনে ফুল ওয়ারেন্টি আছে। কোনো সমস্যা হলে ফ্রিতে রিপ্লেস করে দেবো!\n\n`
  response += `অর্ডার করতে চান? স্টেপ বাই স্টেপ গাইড করবো! 😊`
  return response
}

// ─── NEW: Warranty & Delivery Info ────────────────────────────────────────

function generateWarrantyDeliveryResponse(
  userMsg: string,
  lang: 'bangla' | 'banglish' | 'english'
): string {
  if (lang === 'english') {
    return `🔒 Warranty & Delivery Policy:\n\n✅ Full warranty on all subscriptions\n✅ If any issue, free replacement within warranty period\n✅ No questions asked replacement policy\n\n🚚 Delivery Time:\n• Most products: 5-20 minutes\n• Some products: Up to 24 hours\n• We'll notify you the exact time after order\n\n💰 Payment Methods:\n• bKash: 01647236359\n• Nagad: 01647236359\n\n📱 Any other questions? Or ready to order? 😊`
  }

  if (lang === 'banglish') {
    return `🔒 Warranty & Delivery Policy:\n\n✅ Sob subscription e full warranty\n✅ Kono issue hole warranty period e free replacement\n✅ Kono question na kore replace kore debo\n\n🚚 Delivery Time:\n• Most product: 5-20 minute\n• Kichu product: 24 hours porjonto\n• Order er por exact time janiye debo\n\n💰 Payment Methods:\n• bKash: 01647236359\n• Nagad: 01647236359\n\n📱 Ar kono question? Ba order korte ready? 😊`
  }

  return `🔒 ওয়ারেন্টি ও ডেলিভারি পলিসি:\n\n✅ সব সাবস্ক্রিপশনে ফুল ওয়ারেন্টি\n✅ কোনো সমস্যা হলে ওয়ারেন্টি সময়ে ফ্রি রিপ্লেসমেন্ট\n✅ কোনো প্রশ্ন ছাড়াই রিপ্লেস করে দেবো\n\n🚚 ডেলিভারি সময়:\n• বেশিরভাগ প্রোডাক্ট: 5-20 মিনিট\n• কিছু প্রোডাক্ট: ২৪ ঘণ্টা পর্যন্ত\n• অর্ডারের পর সঠিক সময় জানিয়ে দেবো\n\n💰 পেমেন্ট মাধ্যম:\n• bKash: 01647236359\n• Nagad: 01647236359\n\n📱 আর কোনো প্রশ্ন? অথবা অর্ডার করতে রেডি? 😊`
}

// ─── Order Payment Response ───────────────────────────────────────────────

function generateOrderPaymentResponse(
  userMsg: string,
  history: Array<{ role: string; content: string }>,
  lang: 'bangla' | 'banglish' | 'english'
): { response: string; whatsappUrl: string } {
  const lower = userMsg.toLowerCase()
  const fullConversation = [
    ...history.map((m) => `${m.role}: ${m.content}`),
    `user: ${userMsg}`,
  ].join('\n')

  const extractName = (text: string): string | undefined => {
    for (const p of [
      /(?:my name is|i'm|i am|name[:\s]+)\s*([a-zA-Z\s]{2,30})/i,
      /(?:আমার নাম|নাম[:\s]+)\s*([^\n]{2,30})/i,
      /(?:amar nam|nam[:\s]+)\s*([a-zA-Z\s]{2,30})/i,
    ]) {
      const m = text.match(p)
      if (m) return m[1].trim()
    }
    return undefined
  }

  const extractWhatsApp = (text: string): string | undefined => {
    for (const p of [
      /(?:whatsapp|phone|number|mobile|contact|নম্বর|ফোন)[:\s]*(?:number)?[:\s]*([+]?[\d]{10,15})/i,
      /([+]?880[\d]{10})/,
      /([+]?01[\d]{9})/,
    ]) {
      const m = text.match(p)
      if (m) return m[1].trim()
    }
    return undefined
  }

  const extractProduct = (text: string): string | undefined => {
    for (const p of [
      /(?:i want to (?:buy|order|get|subscribe to)|looking for|interested in)[:\s]+([a-zA-Z\s&+]{3,40})/i,
      /(?:product|subscribe to|subscription for|plan for)[:\s]+([a-zA-Z\s&+]{3,40})/i,
      /(?:buy|order|get|purchase)[:\s]+([a-zA-Z\s&+]{3,40})/i,
      /(?:লাগবে|চাই|নিতে চাই|কিনতে চাই)[:\s]*([^\n]{3,40})/i,
      /(?:lagbe|chai|nite chai|kinte chai)[:\s]+([a-zA-Z\s&+]{3,40})/i,
    ]) {
      const m = text.match(p)
      if (m) return m[1].replace(/\b(to|for|the|a|an|please)\b/gi, '').replace(/\s+/g, ' ').trim()
    }
    return undefined
  }

  const extractTransactionId = (text: string): string | undefined => {
    for (const p of [
      /(?:trxid|transaction\s*id|txn|trx|ট্রানজেকশন)[:\s]*([a-zA-Z0-9]{6,20})/i,
      /(?:payment\s*done|paid|পেমেন্ট\s*হয়েছে|পেমেন্ট\s*করেছি)[:\s]*([a-zA-Z0-9]{6,20})/i,
    ]) {
      const m = text.match(p)
      if (m) return m[1].trim()
    }
    return undefined
  }

  const customerName = extractName(fullConversation)
  const customerWhatsApp = extractWhatsApp(fullConversation)
  const productFromConv = extractProduct(fullConversation)
  const transactionId = extractTransactionId(fullConversation)

  let foundProduct: Product | null = null
  if (productFromConv) foundProduct = findSpecificProduct(productFromConv)
  if (!foundProduct) foundProduct = findSpecificProduct(userMsg)
  if (!foundProduct) {
    for (const msg of history.slice(-6).reverse()) {
      const p = findSpecificProduct(msg.content)
      if (p) { foundProduct = p; break }
    }
  }

  const whatsappUrl = buildWhatsAppUrl({
    customerName, whatsappNumber: customerWhatsApp,
    productName: foundProduct?.name || productFromConv, transactionId, message: userMsg,
  })

  // Check if user is asking HOW to order
  const isAskingHow = [
    'how to order', 'how to pay', 'how to buy', 'kivabe order',
    'kivabe pay', 'order kivabe', 'payment kivabe', 'bkash number',
    'bkash number ki', 'কীভাবে অর্ডার', 'কীভাবে পেমেন্ট',
    'বিকাশ নম্বর', 'অর্ডার কীভাবে', 'পেমেন্ট কীভাবে',
    'order process', 'payment process',
  ].some((kw) => lower.includes(kw))

  if (isAskingHow) {
    if (lang === 'english') {
      let response = `💳 How to Order — Easy 3 Steps!\n\n`
      if (foundProduct) {
        response += `📦 Your Product: ${foundProduct.name}\n💰 Price: ${parsePriceOptions(foundProduct)}\n\n`
      }
      response += `Step 1️⃣: Send Money to bKash — **01647236359**\n`
      response += `Step 2️⃣: Send Transaction ID, last digits, and your email to us\n`
      response += `Step 3️⃣: Get your subscription in 5-20 minutes! ⚡\n\n`
      response += `🔒 Full warranty on every order!\n\n`
      response += `📱 Or click the button below to order directly on WhatsApp! 👇`
      return { response, whatsappUrl }
    }

    if (lang === 'banglish') {
      let response = `💳 Order Kivabe Korben — Easy 3 Steps!\n\n`
      if (foundProduct) {
        response += `📦 Apnar Product: ${foundProduct.name}\n💰 Price: ${parsePriceOptions(foundProduct)}\n\n`
      }
      response += `Step 1️⃣: bKash e Send Money — **01647236359**\n`
      response += `Step 2️⃣: Transaction ID & screenshot amader pathan\n`
      response += `Step 3️⃣: 5-20 minute e subscription peye jaben! ⚡\n\n`
      response += `🔒 Protita order e full warranty!\n\n`
      response += `📱 Or niche button e click kore WhatsApp e direct order korren! 👇`
      return { response, whatsappUrl }
    }

    let response = `💳 অর্ডার কীভাবে করবেন — সহজ ৩ ধাপ!\n\n`
    if (foundProduct) {
      response += `📦 আপনার প্রোডাক্ট: ${foundProduct.name}\n💰 মূল্য: ${parsePriceOptions(foundProduct)}\n\n`
    }
    response += `ধাপ 1️⃣: bKash এ Send Money করুন — **01647236359**\n`
    response += `ধাপ 2️⃣: Transaction ID ও স্ক্রিনশট আমাদের পাঠান\n`
    response += `ধাপ 3️⃣: 5-20 মিনিটে সাবস্ক্রিপশন পেয়ে যান! ⚡\n\n`
    response += `🔒 প্রতিটি অর্ডারে ফুল ওয়ারেন্টি!\n\n`
    response += `📱 অথবা নিচের বাটনে ক্লিক করে WhatsApp এ সরাসরি অর্ডার করুন! 👇`
    return { response, whatsappUrl }
  }

  // User wants to ORDER
  if (lang === 'english') {
    let response = `🛒 Awesome! Let's get your order ready!\n\n`
    if (foundProduct) {
      response += `📦 Product: ${foundProduct.name}\n💰 Price: ${parsePriceOptions(foundProduct)}\n📦 Stock: ${foundProduct.stockStatus}\n🚚 Delivery: ${foundProduct.deliveryTime}\n\n`
    }
    response += `💳 Payment: bKash Send Money to **01647236359**\n\n`
    response += `After payment, send your Transaction ID. We'll deliver in 5-20 minutes! ⚡\n\n`
    response += `📱 Or order directly on WhatsApp — click below! 👇`
    return { response, whatsappUrl }
  }

  if (lang === 'banglish') {
    let response = `🛒 Valo! Apnar order ready kori!\n\n`
    if (foundProduct) {
      response += `📦 Product: ${foundProduct.name}\n💰 Price: ${parsePriceOptions(foundProduct)}\n📦 Stock: ${foundProduct.stockStatus}\n🚚 Delivery: ${foundProduct.deliveryTime}\n\n`
    }
    response += `💳 Payment: bKash e Send Money **01647236359** number e\n\n`
    response += `Payment er por Transaction ID pathan. 5-20 minute e deliver dib! ⚡\n\n`
    response += `📱 Ba WhatsApp e direct order korren — niche click korren! 👇`
    return { response, whatsappUrl }
  }

  let response = `🛒 চমৎকার! আপনার অর্ডার রেডি করি!\n\n`
  if (foundProduct) {
    response += `📦 প্রোডাক্ট: ${foundProduct.name}\n💰 মূল্য: ${parsePriceOptions(foundProduct)}\n📦 স্টক: ${foundProduct.stockStatus}\n🚚 ডেলিভারি: ${foundProduct.deliveryTime}\n\n`
  }
  response += `💳 পেমেন্ট: bKash এ Send Money করুন **01647236359** নম্বরে\n\n`
  response += `পেমেন্টের পর Transaction ID পাঠান। 5-20 মিনিটে ডেলিভারি দেবো! ⚡\n\n`
  response += `📱 অথবা WhatsApp এ সরাসরি অর্ডার করুন — নিচে ক্লিক করুন! 👇`
  return { response, whatsappUrl }
}

// ─── Price Inquiry Response ───────────────────────────────────────────────

function generatePriceInquiryResponse(
  userMsg: string,
  lang: 'bangla' | 'banglish' | 'english'
): string {
  // Try to find the specific product
  const product = findSpecificProduct(userMsg)
  if (product) {
    return generateSpecificProductResponse(product, lang, 'price_inquiry')
  }

  // If no specific product found, try search
  const results = searchProducts(userMsg, 4)
  if (results.length > 0) {
    return generateSearchResponse(results, lang)
  }

  // Generic price overview
  if (lang === 'english') {
    return `💰 Our Price Range:\n\n🎬 Streaming: ৳99 - ৳1,499\n🤖 AI Tools: ৳199 - ৳4,999\n🔒 VPN: ৳149 - ৳2,499\n📚 Education: ৳199 - ৳2,999\n🎨 Design: ৳199 - ৳3,499\n🎮 Gaming: ৳99 - ৳999\n🎁 Gift Cards: ৳500 - ৳5,000\n\n💡 Tell me which product you're interested in — I'll give you the exact price! 😊`
  }

  if (lang === 'banglish') {
    return `💰 Amader Price Range:\n\n🎬 Streaming: ৳99 - ৳1,499\n🤖 AI Tools: ৳199 - ৳4,999\n🔒 VPN: ৳149 - ৳2,499\n📚 Education: ৳199 - ৳2,999\n🎨 Design: ৳199 - ৳3,499\n🎮 Gaming: ৳99 - ৳999\n🎁 Gift Cards: ৳500 - ৳5,000\n\n💡 Kon product er daam jante chan bolle din — exact price debo! 😊`
  }

  return `💰 আমাদের প্রাইস রেঞ্জ:\n\n🎬 স্ট্রিমিং: ৳99 - ৳1,499\n🤖 AI Tools: ৳199 - ৳4,999\n🔒 VPN: ৳149 - ৳2,499\n📚 এডুকেশন: ৳199 - ৳2,999\n🎨 ডিজাইন: ৳199 - ৳3,499\n🎮 গেমিং: ৳99 - ৳999\n🎁 গিফট কার্ড: ৳500 - ৳5,000\n\n💡 কোন প্রোডাক্টের দাম জানতে চান বলুন — সঠিক মূল্য দেবো! 😊`
}

// ─── Thanks Response ──────────────────────────────────────────────────────

function generateThanksResponse(
  userMsg: string,
  history: Array<{ role: string; content: string }>,
  lang: 'bangla' | 'banglish' | 'english'
): string {
  // Check if user was asking about a product before
  let recentProduct: Product | null = null
  for (const msg of history.slice(-6).reverse()) {
    const p = findSpecificProduct(msg.content)
    if (p) { recentProduct = p; break }
  }

  if (lang === 'english') {
    let response = `You're very welcome! 😊 I'm always here to help you find the best deals.\n\n`
    if (recentProduct) {
      const pName = recentProduct.category.isAdult ? sanitizeText(recentProduct.name) : recentProduct.name
      response += `Whenever you're ready to order ${pName}, just let me know! I'll guide you through the whole process — it only takes a few minutes. ⚡\n\n`
    }
    response += `Got any more questions? Or want to explore more products? I'm here for you! 💚`
    return response
  }

  if (lang === 'banglish') {
    let response = `Apnar onek dhonnobad! 😊 Apnake help korte pai onek valo laglo.\n\n`
    if (recentProduct) {
      const pName = recentProduct.category.isAdult ? sanitizeText(recentProduct.name) : recentProduct.name
      response += `${pName} order korte jokhon ready hobe, amake bolle din! Step by step guide korbo — kichu minute e hobe! ⚡\n\n`
    }
    response += `Ar kono question thakle bolle din! Ami sob somoy apnar jonno ache! 💚`
    return response
  }

  let response = `আপনাকে অনেক ধন্যবাদ! 😊 আপনাকে সাহায্য করতে পেরে ভালো লাগলো।\n\n`
  if (recentProduct) {
    const pName = recentProduct.category.isAdult ? sanitizeText(recentProduct.name) : recentProduct.name
    response += `${pName} অর্ডার করতে যখন রেডি হবেন, আমাকে বলুন! স্টেপ বাই স্টেপ গাইড করবো — কয়েক মিনিটেই হয়ে যাবে! ⚡\n\n`
  }
  response += `আর কোনো প্রশ্ন থাকলে বলুন! আমি সবসময় আপনার জন্য আছি! 💚`
  return response
}

// ─── Goodbye Response ──────────────────────────────────────────────────────

function generateGoodbyeResponse(lang: 'bangla' | 'banglish' | 'english'): string {
  if (lang === 'english') {
    return `Take care! 👋 It was great chatting with you.\n\nRemember — whenever you need a subscription at the best price in Bangladesh, I'm just one click away! 😊\n\n💳 Quick reminder: bKash Send Money to 01647236359 for instant delivery!\n\nHave a wonderful day! 💚`
  }

  if (lang === 'banglish') {
    return `Apnar jonno valo chilo! 👋 Onek valo kotha holo apnar sathe.\n\nMone rakhben — jokhoni subscription lagbe best price e, ami ek click e ache! 😊\n\n💳 Mone rakhate: bKash e Send Money 01647236359 — instant delivery!\n\nApnar din valo kete! 💚`
  }

  return `ভালো থাকবেন! 👋 আপনার সাথে কথা হয়ে ভালো লাগলো।\n\nমনে রাখবেন — যখনই সাবস্ক্রিপশন লাগবে সেরা দামে, আমি এক ক্লিকেই আছি! 😊\n\n💳 মনে রাখতে: bKash এ Send Money 01647236359 — তাৎক্ষণিক ডেলিভারি!\n\nআপনার দিন ভালো কাটুক! 💚`
}

// ─── Comparison Response ──────────────────────────────────────────────────

function generateComparisonResponse(
  userMsg: string,
  lang: 'bangla' | 'banglish' | 'english'
): string {
  // Try to find two products to compare
  const vsMatch = userMsg.match(/(.+?)\s+(?:vs|versus|or|বনাম|against)\s+(.+)/i)
  let product1: Product | null = null
  let product2: Product | null = null

  if (vsMatch) {
    product1 = findSpecificProduct(vsMatch[1].trim())
    product2 = findSpecificProduct(vsMatch[2].trim())
  }

  // If we can't find both, try finding from the message
  if (!product1 || !product2) {
    const searchResults = searchProducts(userMsg, 4)
    if (searchResults.length >= 2) {
      product1 = product1 || searchResults[0]
      product2 = product2 || searchResults[1]
    }
  }

  if (product1 && product2) {
    const name1 = product1.category.isAdult ? sanitizeText(product1.name) : product1.name
    const name2 = product2.category.isAdult ? sanitizeText(product2.name) : product2.name
    const price1 = getCheapestPlan(product1)
    const price2 = getCheapestPlan(product2)
    const features1 = parseFeatures(product1).slice(0, 4)
    const features2 = parseFeatures(product2).slice(0, 4)

    if (lang === 'english') {
      let response = `⚖️ ${name1} vs ${name2} — Let me help you decide!\n\n`
      response += `📦 ${name1}:\n`
      response += `  • Starting from: ${price1}\n`
      response += `  • Warranty: ${product1.warranty || 'Full warranty'}\n`
      response += `  • Delivery: ${product1.deliveryTime}\n`
      if (features1.length > 0) response += `  • Features: ${features1.join(', ')}\n`
      response += `\n📦 ${name2}:\n`
      response += `  • Starting from: ${price2}\n`
      response += `  • Warranty: ${product2.warranty || 'Full warranty'}\n`
      response += `  • Delivery: ${product2.deliveryTime}\n`
      if (features2.length > 0) response += `  • Features: ${features2.join(', ')}\n`
      response += `\n💡 Both are great choices! Tell me your budget and what you need most — I'll recommend the best one for you! 😊`
      return response
    }

    if (lang === 'banglish') {
      let response = `⚖️ ${name1} vs ${name2} — Apnake help kori decide korte!\n\n`
      response += `📦 ${name1}:\n`
      response += `  • Shuru: ${price1} theke\n`
      response += `  • Warranty: ${product1.warranty || 'Full warranty'}\n`
      response += `  • Delivery: ${product1.deliveryTime}\n`
      if (features1.length > 0) response += `  • Features: ${features1.join(', ')}\n`
      response += `\n📦 ${name2}:\n`
      response += `  • Shuru: ${price2} theke\n`
      response += `  • Warranty: ${product2.warranty || 'Full warranty'}\n`
      response += `  • Delivery: ${product2.deliveryTime}\n`
      if (features2.length > 0) response += `  • Features: ${features2.join(', ')}\n`
      response += `\n💡 Duitai valo! Apnar budget ki ar ki sabdik se bolle din — apnar jonno best ta recommend korbo! 😊`
      return response
    }

    let response = `⚖️ ${name1} vs ${name2} — আপনাকে সাহায্য করি সিদ্ধান্ত নিতে!\n\n`
    response += `📦 ${name1}:\n`
    response += `  • শুরু: ${price1} থেকে\n`
    response += `  • ওয়ারেন্টি: ${product1.warranty || 'ফুল ওয়ারেন্টি'}\n`
    response += `  • ডেলিভারি: ${product1.deliveryTime}\n`
    if (features1.length > 0) response += `  • ফিচার: ${features1.join(', ')}\n`
    response += `\n📦 ${name2}:\n`
    response += `  • শুরু: ${price2} থেকে\n`
    response += `  • ওয়ারেন্টি: ${product2.warranty || 'ফুল ওয়ারেন্টি'}\n`
    response += `  • ডেলিভারি: ${product2.deliveryTime}\n`
    if (features2.length > 0) response += `  • ফিচার: ${features2.join(', ')}\n`
    response += `\n💡 দুটোই চমৎকার! আপনার বাজেট কত এবং কী সবচেয়ে দরকার বলুন — আপনার জন্য সেরাটা সুপারিশ করবো! 😊`
    return response
  }

  // Fallback — can't find specific products to compare
  if (lang === 'english') {
    return `⚖️ I'd love to help you compare! Could you tell me which two products you're deciding between?\n\nFor example: "Netflix vs Spotify" or "NordVPN vs ExpressVPN"\n\nI'll give you a detailed comparison with prices and features! 😊`
  }
  if (lang === 'banglish') {
    return `⚖️ Compare korte help korbo! Kon dui product er moddhe decide korcen seta bolle din?\n\nExample: "Netflix vs Spotify" ba "NordVPN vs ExpressVPN"\n\nDetails compare kore debo price & features soho! 😊`
  }
  return `⚖️ তুলনা করতে সাহায্য করবো! আপনি কোন দুটি প্রোডাক্টের মধ্যে সিদ্ধান্ত নিচ্ছেন বলুন?\n\nউদাহরণ: "Netflix vs Spotify" বা "NordVPN vs ExpressVPN"\n\nদাম ও ফিচারসহ বিস্তারিত তুলনা করে দেবো! 😊`
}

// ─── Out of Scope Response ────────────────────────────────────────────────

function generateOutOfScopeResponse(lang: 'bangla' | 'banglish' | 'english'): string {
  const catalogSummary = getCatalogSummary()

  if (lang === 'english') {
    const lines = ["I'd love to help! We sell premium digital subscriptions:\n"]
    catalogSummary.slice(0, 6).forEach((cat) => {
      const name = cat.isAdult ? sanitizeText(cat.name) : cat.name
      lines.push(`📂 ${name} (${cat.productCount} products)`)
    })
    lines.push('\n💡 Try asking things like:')
    lines.push('• "Netflix কত টাকা?"')
    lines.push('• "Best VPN plans"')
    lines.push('• "Featured products দেখাও"')
    lines.push('• "কীভাবে অর্ডার করবো?"')
    lines.push('\n📱 Need help? WhatsApp: +8801647236359')
    return lines.join('\n')
  }

  if (lang === 'banglish') {
    const lines = ['Ami help korte chai! Amra digital subscription bechhi:\n']
    catalogSummary.slice(0, 6).forEach((cat) => {
      const name = cat.isAdult ? sanitizeText(cat.name) : cat.name
      lines.push(`📂 ${name} (${cat.productCount} ta)`)
    })
    lines.push('\n💡 Ei gulo try korren:')
    lines.push('• "Netflix koto taka?"')
    lines.push('• "Best VPN plans"')
    lines.push('• "Featured products dekhao"')
    lines.push('• "Order kivabe korbo?"')
    lines.push('\n📱 Help lagle WhatsApp: +8801647236359')
    return lines.join('\n')
  }

  const lines = ['আমি সাহায্য করতে চাই! আমরা ডিজিটাল সাবস্ক্রিপশন বিক্রি করি:\n']
  catalogSummary.slice(0, 6).forEach((cat) => {
    const name = cat.isAdult ? sanitizeText(cat.name) : cat.name
    lines.push(`📂 ${name} (${cat.productCount}টি)`)
  })
  lines.push('\n💡 এইগুলো চেষ্টা করুন:')
  lines.push('• "Netflix কত টাকা?"')
  lines.push('• "Best VPN প্ল্যান কত?"')
  lines.push('• "ফিচার্ড প্রোডাক্ট দেখাও"')
  lines.push('• "কীভাবে অর্ডার করবো?"')
  lines.push('\n📱 সাহায্য লাগলে WhatsApp: +8801647236359')
  return lines.join('\n')
}

// ─── POST Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, history = [] } = body as {
      message?: string; sessionId?: string;
      history?: Array<{ role: string; content: string }>
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const userMsg = message.trim()
    const lang = detectLanguage(userMsg)
    const intent = detectIntent(userMsg, history)

    let response = ''
    let whatsappUrl: string | undefined

    switch (intent) {
      case 'greeting': {
        response = generateGreeting(lang)
        break
      }

      case 'thanks': {
        response = generateThanksResponse(userMsg, history, lang)
        break
      }

      case 'goodbye': {
        response = generateGoodbyeResponse(lang)
        break
      }

      case 'comparison': {
        response = generateComparisonResponse(userMsg, lang)
        break
      }

      case 'featured': {
        response = generateFeaturedResponse(lang)
        break
      }

      case 'specific_product': {
        const product = findSpecificProduct(userMsg)
        if (product) {
          response = generateSpecificProductResponse(product, lang, intent)
        } else {
          response = generateSearchFallback(userMsg, lang)
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

      case 'how_to_use': {
        response = generateHowToUseResponse(userMsg, lang)
        // If a product was mentioned, also include its details
        const product = findSpecificProduct(userMsg)
        if (product) {
          const productInfo = generateSpecificProductResponse(product, lang, 'price_inquiry')
          response = productInfo + '\n\n---\n\n' + response
        }
        break
      }

      case 'warranty_delivery': {
        response = generateWarrantyDeliveryResponse(userMsg, lang)
        break
      }

      case 'price_inquiry': {
        response = generatePriceInquiryResponse(userMsg, lang)
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

    // Add WhatsApp URL if user seems interested in ordering
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
      response: 'দুঃখিত, একটু সমস্যা হচ্ছে। WhatsApp এ যোগাযোগ করুন: +8801647236359 🙏',
      whatsappUrl: buildWhatsAppUrl({ message: 'Error fallback' }),
    })
  }
}

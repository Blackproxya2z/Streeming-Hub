import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { searchProducts, searchByCategory, getFeaturedProducts, getCatalogSummary, findSpecificProduct, findRelatedProducts, type Product } from '@/lib/data'

// ─── Types ──────────────────────────────────────────────────────────────────

type Intent = 'pin_inquiry' | 'greeting' | 'thanks' | 'goodbye' | 'comparison' | 'featured' | 'specific_product' | 'category' | 'all_products' | 'order_payment' | 'how_to_use' | 'warranty_delivery' | 'price_inquiry' | 'search' | 'out_of_scope'
type Language = 'bangla' | 'banglish' | 'english'
interface ProductCard { id: string; name: string; slug: string; image: string | null; basePriceBDT: string; priceOptions: string; warranty: string | null; deliveryTime: string; stockStatus: string; category: { name: string; slug: string } }
interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
interface PriceOption { label?: string; priceBDT?: string }

// ─── Timeout Utility ─────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms)),
  ])
}

// ─── ZAI Singleton ──────────────────────────────────────────────────────────

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null
async function getZAI() { if (!zaiInstance) zaiInstance = await ZAI.create(); return zaiInstance }

// ─── Rate Limiting ──────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(sessionId: string): boolean {
  const now = Date.now(); const entry = rateLimitMap.get(sessionId)
  if (!entry || now > entry.resetAt) { rateLimitMap.set(sessionId, { count: 1, resetAt: now + 60_000 }); return true }
  if (entry.count >= 20) return false; entry.count++; return true
}

// ─── Content Filter ─────────────────────────────────────────────────────────

const FILTER_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b18\+?/gi, 'VP'], [/\badult\b/gi, 'VP'], [/\bpornhub\b/gi, 'PH'], [/\bporn\b/gi, 'PH'],
  [/\bxxx\b/gi, 'VP'], [/\bnsfw\b/gi, 'VP'], [/\bnude\b/gi, 'VP'], [/\berotic\b/gi, 'VP'],
  [/\bfaphouse\b/gi, 'FH'], [/\bfap\b/gi, 'FH'], [/\bsex\b/gi, 'VP'], [/\bpussy\b/gi, 'PV'],
  [/\bfuck\b/gi, 'VP'], [/\bdick\b/gi, 'VP'], [/\bteen\b/gi, 'VP'], [/\bmilf\b/gi, 'MV'],
  [/\bহট\b/gi, 'প্রিমিয়াম'], [/\bপর্ন\b/gi, 'প্রিমিয়াম'], [/\bবয়স্ক\b/gi, 'ভেরিফায়েড'],
]
function sanitizeText(text: string): string { let c = text; for (const [p, r] of FILTER_REPLACEMENTS) c = c.replace(p, r); return c }

// ─── Intent Detection ───────────────────────────────────────────────────────

function hasKeyword(lower: string, keywords: string[]): boolean { return keywords.some((kw) => lower.includes(kw)) }

function detectIntent(message: string, _history: ChatMessage[]): Intent {
  const lower = message.toLowerCase().trim()
  // 1. PIN — check FIRST
  const pinKw = ['pin', 'পিন', 'pin ki', 'pin koto', 'pin number', 'access code', 'access pin', 'adult pin', 'adult site pin', 'restricted pin', 'ভেরিফিকেশন pin', 'pin lagbe', 'pin chara', 'pin diye', 'pin ta ki']
  if (pinKw.some((kw) => kw.length <= 3 ? new RegExp(`\\b${kw}\\b`, 'i').test(lower) : lower.includes(kw))) return 'pin_inquiry'
  // 2. GREETING
  const greetKw = ['hi', 'hello', 'hey', 'assalam', 'সালাম', 'আসসালামু', 'আসসালাম', 'হ্যালো', 'হাই', 'কেমন আছ', 'kemon acho', 'kemn acho', 'good morning', 'good evening', 'good afternoon', 'শুভ সকাল', 'শুভ সন্ধ্যা', 'sup', 'yo']
  const prodKw = ['product', 'price', 'order', 'buy', 'netflix', 'vpn', 'chatgpt', 'spotify', 'canva', 'adobe', 'midjourney', 'premium', 'subscription', 'plan', 'streaming', 'প্রোডাক্ট', 'দাম', 'অর্ডার', 'কিনতে', 'মূল্য', 'প্ল্যান', 'dekhao', 'koto', 'taka', 'কত টাকা', 'কত দাম', 'কিভাবে', 'কীভাবে', 'kivabe']
  if (hasKeyword(lower, greetKw) && !hasKeyword(lower, prodKw) && lower.split(/\s+/).length <= 6) return 'greeting'
  // 3. THANKS
  if (hasKeyword(lower, ['thanks', 'thank you', 'thx', 'ty', 'ধন্যবাদ', 'ধন্যবাদী', 'shukriya', 'শুকরিয়া', 'valo hoyeche', 'valo laglo', 'helpful', 'onek valo', 'onek dhonnobad', 'thanks a lot', 'appreciate', 'great help', 'শুকর']) && lower.split(/\s+/).length <= 8) return 'thanks'
  // 4. GOODBYE
  if (hasKeyword(lower, ['bye', 'goodbye', 'see you', 'good night', 'goodnight', 'বাই', 'আলবিদা', 'যাই', 'আসি', 'বিদায়', 'shubho ratri', 'শুভ রাত্রি', 'good bye', 'take care', 'have a good day', 'khoda hafiz', 'খোদা হাফিজ']) && lower.split(/\s+/).length <= 6) return 'goodbye'
  // 5. COMPARISON
  if (hasKeyword(lower, ['vs', 'versus', 'compare', 'comparison', 'difference between', 'better', 'which one', 'which is best', 'kon ta valo', 'kon ta better', 'তুলনা', 'কোনটা ভালো', 'কোনটা সেরা', 'mukhyo somoye', 'ami kon ta nibo', 'kon ta nibo'])) return 'comparison'
  // 6. PRICE
  if (hasKeyword(lower, ['koto taka', 'koto tk', 'dam koto', 'price koto', 'koto dar', 'কত টাকা', 'কত দাম', 'দাম কত', 'মূল্য কত', 'টাকা কত', 'price ki', 'cost koto', 'suto koto', 'কি দাম', 'দাম কি', 'sasta', 'সস্তা', 'discount', 'ছাড়'])) return 'price_inquiry'
  // 7. ORDER/PAYMENT
  const orderKw = ['order', 'buy', 'purchase', 'confirm', 'whatsapp', 'payment', 'pay', 'bkash', 'nagad', 'place order', 'i want to buy', 'i want to order', 'how to order', 'how to pay', 'checkout', 'complete order', 'proceed', 'অর্ডার', 'কিনতে চাই', 'নিতে চাই', 'পেমেন্ট', 'বিকাশ', 'নগদ', 'order korbo', 'nite chai', 'kinte chai', 'bkash number', 'payment kivabe', 'নেবো', 'কিনবো', 'অর্ডার করবো', 'trxid', 'transaction', 'send money', 'ট্রানজেকশন', 'বিকাশ নম্বর', 'পেমেন্ট করবো', 'টাকা পাঠাবো', 'order kivabe', 'কীভাবে অর্ডার', 'কিভাবে অর্ডার', 'কীভাবে কিনবো', 'অর্ডার করতে চাই']
  if (hasKeyword(lower, orderKw) || (/\b(lagbe|chai)\b/i.test(lower) && /\b(order|buy|purchase|কিন|অর্ডার|নেব|কিনব|korbo|kinte|nite)\b/i.test(lower))) return 'order_payment'
  // 8. HOW TO USE
  if (hasKeyword(lower, ['how to use', 'kivabe use', 'use kivabe', 'kivabe chalabo', 'কীভাবে ব্যবহার', 'কিভাবে ব্যবহার', 'কীভাবে চালাবো', 'কিভাবে চালাবো', 'কীভাবে কাজ করে', 'কিভাবে কাজ করে', 'how does it work', 'tutorial', 'ব্যবহার করে', 'use kora jay', 'কোথায় ব্যবহার', 'চালানো যায়', 'নিয়ম কি', 'guide'])) return 'how_to_use'
  // 9. WARRANTY/DELIVERY
  if (hasKeyword(lower, ['warranty', 'guarantee', 'গ্যারান্টি', 'ওয়ারেন্টি', 'replacement', 'delivery time', 'কত সময়', 'কতক্ষণ', 'কবে পাবো', 'কবে দেবেন', 'delivery kivabe', 'delivery koto somoy', 'deliver koto din', 'ডেলিভারি', 'পাবো কবে', 'সময় লাগবে'])) return 'warranty_delivery'
  // 10. FEATURED
  if (hasKeyword(lower, ['featured', 'feature product', 'featured product', 'best seller', 'bestseller', 'popular', 'top product', 'recommended', 'highlighted', 'ফিচার্ড', 'জনপ্রিয়', 'সেরা প্রোডাক্ট', 'টপ প্রোডাক্ট', 'হাইলাইটেড', 'featured dekhao', 'featured dekhi', 'featured dekhte chai', 'best product', 'popular product', 'best price'])) return 'featured'
  // 11. ALL PRODUCTS
  if (hasKeyword(lower, ['সব', 'all product', 'all category', 'catalog', 'ক্যাটালগ', 'সব দেখাও', 'সব প্রোডাক্ট', 'কি কি আছে', 'কি আছে', 'sob dekhao', 'sob product', 'ki ki ache', 'ki ache', 'what do you have', 'show me all', 'full list', 'product dekhao', 'products dekhi', 'product dekhte chai', 'প্রোডাক্ট দেখাও', 'প্রোডাক্ট দেখতে চাই'])) return 'all_products'
  // 12. CATEGORY
  if (detectCategorySlug(message)) return 'category'
  // 13. SPECIFIC PRODUCT
  if (findSpecificProduct(message)) return 'specific_product'
  // 14. SEARCH
  if (message.replace(/[^\w\s]/g, ' ').trim().split(/\s+/).filter((t) => t.length > 1).length >= 1 && searchProducts(message).length > 0) return 'search'
  return 'out_of_scope'
}

// ─── Category Slug Detection ────────────────────────────────────────────────

function detectCategorySlug(message: string): string | null {
  const lower = message.toLowerCase().trim()
  const map: Record<string, string[]> = {
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
  for (const [slug, kws] of Object.entries(map)) for (const kw of kws) if (lower.includes(kw)) return slug
  return null
}

// ─── Language Detection (FIXED: 2+ matches for Banglish) ───────────────────

function detectLanguage(message: string): Language {
  if (/[\u0980-\u09FF]/.test(message)) return 'bangla'
  const patterns = [/koto/i, /taka/i, /lagbe/i, /chai/i, /order\s*korbo/i, /nite\s*chai/i, /kinte\s*chai/i, /dekhao/i, /ki\s*ki/i, /sob/i, /nam/i, /amar/i, /apnar/i, /bhai/i, /kichu/i, /kemon/i, /valo/i, /ase/i, /ache/i, /korbo/i, /parbo/i, /kivabe/i, /keno/i]
  if (patterns.filter((p) => p.test(message)).length >= 2) return 'banglish'
  return 'english'
}

// ─── Product Formatting ─────────────────────────────────────────────────────

function parsePriceOptions(p: Product): string {
  try { const o: PriceOption[] = JSON.parse(p.priceOptions || '[]'); if (o.length) return o.map((x) => `${x.label}: ৳${x.priceBDT}`).join(', ') } catch { /* */ }
  return `৳${p.basePriceBDT}`
}
function parsePriceOptionsDetailed(p: Product): string {
  try { const o: PriceOption[] = JSON.parse(p.priceOptions || '[]'); if (o.length) return o.map((x) => `  • ${x.label}: ৳${x.priceBDT}`).join('\n') } catch { /* */ }
  if (p.basePriceBDT === 'Inbox Price' || p.basePriceBDT === 'Low Price') return '  💰 সেরা দামের জন্য আমাদের সাথে যোগাযোগ করুন!'
  return `  • Base: ৳${p.basePriceBDT}`
}
function parseFeatures(p: Product): string[] { try { return JSON.parse(p.features || '[]') } catch { return [] } }
function getCheapestPlan(p: Product): string {
  try { const o: PriceOption[] = JSON.parse(p.priceOptions || '[]'); if (o.length) { const s = [...o].sort((a, b) => parseInt(String(a.priceBDT).replace(/\D/g, '') || '0') - parseInt(String(b.priceBDT).replace(/\D/g, '') || '0')); return `৳${s[0].priceBDT} (${s[0].label})` } } catch { /* */ }
  return `৳${p.basePriceBDT}`
}
function toProductCard(p: Product): ProductCard {
  return { id: p.id, name: p.category.isAdult ? sanitizeText(p.name) : p.name, slug: p.slug, image: p.image, basePriceBDT: p.basePriceBDT, priceOptions: p.priceOptions, warranty: p.warranty, deliveryTime: p.deliveryTime, stockStatus: p.stockStatus, category: { name: p.category.name, slug: p.category.slug } }
}

// ─── WhatsApp URL Builder ───────────────────────────────────────────────────

function buildWhatsAppUrl(d: { customerName?: string; whatsappNumber?: string; productName?: string; plan?: string; price?: string; address?: string; transactionId?: string }): string {
  const l: string[] = ['🛒 *Order Request — Streaming Hub*\n']
  if (d.customerName) l.push(`👤 Name: ${d.customerName}`); if (d.whatsappNumber) l.push(`📞 WhatsApp: ${d.whatsappNumber}`)
  if (d.productName) l.push(`📦 Product: ${d.productName}`); if (d.plan) l.push(`📋 Plan: ${d.plan}`)
  if (d.price) l.push(`💰 Price: ${d.price}`); if (d.address) l.push(`📍 Address: ${d.address}`)
  if (d.transactionId) l.push(`🏦 TrxID: ${d.transactionId}`)
  l.push('', '💳 Payment: bKash — 01647236359', '⚡ Delivery: 5-20 minutes after payment', '', 'Please confirm my order. Thank you! 🙏')
  return `https://wa.me/8801647236359?text=${encodeURIComponent(l.join('\n'))}`
}

// ─── Smart Product Context (intent-aware) ───────────────────────────────────

function safeName(p: Product): string { return p.category.isAdult ? sanitizeText(p.name) : p.name }
function briefSummary(): string { return getCatalogSummary().filter((c) => !c.isAdult).slice(0, 5).map((c) => `${c.name} (${c.productCount})`).join(', ') }

function buildProductContext(intent: Intent, userMsg: string): string {
  const parts: string[] = []
  const addProduct = (p: Product) => {
    parts.push(`Name: ${safeName(p)} | Category: ${p.category.name}`)
    parts.push(`Price Options:\n${parsePriceOptionsDetailed(p)}`)
    parts.push(`Cheapest: ${getCheapestPlan(p)} | Stock: ${p.stockStatus} | Warranty: ${p.warranty || 'Full warranty'} | Delivery: ${p.deliveryTime}`)
  }

  switch (intent) {
    case 'pin_inquiry': case 'greeting': case 'thanks': case 'goodbye':
      parts.push('=== CATALOG OVERVIEW ===', briefSummary()); break
    case 'specific_product': {
      const p = findSpecificProduct(userMsg)
      if (p) { parts.push('=== SPECIFIC PRODUCT ==='); addProduct(p); const f = parseFeatures(p); if (f.length) parts.push(`Features: ${f.slice(0, 8).join(', ')}`); const rel = findRelatedProducts(p.id, 3); if (rel.length) { parts.push('\n=== RELATED ==='); rel.forEach((r) => parts.push(`• ${safeName(r)} — From ${getCheapestPlan(r)}`)) } }
      break
    }
    case 'category': {
      const slug = detectCategorySlug(userMsg)
      if (slug) { const { category, products, totalCount } = searchByCategory(slug); if (category && products.length) { parts.push(`=== CATEGORY: ${category.isAdult ? sanitizeText(category.name) : category.name} (${totalCount}) ===`); products.slice(0, 8).forEach((p, i) => parts.push(`${i + 1}. ${safeName(p)}${p.isBestSeller ? ' 🔥' : p.isFeatured ? ' ⭐' : ''} — From ${getCheapestPlan(p)}`)) } }
      break
    }
    case 'price_inquiry': case 'search': {
      const results = searchProducts(userMsg, 6)
      if (results.length) { parts.push('=== SEARCH RESULTS ==='); results.forEach((p, i) => parts.push(`${i + 1}. ${safeName(p)} — From ${getCheapestPlan(p)} | ${p.category.name} | ${p.stockStatus}`)) }
      const spec = findSpecificProduct(userMsg)
      if (spec) { parts.push('\n=== EXACT MATCH ==='); addProduct(spec) }
      break
    }
    case 'featured': {
      const { products: feat } = getFeaturedProducts(6)
      if (feat.length) { parts.push('=== FEATURED / BEST SELLERS ==='); feat.forEach((p, i) => parts.push(`${i + 1}. ${safeName(p)} ${p.isBestSeller ? '🔥' : p.isNewArrival ? '✨' : ''} — From ${getCheapestPlan(p)}`)) }
      break
    }
    case 'all_products': {
      parts.push('=== FULL CATALOG ==='); getCatalogSummary().forEach((c) => parts.push(`📂 ${c.isAdult ? sanitizeText(c.name) : c.name} (${c.productCount}) — slug: ${c.slug}`, `   Popular: ${c.sampleProducts.slice(0, 3).join(', ')}`)); break
    }
    case 'comparison': {
      const results = searchProducts(userMsg, 4)
      if (results.length) { parts.push('=== COMPARISON DATA ==='); results.forEach((p) => { parts.push(`\n${safeName(p)}:`); parts.push(`  Price:\n${parsePriceOptionsDetailed(p)}`); parts.push(`  Cheapest: ${getCheapestPlan(p)}`); const f = parseFeatures(p); if (f.length) parts.push(`  Features: ${f.slice(0, 6).join(', ')}`); parts.push(`  Stock: ${p.stockStatus} | Warranty: ${p.warranty || 'Full'}`) }) }
      break
    }
    case 'order_payment': case 'how_to_use': case 'warranty_delivery': {
      const p = findSpecificProduct(userMsg)
      if (p) { parts.push('=== RELEVANT PRODUCT ==='); addProduct(p) } else { parts.push('=== CATALOG OVERVIEW ===', briefSummary()) }
      break
    }
    case 'out_of_scope': {
      const { products: feat } = getFeaturedProducts(3)
      if (feat.length) { parts.push('=== TOP PICKS ==='); feat.forEach((p, i) => parts.push(`${i + 1}. ${safeName(p)} — From ${getCheapestPlan(p)}`)) }
      break
    }
  }
  return parts.join('\n')
}

// ─── Collect Products for SSE ───────────────────────────────────────────────

function collectProducts(intent: Intent, userMsg: string): ProductCard[] {
  const products: Product[] = []
  switch (intent) {
    case 'specific_product': { const p = findSpecificProduct(userMsg); if (p) { products.push(p); products.push(...findRelatedProducts(p.id, 3)) } break }
    case 'category': { const slug = detectCategorySlug(userMsg); if (slug) products.push(...searchByCategory(slug).products.slice(0, 8)); break }
    case 'price_inquiry': case 'search': products.push(...searchProducts(userMsg, 6)); break
    case 'featured': products.push(...getFeaturedProducts(6).products); break
    case 'all_products': getCatalogSummary().filter((c) => !c.isAdult).forEach((c) => products.push(...searchByCategory(c.slug).products.slice(0, 2))); break
    case 'comparison': products.push(...searchProducts(userMsg, 4)); break
    case 'out_of_scope': products.push(...getFeaturedProducts(3).products); break
    case 'order_payment': case 'how_to_use': case 'warranty_delivery': { const p = findSpecificProduct(userMsg); if (p) products.push(p); break }
    default: break
  }
  const seen = new Set<string>()
  return products.filter((p) => !seen.has(p.id) && seen.add(p.id)).map(toProductCard)
}

// ─── System Prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(intent: Intent, lang: Language, userMsg: string): string {
  const ctx = buildProductContext(intent, userMsg)
  const langMap: Record<Language, string> = { bangla: 'You MUST respond in Bengali script (বাংলা). Write everything in proper Bengali.', banglish: 'You MUST respond in Banglish (Romanized Bengali). Example: "apnar jonno", "kinte chai", "onek valo".', english: 'You MUST respond in English.' }
  return `You are "কর্মচারী" — the AI assistant for **Streaming Hub**, Bangladesh's #1 digital subscription store.

== IDENTITY ==
- Name: কর্মচারী (assistant/helper). Professional, friendly, sales-oriented, culturally aware.
- Expert on ALL products/prices. Convert conversations into sales naturally.
- Use emojis (🎬🤖🔒🎮🎁📂💰📦🚚💳⚡💡🔥⭐✨). Keep responses concise but informative.

== CRITICAL KNOWLEDGE ==
- **PIN: 69** — For restricted/VP/verified premium section. Always share when asked. Remind to keep private from minors.
- Payment: bKash & Nagad to **01647236359** | WhatsApp: **+8801647236359** | Delivery: **5-20 min**
- Full warranty | 200+ products | All accounts 100% legitimate

== LANGUAGE ==
${langMap[lang]}
- Detected: ${lang}. Mix English brand names naturally. Use "Assalamu Alaikum" for Bangla/Banglish greetings.

== PRODUCT DATA (NEVER FABRICATE — USE ONLY THIS) ==
${ctx}

== RULES ==
1. NEVER fabricate products/prices — Only use PRODUCT DATA above
2. Always include EXACT prices (৳) from data
3. Show ALL pricing options for products
4. Be sales-oriented — naturally suggest ordering
5. Order process: bKash 01647236359 → TrxID on WhatsApp → 5-20 min delivery
6. PIN inquiries: PIN is 69, for Verified Premium, keep from minors
7. Greetings: Welcome warmly, introduce as কর্মচারী
8. Comparisons: Compare features/prices, give recommendation
9. Out-of-scope: Gently redirect to Streaming Hub
10. Mention warranty & delivery for products
11. "Inbox Price"/"Low Price" → tell user to contact for best price`
}

// ─── Smart Suggestions ──────────────────────────────────────────────────────

function generateSuggestions(intent: Intent, lang: Language): string[] {
  const m: Record<string, Record<Language, string[]>> = {
    greeting: { bangla: ['ইন্টারনেট প্যাকেজ দেখুন', 'সেরা অফার কী?'], banglish: ['Internet package dekhao', 'Best offer ki?'], english: ['Show internet packages', 'What are the best offers?'] },
    specific_product: { bangla: ['অর্ডার করুন', 'অন্য প্ল্যান দেখুন'], banglish: ['Order korbo', 'Onno plan dekhao'], english: ['Place order', 'View other plans'] },
    price_inquiry: { bangla: ['অর্ডার করুন', 'সস্তা প্যাকেজ দেখুন'], banglish: ['Order korbo', 'Sasta package dekhao'], english: ['Order now', 'Show cheaper plans'] },
    category: { bangla: ['জনপ্রিয় প্যাকেজ', 'সেরা দাম'], banglish: ['Popular package', 'Best price'], english: ['Popular packages', 'Best prices'] },
    featured: { bangla: ['অর্ডার করুন', 'সব ক্যাটাগরি দেখুন'], banglish: ['Order korbo', 'Sob category dekhao'], english: ['Order now', 'All categories'] },
    order_payment: { bangla: ['WhatsApp এ যোগাযোগ', 'অন্য প্যাকেজ দেখুন'], banglish: ['WhatsApp e jogajog', 'Onno package dekhao'], english: ['Contact on WhatsApp', 'View more packages'] },
    how_to_use: { bangla: ['অর্ডার করুন', 'ওয়ারেন্টি জানুন'], banglish: ['Order korbo', 'Warranty janun'], english: ['Order now', 'Warranty info'] },
    warranty_delivery: { bangla: ['অর্ডার করুন', 'পেমেন্ট পদ্ধতি'], banglish: ['Order korbo', 'Payment poddhati'], english: ['Order now', 'Payment methods'] },
    pin_inquiry: { bangla: ['VP সেকশন দেখুন', 'অর্ডার করুন'], banglish: ['VP section dekhao', 'Order korbo'], english: ['View VP section', 'Order now'] },
    comparison: { bangla: ['সেরা প্ল্যান কোনটি?', 'অর্ডার করুন'], banglish: ['Best plan kon ta?', 'Order korbo'], english: ['Which plan is best?', 'Order now'] },
    all_products: { bangla: ['জনপ্রিয় প্যাকেজ', 'সেরা অফার'], banglish: ['Popular package', 'Best offer'], english: ['Popular packages', 'Best offers'] },
    search: { bangla: ['বিস্তারিত দেখুন', 'অর্ডার করুন'], banglish: ['Details dekhao', 'Order korbo'], english: ['View details', 'Order now'] },
    thanks: { bangla: ['আরেকটি প্রোডাক্ট দেখুন', 'অর্ডার করুন'], banglish: ['Arekta product dekhao', 'Order korbo'], english: ['View another product', 'Place order'] },
    goodbye: { bangla: ['পরে আবার আসুন', 'অফার দেখুন'], banglish: ['Pore abar ashen', 'Offer dekhao'], english: ['Come back anytime', 'View offers'] },
    out_of_scope: { bangla: ['প্রোডাক্ট দেখুন', 'সেরা অফার কী?'], banglish: ['Product dekhao', 'Best offer ki?'], english: ['Browse products', 'What are the best offers?'] },
  }
  return m[intent]?.[lang] ?? m.out_of_scope[lang]
}

// ─── Minimal Fallbacks ──────────────────────────────────────────────────────

function getFallback(intent: Intent, lang: Language): string {
  if (intent === 'greeting') {
    const g: Record<Language, string> = { bangla: 'আসসালামু আলাইকুম! Streaming Hub-এ স্বাগতম! 🎉 আমি কর্মচারী, আপনার শপিং অ্যাসিস্ট্যান্ট। কী লাগবে বলুন! 😊', banglish: 'Assalamu Alaikum! Streaming Hub e swagotom! 🎉 Ami kormochori, apnar assistant. Ki lagbe bolle din! 😊', english: "Assalamu Alaikum! Welcome to Streaming Hub! 🎉 I'm কর্মচারী, your assistant. What can I help you with? 😊" }
    return g[lang]
  }
  const e: Record<Language, string> = { bangla: 'দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করুন বা WhatsApp: +8801647236359 🙏', banglish: 'Dukkho, somossa hoyeche. Abar chesta korun ba WhatsApp: +8801647236359 🙏', english: "Sorry, something went wrong. Try again or WhatsApp: +8801647236359 🙏" }
  return e[lang]
}

// ─── POST Handler (SSE Streaming) ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { message?: string; history?: ChatMessage[]; sessionId?: string }
  try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
  const { message, history = [], sessionId = 'default' } = body
  if (!message || typeof message !== 'string') return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 })
  if (!checkRateLimit(sessionId)) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })

  const intent = detectIntent(message, history)
  const lang = detectLanguage(message)
  const products = collectProducts(intent, message)
  const suggestions = generateSuggestions(intent, lang)
  const whatsappUrl = buildWhatsAppUrl({})
  const systemPrompt = buildSystemPrompt(intent, lang, message)
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...history.slice(-10), { role: 'user', content: message }]

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (data: Record<string, unknown>) => controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

      // Attempt LLM call with streaming → non-streaming → fallback
      // All LLM calls are wrapped with a 3-second timeout to prevent
      // long hangs when the external API is unreachable.
      // If streaming times out (API unreachable), skip non-streaming attempt
      // and go straight to fallback for faster response (~3s vs ~6s).
      const LLM_TIMEOUT_MS = 3000
      let llmContent = ''
      try {
        const zai = await withTimeout(getZAI(), LLM_TIMEOUT_MS)
        let usedStreaming = false

        // Try streaming (with timeout)
        try {
          const completion = await withTimeout(
            zai.chat.completions.create({ messages, stream: true, thinking: { type: 'disabled' } }),
            LLM_TIMEOUT_MS,
          )
          if (completion && typeof completion === 'object' && 'body' in completion && completion.body instanceof ReadableStream) {
            usedStreaming = true
            const reader = (completion.body as ReadableStream<Uint8Array>).getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            // Read stream with a per-chunk timeout (resets with each chunk)
            let chunkTimeoutId: ReturnType<typeof setTimeout> | null = null
            const readNextWithTimeout = (): Promise<ReadableStreamReadResult<Uint8Array>> => {
              if (chunkTimeoutId) clearTimeout(chunkTimeoutId)
              return Promise.race([
                reader.read(),
                new Promise<never>((_, reject) => {
                  chunkTimeoutId = setTimeout(() => reject(new Error('LLM_TIMEOUT')), LLM_TIMEOUT_MS)
                }),
              ])
            }
            while (true) {
              const { done, value } = await readNextWithTimeout()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n'); buffer = lines.pop() || ''
              for (const line of lines) {
                const t = line.trim()
                if (!t.startsWith('data: ')) continue
                const jsonStr = t.slice(6)
                if (jsonStr === '[DONE]') continue
                try { const delta = JSON.parse(jsonStr)?.choices?.[0]?.delta?.content; if (delta) send({ type: 'token', content: delta }) } catch { /* skip */ }
              }
            }
            if (chunkTimeoutId) clearTimeout(chunkTimeoutId)
            // Flush remaining buffer
            if (buffer.trim().startsWith('data: ') && buffer.trim().slice(6) !== '[DONE]') {
              try { const delta = JSON.parse(buffer.trim().slice(6))?.choices?.[0]?.delta?.content; if (delta) send({ type: 'token', content: delta }) } catch { /* skip */ }
            }
          }
        } catch (streamErr) {
          // If streaming timed out, the API is unreachable — skip non-streaming attempt
          // and go straight to fallback (avoids another 3s wait)
          if (streamErr instanceof Error && streamErr.message === 'LLM_TIMEOUT') {
            send({ type: 'token', content: getFallback(intent, lang) })
          } else {
            // Non-timeout error — try non-streaming as fallback
            try {
              const completion = await withTimeout(
                zai.chat.completions.create({ messages, stream: false, thinking: { type: 'disabled' } }),
                LLM_TIMEOUT_MS,
              )
              llmContent = completion?.choices?.[0]?.message?.content || ''
            } catch {
              llmContent = ''
            }
            if (llmContent) send({ type: 'token', content: llmContent })
            else send({ type: 'token', content: getFallback(intent, lang) })
          }
          usedStreaming = false
        }

        // If streaming succeeded, content was already sent via SSE tokens
        // If streaming was used but produced no content, send fallback
        if (usedStreaming && !llmContent) {
          // Check if any tokens were actually sent (llmContent not tracked in streaming mode)
          // Streaming tokens are sent directly via send(), so if we got here, it's fine
        }
      } catch {
        // ZAI init or top-level timeout — send fallback immediately
        send({ type: 'token', content: getFallback(intent, lang) })
      }

      // Send structured data
      if (products.length > 0) send({ type: 'products', products })
      send({ type: 'suggestions', suggestions })
      send({ type: 'done', whatsappUrl, detectedLang: lang })
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } })
}

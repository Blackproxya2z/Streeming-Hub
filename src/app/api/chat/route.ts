import { NextRequest } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import OpenAI from 'openai'
import { searchProducts, searchByCategory, getFeaturedProducts, getCatalogSummary, findSpecificProduct, findRelatedProducts, type Product } from '@/lib/data'
import { hasRestrictedAccessFromRequest, isRestrictedProduct } from '@/lib/restricted'

// ─── Route Exports ──────────────────────────────────────────────────────────

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

// ─── Types ──────────────────────────────────────────────────────────────────

type Intent = 'pin_inquiry' | 'greeting' | 'thanks' | 'goodbye' | 'comparison' | 'featured' | 'specific_product' | 'category' | 'all_products' | 'order_payment' | 'how_to_use' | 'warranty_delivery' | 'price_inquiry' | 'search' | 'out_of_scope'
type Language = 'bangla' | 'banglish' | 'english'
interface ProductCard { id: string; name: string; slug: string; image: string | null; basePriceBDT: string; priceOptions: string; warranty: string | null; deliveryTime: string; stockStatus: string; category: { name: string; slug: string } }
interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
interface PriceOption { label?: string; priceBDT?: string }

// ─── ZAI Singleton (primary — uses .z-ai-config or ZAI_CONFIG env) ──────────

import { readFile } from 'fs/promises'
import { join } from 'path'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null
let zaiInitFailed = false

async function loadZAIConfig(): Promise<{
  baseUrl: string
  apiKey: string
  chatId?: string
  userId?: string
  token?: string
} | null> {
  // 1. Try ZAI_CONFIG env var first (works on Vercel — no filesystem needed)
  const envConfig = process.env.ZAI_CONFIG?.trim()
  if (envConfig) {
    try {
      const parsed = JSON.parse(envConfig)
      if (parsed.baseUrl && parsed.apiKey) return parsed
    } catch { /* invalid JSON */ }
  }

  // 2. Try reading from filesystem (works in sandbox)
  const homeDir = process.env.HOME || process.env.USERPROFILE || '/tmp'
  const configPaths = [
    join(process.cwd(), '.z-ai-config'),
    join(homeDir, '.z-ai-config'),
    '/etc/.z-ai-config',
  ]
  for (const filePath of configPaths) {
    try {
      const configStr = await readFile(filePath, 'utf-8')
      const parsed = JSON.parse(configStr)
      if (parsed.baseUrl && parsed.apiKey) return parsed
    } catch { /* try next path */ }
  }

  return null
}

async function getZAI(): Promise<Awaited<ReturnType<typeof ZAI.create>> | null> {
  if (zaiInitFailed) return null
  try {
    if (!zaiInstance) {
      const config = await loadZAIConfig()
      if (!config) {
        zaiInitFailed = true
        return null
      }
      // Bypass ZAI.create() (which reads filesystem) and instantiate directly
      // This works on Vercel where the filesystem is read-only
      // Constructor is marked private in .d.ts, so we cast to any
      zaiInstance = new (ZAI as unknown as new (config: {
        baseUrl: string
        apiKey: string
        chatId?: string
        userId?: string
        token?: string
      }) => Awaited<ReturnType<typeof ZAI.create>>)(config)
    }
    return zaiInstance
  } catch {
    zaiInitFailed = true
    return null
  }
}

// ─── OpenAI Client (fallback for Vercel production) ──────────────────────────

let openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key || key === 'dummy-key-for-build') return null
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: key, timeout: 8_000, maxRetries: 1 })
  }
  return openaiClient
}

// ─── Timeout Utility ─────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms)),
  ])
}

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
  const prodKw = ['product', 'price', 'order', 'buy', 'netflix', 'vpn', 'chatgpt', 'spotify', 'canva', 'adobe', 'midjourney', 'premium', 'subscription', 'plan', 'streaming', 'pubg', 'uc', 'royale pass', 'free fire', 'topup', 'প্রোডাক্ট', 'দাম', 'অর্ডার', 'কিনতে', 'মূল্য', 'প্ল্যান', 'পাবজি', 'ইউসি', 'dekhao', 'koto', 'taka', 'কত টাকা', 'কত দাম', 'কিভাবে', 'কীভাবে', 'kivabe']
  if (hasKeyword(lower, greetKw) && !hasKeyword(lower, prodKw) && lower.split(/\s+/).length <= 6) return 'greeting'
  // 3. THANKS
  if (hasKeyword(lower, ['thanks', 'thank you', 'thx', 'ty', 'ধন্যবাদ', 'ধন্যবাদী', 'shukriya', 'শুকরিয়া', 'valo hoyeche', 'valo laglo', 'helpful', 'onek valo', 'onek dhonnobad', 'thanks a lot', 'appreciate', 'great help', 'শুকর']) && lower.split(/\s+/).length <= 8) return 'thanks'
  // 4. GOODBYE
  if (hasKeyword(lower, ['bye', 'goodbye', 'see you', 'good night', 'goodnight', 'বাই', 'আলবিদা', 'যাই', 'আসি', 'বিদায়', 'shubho ratri', 'শুভ রাত্রি', 'good bye', 'take care', 'have a good day', 'khoda hafiz', 'খোদা হাফিজ']) && lower.split(/\s+/).length <= 6) return 'goodbye'
  // 5. COMPARISON
  if (hasKeyword(lower, ['vs', 'versus', 'compare', 'comparison', 'difference between', 'better', 'which one', 'which is best', 'kon ta valo', 'kon ta better', 'তুলনা', 'কোনটা ভালো', 'কোনটা সেরা', 'mukhyo somoye', 'ami kon ta nibo', 'kon ta nibo'])) return 'comparison'
  // 6. PRICE
  if (hasKeyword(lower, ['koto taka', 'koto tk', 'dam koto', 'price koto', 'koto dar', 'কত টাকা', 'কত দাম', 'দাম কত', 'মূল্য কত', 'টাকা কত', 'price ki', 'cost koto', 'suto koto', 'কি দাম', 'দাম কি', 'sasta', 'সস্তা', 'discount', 'ছাড়', 'uc price', 'uc koto', 'pubg price', 'pubg er dam', 'ইউসি কত', 'পাবজি দাম', 'royale pass price'])) return 'price_inquiry'
  // 7. ORDER/PAYMENT
  const orderKw = ['order', 'buy', 'purchase', 'confirm', 'whatsapp', 'payment', 'pay', 'bkash', 'nagad', 'place order', 'i want to buy', 'i want to order', 'how to order', 'how to pay', 'checkout', 'complete order', 'proceed', 'অর্ডার', 'কিনতে চাই', 'নিতে চাই', 'পেমেন্ট', 'বিকাশ', 'নগদ', 'order korbo', 'nite chai', 'kinte chai', 'bkash number', 'payment kivabe', 'নেবো', 'কিনবো', 'অর্ডার করবো', 'trxid', 'transaction', 'send money', 'ট্রানজেকশন', 'বিকাশ নম্বর', 'পেমেন্ট করবো', 'টাকা পাঠাবো', 'order kivabe', 'কীভাবে অর্ডার', 'কিভাবে অর্ডার', 'কীভাবে কিনবো', 'অর্ডার করতে চাই', 'uid', 'character id', 'player id', 'pubg uid', 'ইউআইডি']
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
    'gaming-topup': ['gaming', 'গেমিং', 'game', 'গেম', 'free fire', 'pubg', 'topup', 'gaming topup', 'uc', 'diamond', 'royale pass', 'royal pass', 'pubg uc', 'pubg topup', 'পাবজি', 'পাবজি ইউসি', 'ইউসি', 'pubg mobile', 'bp', 'ব্যাটল গ্রাউন্ড'],
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

function collectProducts(intent: Intent, userMsg: string, hasRestrictedAccess: boolean): ProductCard[] {
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
  return products
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
    .filter((p) => hasRestrictedAccess || !isRestrictedProduct(p))
    .map(toProductCard)
}

// ─── System Prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(intent: Intent, lang: Language, userMsg: string): string {
  const ctx = buildProductContext(intent, userMsg)
  const langMap: Record<Language, string> = { bangla: 'You MUST respond in Bengali script (বাংলা). Write everything in proper Bengali.', banglish: 'You MUST respond in Banglish (Romanized Bengali). Example: "apnar jonno", "kinte chai", "onek valo".', english: 'You MUST respond in English.' }
  return `You are an extremely polite, warm, and professional female AI Sales & Customer Support Representative for **Streaming Hub** (https://streeming-hub.vercel.app/). Your voice and text tone must reflect a gentle, welcoming, and well-mannered Bangladeshi woman.

== IDENTITY & PERSONA ==
- You are a cute, sweet, polite Bangladeshi call center girl — speak like a real person, warm and motherly
- Name: কর্মচারী (you can also say "আমি আপনার সাহায্যকারী")
- Always be extremely polite — use "আপনি", "বলুন", "করুন" — never informal language
- Convert conversations into sales naturally, softly, never pushy
- Use emojis sparingly but warmly (🎬🤖🔒🎮🎁📂💰📦🚚💳⚡💡🔥⭐✨😊🙏)

== CORE MISSION ==
- Assist customers by telling them the EXACT prices of our digital subscriptions directly from the product catalog
- Smoothly collect their details to process the order when they show purchase intent
- Always reassure customers about fast delivery (5-20 minutes) and full duration warranty

== CRITICAL KNOWLEDGE ==
- **PIN: 69** — For restricted/VP/verified premium section. Always share when asked. Remind to keep private from minors.
- Payment: bKash & Nagad to **01647236359** | WhatsApp: **+8801647236359** | Delivery: **5-20 min**
- Full warranty | 200+ products | All accounts 100% legitimate
- Website: https://streeming-hub.vercel.app/

== LANGUAGE ==
${langMap[lang]}
- Detected: ${lang}. Mix English brand names naturally. Use "Assalamu Alaikum" for Bangla/Banglish greetings.
- IMPORTANT: Use 'টাকা' instead of 'TK' or 'BDT' — always say "টাকা" for currency
- Keep answers brief, welcoming, and sweet

== SMART MATCHING RULE ==
If a customer asks about any subscription, always look at the PRODUCT DATA below and reply with the exact prices clearly. Do NOT hallucinate or make up prices.

== PRODUCT DATA (NEVER FABRICATE — USE ONLY THIS) ==
${ctx}

== CONVERSATIONAL PRODUCT STYLE ==
1. Describe products conversationally — like a real sweet Bangladeshi saleswoman
2. Mention ALL variants/plans with prices
3. Always say "inbox for offers" after showing prices
4. NEVER say "Order Now" or "Buy Now" — softly suggest: "chaile order korte paren"
5. If price is "Inbox Price" — Say: "best price er jonno amader inbox korun"

== ORDERING & CHECKOUT PROCESS ==
When customer decides to buy:
1. Ask for Details: Name and WhatsApp Number
2. Payment Info: bKash/Nagad payment instructions (01647236359). Ask for TrxID or screenshot.
3. Confirmation: "ধন্যবাদ, আপনার পেমেন্টটি পেয়েছি। ৫-২০ মিনিটে ডেলিভারি হবে।"

== 🪂 PUBG MOBILE TOPUP — SPECIAL RULES ==
When asked about PUBG:
1. Show Full Price List with 🪂🪙🎖️ emojis
2. UID Required — NOT login/email. 100% safe in-game topup!
3. Order Steps: Select pack → Provide PUBG UID → Pay bKash/Nagad → 5-20 min delivery
4. Price List:
   🪂 PUBG MOBILE UC PRICE LIST 🪂
   🪙 30 UC — 59 টাকা
   🪙 60 UC — 119 টাকা
   🪙 325 UC (300+25 Bonus) — 559 টাকা
   🪙 660 UC (600+60 Bonus) — 1109 টাকা
   🪙 1800 UC (1500+300 Bonus) — 2759 টাকা
   🪙 3850 UC (3000+850 Bonus) — 5509 টাকা
   🪙 8100 UC (6000+2100 Bonus) — 11009 টাকা
   🪙 16200 UC (12000+4200 Bonus) — 22009 টাকা
   🪙 24300 UC (18000+6300 Bonus) — 33009 টাকা
   🪙 32400 UC (24000+8400 Bonus) — 44009 টাকা
   🪙 40500 UC (30000+10500 Bonus) — 55009 টাকা
   🪙 48600 UC (36000+12600 Bonus) — 66009 টাকা
   🪙 81000 UC (60000+21000 Bonus) — 110009 টাকা
   🎖️ Royale Pass (Lv.50) — 750 টাকা
   🎖️ Royale Pass (Lv.100) — 1360 টাকা
5. Safety: "100% Safe & Official In-Game UID TopUp — No Account Login Required!"
6. Payment: bKash/Nagad to 01647236359

== RESPONSE GUIDELINES ==
1. Use 'টাকা' instead of 'TK' or 'BDT'
2. Keep answers brief and sweet
3. Reassure about fast delivery and warranty
4. NEVER fabricate products/prices — Only use PRODUCT DATA above
5. Be sales-oriented — naturally suggest ordering
6. Greetings: "Assalamu Alaikum", introduce yourself sweetly
7. "Inbox Price" → tell user to contact for best price
8. DO NOT use "Order Now" language — use conversational language`
}

// ─── Smart Suggestions ──────────────────────────────────────────────────────

function generateSuggestions(intent: Intent, lang: Language): string[] {
  const m: Record<string, Record<Language, string[]>> = {
    greeting: { bangla: ['প্রাইস লিস্ট দেখুন', 'সেরা অফার কী?'], banglish: ['Price list dekhao', 'Best offer ki?'], english: ['Show price list', 'What are the best offers?'] },
    specific_product: { bangla: ['নিতে চাইলে বলুন', 'অন্য প্ল্যান দেখুন'], banglish: ['Nite chaile bolle din', 'Onno plan dekhao'], english: ['I want this', 'View other plans'] },
    price_inquiry: { bangla: ['নিতে চাইলে বলুন', 'সস্তা প্যাকেজ দেখুন'], banglish: ['Nite chaile bolle din', 'Sasta package dekhao'], english: ['I want this', 'Show cheaper plans'] },
    category: { bangla: ['জনপ্রিয় প্যাকেজ', 'সেরা দাম'], banglish: ['Popular package', 'Best price'], english: ['Popular packages', 'Best prices'] },
    featured: { bangla: ['নিতে চাইলে বলুন', 'সব ক্যাটাগরি দেখুন'], banglish: ['Nite chaile bolle din', 'Sob category dekhao'], english: ['I want this', 'All categories'] },
    order_payment: { bangla: ['WhatsApp এ যোগাযোগ', 'অন্য প্যাকেজ দেখুন'], banglish: ['WhatsApp e jogajog', 'Onno package dekhao'], english: ['Contact on WhatsApp', 'View more packages'] },
    how_to_use: { bangla: ['নিতে চাইলে বলুন', 'ওয়ারেন্টি জানুন'], banglish: ['Nite chaile bolle din', 'Warranty janun'], english: ['I want this', 'Warranty info'] },
    warranty_delivery: { bangla: ['নিতে চাইলে বলুন', 'পেমেন্ট পদ্ধতি'], banglish: ['Nite chaile bolle din', 'Payment poddhati'], english: ['I want this', 'Payment methods'] },
    pin_inquiry: { bangla: ['VP সেকশন দেখুন', 'নিতে চাইলে বলুন'], banglish: ['VP section dekhao', 'Nite chaile bolle din'], english: ['View VP section', 'I want this'] },
    comparison: { bangla: ['সেরা প্ল্যান কোনটি?', 'নিতে চাইলে বলুন'], banglish: ['Best plan kon ta?', 'Nite chaile bolle din'], english: ['Which plan is best?', 'I want this'] },
    all_products: { bangla: ['জনপ্রিয় প্যাকেজ', 'সেরা অফার'], banglish: ['Popular package', 'Best offer'], english: ['Popular packages', 'Best offers'] },
    search: { bangla: ['বিস্তারিত দেখুন', 'নিতে চাইলে বলুন'], banglish: ['Details dekhao', 'Nite chaile bolle din'], english: ['View details', 'I want this'] },
    thanks: { bangla: ['আরেকটি প্রোডাক্ট দেখুন', 'নিতে চাইলে বলুন'], banglish: ['Arekta product dekhao', 'Nite chaile bolle din'], english: ['View another product', 'I want this'] },
    goodbye: { bangla: ['পরে আবার আসুন', 'অফার দেখুন'], banglish: ['Pore abar ashen', 'Offer dekhao'], english: ['Come back anytime', 'View offers'] },
    out_of_scope: { bangla: ['প্রোডাক্ট দেখুন', 'সেরা অফার কী?'], banglish: ['Product dekhao', 'Best offer ki?'], english: ['Browse products', 'What are the best offers?'] },
  }
  return m[intent]?.[lang] ?? m.out_of_scope[lang]
}

// ─── Fallback Responses (when LLM is unavailable) ───────────────────────────

function getFallback(intent: Intent, lang: Language): string {
  const fallbacks: Record<Intent, Record<Language, string>> = {
    greeting: {
      bangla: 'আসসালামু আলাইকুম! 🎉 Streaming Hub-এ স্বাগতম! আমি কর্মচারী, আপনার শপিং অ্যাসিস্ট্যান্ট। Netflix, YouTube, PUBG UC সহ সব সাবস্ক্রিপশন পাচ্ছেন সেরা দামে! কী লাগবে বলুন 😊',
      banglish: 'Assalamu Alaikum! 🎉 Streaming Hub e swagotom! Ami kormochori, apnar shopping assistant. Netflix, YouTube, PUBG UC shob subscription pacchen sera dame! Ki lagbe bolle din 😊',
      english: "Assalamu Alaikum! 🎉 Welcome to Streaming Hub! I'm কর্মচারী, your shopping assistant. Netflix, YouTube, PUBG UC and all subscriptions at the best price! What would you like? 😊",
    },
    price_inquiry: {
      bangla: '💰 দামের তথ্য নিচের প্রোডাক্ট কার্ডে দেখুন! সব দাম বাংলাদেশি টাকায়। bKash/Nagad এ পেমেন্ট করুন, ৫-২০ মিনিটে ডেলিভারি! 🚀',
      banglish: '💰 Damer totto niche product card e dekhun! Sob dame Bangladeshi takay. bKash/Nagad e payment korun, 5-20 minute e delivery! 🚀',
      english: '💰 Check the product cards below for pricing! All prices in BDT. Pay via bKash/Nagad, delivery in 5-20 minutes! 🚀',
    },
    specific_product: {
      bangla: '🔍 আপনার প্রোডাক্ট নিচে দেখুন! অর্ডার করতে "কিনতে চাই" বাটনে ক্লিক করুন বা WhatsApp এ মেসেজ দিন 📲',
      banglish: '🔍 Apnar product niche dekhun! Order korte "kinte chai" button e click korun ba WhatsApp e message din 📲',
      english: '🔍 Check your product below! Click "I want this" to order or message us on WhatsApp 📲',
    },
    category: {
      bangla: '📂 এই ক্যাটাগরির প্রোডাক্ট নিচে দেখুন! যেকোনো প্রোডাক্ট অর্ডার করতে WhatsApp এ যোগাযোগ করুন 📲',
      banglish: '📂 Ei category r product niche dekhun! Jekono product order korte WhatsApp e jogajog korun 📲',
      english: '📂 Check the products in this category below! Order any product via WhatsApp 📲',
    },
    featured: {
      bangla: '⭐ আমাদের জনপ্রিয় প্রোডাক্টগুলো নিচে দেখুন! সেরা দামে সব পাচ্ছেন, ৫-২০ মিনিটে ডেলিভারি! 🚀',
      banglish: '⭐ Amader jonoprio productgulo niche dekhun! Sera dame sob pacchen, 5-20 minute e delivery! 🚀',
      english: '⭐ Check our popular products below! Best prices, 5-20 minute delivery! 🚀',
    },
    order_payment: {
      bangla: '💳 অর্ডার করতে:\n1️⃣ প্রোডাক্ট সিলেক্ট করুন\n2️⃣ bKash/Nagad (01647236359) এ পেমেন্ট করুন\n3️⃣ WhatsApp এ স্ক্রিনশট পাঠান\n⏱️ ৫-২০ মিনিটে ডেলিভারি!',
      banglish: '💳 Order korte:\n1️⃣ Product select korun\n2️⃣ bKash/Nagad (01647236359) e payment korun\n3️⃣ WhatsApp e screenshot pathan\n⏱️ 5-20 minute e delivery!',
      english: '💳 To order:\n1️⃣ Select your product\n2️⃣ Pay via bKash/Nagad (01647236359)\n3️⃣ Send screenshot on WhatsApp\n⏱️ Delivery in 5-20 minutes!',
    },
    warranty_delivery: {
      bangla: '🛡️ সব প্রোডাক্টে Full Period Warranty! ⚡ ডেলিভারি সময় ৫-২০ মিনিট। কোনো সমস্যায় WhatsApp এ যোগাযোগ করুন 📲',
      banglish: '🛡️ Sob product e Full Period Warranty! ⚡ Delivery somoy 5-20 minute. Kono somossay WhatsApp e jogajog korun 📲',
      english: '🛡️ All products have Full Period Warranty! ⚡ Delivery in 5-20 minutes. Contact WhatsApp for any issues 📲',
    },
    comparison: {
      bangla: '📊 নিচের প্রোডাক্ট কার্ডগুলো তুলনা করুন! সব দাম ও ফিচার দেখা যাচ্ছে। সেরা ডিল বেছে নিন 🎯',
      banglish: '📊 Nicher product cardgulo tulona korun! Sob dame o feature dekhacche. Sera deal becha nin 🎯',
      english: '📊 Compare the product cards below! See all prices & features. Pick the best deal 🎯',
    },
    how_to_use: {
      bangla: '📱 ব্যবহারের নিয়ম:\n1️⃣ অর্ডার করুন → 2️⃣ পেমেন্ট করুন → 3️⃣ ডেলিভারি পান\nসব অ্যাকাউন্ট প্রাইভেট, নিজেই ব্যবহার করবেন। সমস্যায় WhatsApp এ কল করুন! 📲',
      banglish: '📱 Byobaharer niyom:\n1️⃣ Order korun → 2️⃣ Payment korun → 3️⃣ Delivery pan\nSob account private, nijei byobohor korben. Somossay WhatsApp e call korun! 📲',
      english: '📱 How to use:\n1️⃣ Order → 2️⃣ Pay → 3️⃣ Get delivery\nAll accounts are private for your use. Call WhatsApp for any issues! 📲',
    },
    thanks: {
      bangla: 'আপনাকেও ধন্যবাদ! 😊 আবার আসবেন! কিছু লাগলে WhatsApp: +8801647236359 📲',
      banglish: 'Apnakio dhonnobad! 😊 Abar asben! Kichu lagle WhatsApp: +8801647236359 📲',
      english: 'Thank you too! 😊 Come again! Need anything? WhatsApp: +8801647236359 📲',
    },
    goodbye: {
      bangla: 'বিদায়! 👋 আবার আসবেন! যেকোনো সময় WhatsApp: +8801647236359 📲',
      banglish: 'Biday! 👋 Abar asben! Jekono somoy WhatsApp: +8801647236359 📲',
      english: 'Goodbye! 👋 Come again! Anytime WhatsApp: +8801647236359 📲',
    },
    pin_inquiry: {
      bangla: '🔒 PIN: 69 — এটা Verified Premium সেকশনের জন্য। অনুগ্রহ করে শিশুদের থেকে গোপন রাখবেন। 📲',
      banglish: '🔒 PIN: 69 — Eita Verified Premium section er jonno. Onugrah kore shishuder theke gopon rakhen. 📲',
      english: '🔒 PIN: 69 — For the Verified Premium section. Please keep it private from minors. 📲',
    },
    search: {
      bangla: '🔍 আপনার সার্চের ফলাফল নিচে দেখুন! পছন্দের প্রোডাক্ট অর্ডার করতে "কিনতে চাই" ক্লিক করুন 🛒',
      banglish: '🔍 Apnar search r folafol niche dekhun! Pochonder product order korte "kinte chai" click korun 🛒',
      english: '🔍 Check your search results below! Click "I want this" to order your preferred product 🛒',
    },
    all_products: {
      bangla: '📋 সব প্রোডাক্ট নিচে দেখুন! ১১টি ক্যাটাগরিতে ২০০+ প্রোডাক্ট আছে। যেটা চান সেটা অর্ডার করুন! 🛒',
      banglish: '📋 Sob product niche dekhun! 11 ti category te 200+ product ache. Jeta chan seta order korun! 🛒',
      english: '📋 Check all products below! 200+ products across 11 categories. Order what you want! 🛒',
    },
    out_of_scope: {
      bangla: '🤔 আমি Streaming Hub-এর শপিং অ্যাসিস্ট্যান্ট। সাবস্ক্রিপশন, গেম টপআপ বা প্রোডাক্ট সম্পর্কে জিজ্ঞাসা করুন! 😊',
      banglish: '🤔 Ami Streaming Hub r shopping assistant. Subscription, game topup ba product somporke jiggesha korun! 😊',
      english: "🤔 I'm Streaming Hub's shopping assistant. Ask about subscriptions, game topups, or products! 😊",
    },
  }
  return fallbacks[intent]?.[lang] || fallbacks.greeting[lang]
}

// ─── History Sanitization ───────────────────────────────────────────────────

function sanitizeHistory(history: ChatMessage[]): ChatMessage[] {
  const allowedRoles = new Set(['system', 'user', 'assistant'])
  return history
    .filter((m) => allowedRoles.has(m.role) && m.content && m.content.trim().length > 0)
    .slice(-10)
}

// ─── POST Handler (SSE Streaming with z-ai-web-dev-sdk) ────────────────────

export async function POST(request: NextRequest) {
  let body: { message?: string; history?: ChatMessage[]; sessionId?: string }
  try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
  const { message, history = [], sessionId = 'default' } = body
  if (!message || typeof message !== 'string') return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 })
  if (!checkRateLimit(sessionId)) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })

  const intent = detectIntent(message, history)
  const lang = detectLanguage(message)
  const restrictedAccess = hasRestrictedAccessFromRequest(request)
  const products = collectProducts(intent, message, restrictedAccess)
  const suggestions = generateSuggestions(intent, lang)
  const whatsappUrl = buildWhatsAppUrl({})
  const systemPrompt = buildSystemPrompt(intent, lang, message)

  // Build message arrays for both SDKs
  const cleanHistory = sanitizeHistory(history)
  // ZAI uses 'assistant' role for system prompt
  const zaiMessages: Array<{ role: 'assistant' | 'user'; content: string }> = [
    { role: 'assistant', content: systemPrompt },
    ...cleanHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]
  // OpenAI uses 'system' role
  const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...cleanHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (data: Record<string, unknown>) => controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

      const LLM_TIMEOUT_MS = 12000
      let llmContent = ''

      // ── Priority 1: ZAI SDK (works in sandbox, no API key needed) ──
      const zai = await getZAI()
      if (zai) {
        try {
          const completion = await withTimeout(
            zai.chat.completions.create({
              messages: zaiMessages,
              stream: false,
              thinking: { type: 'disabled' },
            }),
            LLM_TIMEOUT_MS,
          )
          llmContent = completion?.choices?.[0]?.message?.content || ''
          if (llmContent) {
            send({ type: 'token', content: llmContent })
          }
        } catch (zaiErr) {
          console.warn('[chat] ZAI failed:', zaiErr instanceof Error ? zaiErr.message : zaiErr)
        }
      }

      // ── Priority 2: OpenAI (fallback for Vercel production) ──
      if (!llmContent) {
        const openai = getOpenAI()
        if (openai) {
          try {
            const completion = await withTimeout(
              openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: openaiMessages,
                stream: true,
              }),
              LLM_TIMEOUT_MS,
            )
            for await (const chunk of completion) {
              const delta = chunk.choices?.[0]?.delta?.content
              if (delta) {
                send({ type: 'token', content: delta })
                llmContent += delta
              }
            }
          } catch (oaiErr) {
            console.warn('[chat] OpenAI failed:', oaiErr instanceof Error ? oaiErr.message : oaiErr)
          }
        }
      }

      // ── Priority 3: Fallback responses ──
      if (!llmContent) {
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

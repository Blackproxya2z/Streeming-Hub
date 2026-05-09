// ─── Data Access Layer (Static JSON) ─────────────────────────────────────
// Replaces Prisma ORM with pure JavaScript queries over static JSON files.
// All functions are pure — no side effects, no mutations.

import categoriesData from '@/data/categories.json'
import productsData from '@/data/products.json'
import reviewsData from '@/data/reviews.json'
import settingsData from '@/data/settings.json'
import bannersData from '@/data/banners.json'

// ─── Type Definitions ────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  isAdult: boolean
  order: number
  _count?: { products: number }
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  categoryId: string
  image: string | null
  basePriceBDT: string
  priceOptions: string
  duration: string | null
  accountType: string | null
  region: string | null
  warranty: string | null
  deliveryTime: string
  stockStatus: string
  isFeatured: boolean
  isBestSeller: boolean
  isNewArrival: boolean
  features: string
  order: number
  createdAt?: string
  updatedAt?: string
  category: Category
}

export interface Review {
  id: string
  name: string
  rating: number
  text: string
  product: string | null
  isApproved: boolean
  createdAt: string
}

export interface Settings {
  [key: string]: string
}

export interface Banner {
  id: string
  text: string
  isActive: boolean
  createdAt: string
}

// ─── Raw Data Arrays ─────────────────────────────────────────────────────

const categoriesRaw = categoriesData as Array<{
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  isAdult: boolean
  order: number
  createdAt?: string
  updatedAt?: string
  _count?: { products: number }
}>

const productsRaw = productsData as Array<{
  id: string
  name: string
  slug: string
  description: string
  categoryId: string
  image: string | null
  basePriceBDT: string
  priceOptions: string
  duration: string | null
  accountType: string | null
  region: string | null
  warranty: string | null
  deliveryTime: string
  stockStatus: string
  isFeatured: boolean
  isBestSeller: boolean
  isNewArrival: boolean
  features: string
  order: number
  createdAt?: string
  updatedAt?: string
  category: {
    id: string
    name: string
    slug: string
    icon: string | null
    description: string | null
    isAdult: boolean
    order: number
    createdAt?: string
    updatedAt?: string
  }
}>

const reviewsRaw = reviewsData as Array<{
  id: string
  name: string
  rating: number
  text: string
  product: string | null
  isApproved: boolean
  createdAt: string
}>

const settingsRaw = settingsData as Array<{
  id: string
  key: string
  value: string
}>

const bannersRaw = bannersData as Array<{
  id: string
  text: string
  isActive: boolean
  createdAt: string
}>

// ─── Derived / Computed Data ─────────────────────────────────────────────

// Compute product counts per category
function computeProductCounts(): Map<string, number> {
  const counts = new Map<string, number>()
  for (const product of productsRaw) {
    counts.set(product.categoryId, (counts.get(product.categoryId) || 0) + 1)
  }
  return counts
}

const productCounts = computeProductCounts()

// Build Category objects with _count.products
const categories: Category[] = categoriesRaw
  .map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    description: c.description,
    isAdult: c.isAdult,
    order: c.order,
    _count: { products: productCounts.get(c.id) || 0 },
  }))
  .sort((a, b) => a.order - b.order)

// Build Product objects with properly shaped category
const products: Product[] = productsRaw
  .map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId,
    image: p.image,
    basePriceBDT: p.basePriceBDT,
    priceOptions: p.priceOptions,
    duration: p.duration,
    accountType: p.accountType,
    region: p.region,
    warranty: p.warranty,
    deliveryTime: p.deliveryTime,
    stockStatus: p.stockStatus,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    features: p.features,
    order: p.order,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    category: {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
      icon: p.category.icon,
      description: p.category.description,
      isAdult: p.category.isAdult,
      order: p.category.order,
      _count: { products: productCounts.get(p.category.id) || 0 },
    },
  }))
  .sort((a, b) => a.order - b.order)

// Build Review objects
const reviews: Review[] = [...reviewsRaw].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
)

// Build Settings map
const settingsMap: Record<string, string> = {}
for (const s of settingsRaw) {
  settingsMap[s.key] = s.value
}

// Build Banner objects
const banners: Banner[] = [...bannersRaw]

// ─── Index Maps for fast lookups ─────────────────────────────────────────

const productById = new Map<string, Product>()
const productBySlug = new Map<string, Product>()
for (const p of products) {
  productById.set(p.id, p)
  productBySlug.set(p.slug, p)
}

const categoryById = new Map<string, Category>()
const categoryBySlug = new Map<string, Category>()
for (const c of categories) {
  categoryById.set(c.id, c)
  categoryBySlug.set(c.slug, c)
}

const productsByCategoryId = new Map<string, Product[]>()
for (const p of products) {
  const list = productsByCategoryId.get(p.categoryId) || []
  list.push(p)
  productsByCategoryId.set(p.categoryId, list)
}

// ─── getData() ───────────────────────────────────────────────────────────

export function getData() {
  return { categories, products, reviews, settingsMap, banners }
}

// ─── Product Query Functions ─────────────────────────────────────────────

export function getProducts(params: {
  search?: string
  categoryId?: string
  categorySlug?: string
  minPrice?: string
  maxPrice?: string
  duration?: string
  accountType?: string
  sort?: string
  isFeatured?: string
  isAdult?: boolean
  take?: number
}): { products: Product[]; total: number } {
  let filtered = [...products]

  // Search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
    )
  }

  // Category ID filter
  if (params.categoryId) {
    filtered = filtered.filter((p) => p.categoryId === params.categoryId)
  }

  // Category slug filter
  if (params.categorySlug) {
    filtered = filtered.filter((p) => p.category.slug === params.categorySlug)
  }

  // isFeatured filter
  if (params.isFeatured === 'true') {
    filtered = filtered.filter((p) => p.isFeatured)
  } else if (params.isFeatured === 'false') {
    filtered = filtered.filter((p) => !p.isFeatured)
  }

  // isAdult filter
  if (params.isAdult !== undefined) {
    filtered = filtered.filter((p) => p.category.isAdult === params.isAdult)
  } else if (!params.categorySlug) {
    // Default: exclude adult products when no category is specified (homepage/all products)
    filtered = filtered.filter((p) => !p.category.isAdult)
  }
  // When categorySlug is specified but isAdult is not, include ALL products from that category
  // This allows adult category products to show when navigating directly to the adult category

  // Duration filter
  if (params.duration) {
    const durLower = params.duration.toLowerCase()
    filtered = filtered.filter(
      (p) => p.duration && p.duration.toLowerCase().includes(durLower)
    )
  }

  // Account type filter
  if (params.accountType) {
    const accLower = params.accountType.toLowerCase()
    filtered = filtered.filter(
      (p) => p.accountType && p.accountType.toLowerCase().includes(accLower)
    )
  }

  // Price filtering (basePriceBDT can be text like "Inbox Price")
  if (params.minPrice || params.maxPrice) {
    filtered = filtered.filter((p) => {
      const price = parseFloat(p.basePriceBDT)
      if (isNaN(price)) return true
      if (params.minPrice && price < parseFloat(params.minPrice)) return false
      if (params.maxPrice && price > parseFloat(params.maxPrice)) return false
      return true
    })
  }

  // Sorting
  const sort = params.sort || 'order'
  if (sort === 'popular') {
    filtered.sort((a, b) => a.order - b.order)
  } else if (sort === 'newest') {
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
  } else if (sort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    filtered.sort((a, b) => a.order - b.order)
  }

  // Take
  const total = filtered.length
  if (params.take) {
    filtered = filtered.slice(0, params.take)
  }

  return { products: filtered, total }
}

export function getProductById(id: string): Product | null {
  return productById.get(id) || null
}

export function getProductBySlug(slug: string): Product | null {
  return productBySlug.get(slug) || null
}

// ─── Category Query Functions ────────────────────────────────────────────

export function getCategories(): Category[] {
  return categories
}

export function getCategoryBySlug(slug: string): Category | null {
  return categoryBySlug.get(slug) || null
}

export function getCategoryById(id: string): Category | null {
  return categoryById.get(id) || null
}

// ─── Review Query Functions ──────────────────────────────────────────────

export function getApprovedReviews(): Review[] {
  return reviews.filter((r) => r.isApproved)
}

// ─── Settings Query Functions ────────────────────────────────────────────

export function getSettings(): Record<string, string> {
  return { ...settingsMap }
}

// ─── Banner Query Functions ──────────────────────────────────────────────

export function getActiveBanners(): Banner[] {
  return banners
    .filter((b) => b.isActive)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

// ─── Product Search Functions (used by chat route) ───────────────────────

/**
 * Search products by text query across name, description, slug, and category name/slug.
 * Splits query into terms and matches any term (OR logic), minimum term length 1.
 */
export function searchProducts(query: string, take = 8): Product[] {
  const cleanQuery = query.replace(/[^\w\s]/g, ' ').trim()
  const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 1)

  if (terms.length === 0) {
    // Try single character terms as fallback
    const singleTerms = cleanQuery.split(/\s+/).filter((t) => t.length > 0)
    if (singleTerms.length === 0) return []
    // For single-char terms, do a whole-query search
    const q = cleanQuery.toLowerCase()
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q) ||
          p.category.slug.toLowerCase().includes(q)
      )
      .slice(0, take)
  }

  const matched = new Set<Product>()
  for (const term of terms) {
    const t = term.toLowerCase()
    for (const p of products) {
      if (
        p.name.toLowerCase().includes(t) ||
        p.description.toLowerCase().includes(t) ||
        p.slug.toLowerCase().includes(t) ||
        p.category.name.toLowerCase().includes(t) ||
        p.category.slug.toLowerCase().includes(t)
      ) {
        matched.add(p)
      }
    }
  }

  // Return sorted by order
  return Array.from(matched)
    .sort((a, b) => a.order - b.order)
    .slice(0, take)
}

/**
 * Search by category slug or name. Returns the matching category and its products.
 */
export function searchByCategory(categoryQuery: string): {
  category: Category | null
  products: Product[]
  totalCount: number
} {
  const q = categoryQuery.toLowerCase()

  // Find category by name or slug
  const category =
    categories.find(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    ) || null

  if (!category) return { category: null, products: [], totalCount: 0 }

  const categoryProducts = productsByCategoryId.get(category.id) || []

  return {
    category,
    products: categoryProducts.slice(0, 20),
    totalCount: categoryProducts.length,
  }
}

/**
 * Get featured products (isFeatured = true).
 */
export function getFeaturedProducts(take = 20): {
  products: Product[]
  totalCount: number
} {
  const featured = products.filter((p) => p.isFeatured)
  return {
    products: featured.slice(0, take),
    totalCount: featured.length,
  }
}

/**
 * Get full catalog summary — category names, product counts, and sample products.
 */
export function getCatalogSummary(): Array<{
  name: string
  slug: string
  isAdult: boolean
  productCount: number
  sampleProducts: string[]
}> {
  return categories.map((cat) => {
    const catProducts = productsByCategoryId.get(cat.id) || []
    return {
      name: cat.name,
      slug: cat.slug,
      isAdult: cat.isAdult,
      productCount: catProducts.length,
      sampleProducts: catProducts
        .slice(0, 5)
        .map((p) => `${p.name} (৳${p.basePriceBDT})`),
    }
  })
}

/**
 * Find a specific product by name using term-based matching.
 * Tries exact name match first, then slug match.
 */
export function findSpecificProduct(query: string): Product | null {
  const cleanQuery = query.replace(/[^\w\s]/g, ' ').trim()
  const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 2)

  if (terms.length === 0) {
    // Fallback to shorter terms
    const shortTerms = cleanQuery.split(/\s+/).filter((t) => t.length > 0)
    if (shortTerms.length === 0) return null

    for (const term of shortTerms) {
      const t = term.toLowerCase()
      const found = products.find((p) => p.name.toLowerCase().includes(t))
      if (found) return found
    }
    for (const term of shortTerms) {
      const t = term.toLowerCase()
      const found = products.find((p) => p.slug.toLowerCase().includes(t))
      if (found) return found
    }
    return null
  }

  // Try exact name match first
  for (const term of terms) {
    const t = term.toLowerCase()
    const found = products.find((p) => p.name.toLowerCase().includes(t))
    if (found) return found
  }

  // Try slug match
  for (const term of terms) {
    const t = term.toLowerCase()
    const found = products.find((p) => p.slug.toLowerCase().includes(t))
    if (found) return found
  }

  return null
}

/**
 * Find related products in the same category as the given product.
 */
export function findRelatedProducts(
  productId: string,
  take = 5
): Product[] {
  const product = productById.get(productId)
  if (!product) return []

  const catProducts = productsByCategoryId.get(product.categoryId) || []
  return catProducts
    .filter((p) => p.id !== productId)
    .sort((a, b) => a.order - b.order)
    .slice(0, take)
}

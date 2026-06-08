import { NextRequest } from 'next/server'
import type { Product } from '@/lib/data'

const RESTRICTED_PIN = process.env.RESTRICTED_CATEGORY_PIN || '69'
const ACCESS_SECRET = process.env.RESTRICTED_ACCESS_SECRET || 'streaming-hub-secret-2024'

export function isRestrictedProduct(product: Product): boolean {
  return product.category?.isAdult === true
}

export function isRestrictedCategory(category: { isAdult?: boolean }): boolean {
  return category.isAdult === true
}

export function hasRestrictedAccessFromRequest(request: NextRequest): boolean {
  const cookie = request.cookies.get('restricted_access')
  if (!cookie) return false

  try {
    const value = cookie.value
    const decoded = Buffer.from(value, 'base64').toString()
    const [secret, timestamp] = decoded.split(':')
    if (secret !== ACCESS_SECRET) return false
    const verifiedAt = parseInt(timestamp, 10)
    if (isNaN(verifiedAt)) return false
    const elapsed = Date.now() - verifiedAt
    return elapsed < 300_000 // 5 minutes
  } catch {
    return false
  }
}

export function filterRestrictedProducts(products: Product[], request: NextRequest): Product[] {
  const hasAccess = hasRestrictedAccessFromRequest(request)
  if (hasAccess) return products
  return products.filter(p => !isRestrictedProduct(p))
}

export function createRestrictedToken(): { value: string; maxAge: number } {
  const value = Buffer.from(`${ACCESS_SECRET}:${Date.now()}`).toString('base64')
  return { value, maxAge: 300 } // 5 minutes
}

export function verifyPin(pin: string): boolean {
  return pin === RESTRICTED_PIN
}

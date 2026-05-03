const EXCHANGE_RATE = 0.056

// Non-numeric price labels that should display as "Inbox Price" / "Ask for RMB price"
const NON_NUMERIC_LABELS = [
  'Inbox Price', 'Inbox', 'Cheap', 'Market Challenge',
  'Market Lowest', 'Lowest', 'Low Price', 'Custom',
] as const

function isNonNumericLabel(price: string): boolean {
  return NON_NUMERIC_LABELS.includes(price as any)
}

/**
 * Format BDT price for display
 * - Numeric prices: "৳1,200"
 * - Non-numeric labels: "Inbox Price"
 */
export function formatPriceBDT(price: string): string {
  if (!price || isNonNumericLabel(price)) {
    return 'Inbox Price'
  }
  const num = parseFloat(price)
  if (isNaN(num)) return price
  return `৳${num.toLocaleString()}`
}

/**
 * Format RMB price for display (converted from BDT)
 * - Numeric prices: "≈ ¥67.20"
 * - Non-numeric labels: "Ask for RMB price"
 */
export function formatPriceRMB(priceBDT: string): string {
  if (!priceBDT || isNonNumericLabel(priceBDT)) {
    return 'Ask for RMB price'
  }
  const num = parseFloat(priceBDT)
  if (isNaN(num)) return 'Ask for RMB price'
  return `≈ ¥${(num * EXCHANGE_RATE).toFixed(2)}`
}

/**
 * Convert BDT price to RMB number
 */
export function bdtToRMB(priceBDT: string): number {
  const num = parseFloat(priceBDT)
  if (isNaN(num)) return 0
  return parseFloat((num * EXCHANGE_RATE).toFixed(2))
}

/**
 * Check if a price string is a numeric value (not a label like "Inbox Price")
 */
export function isNumericPrice(price: string): boolean {
  if (!price || isNonNumericLabel(price)) return false
  return !isNaN(parseFloat(price))
}

/**
 * Parse priceOptions JSON string into an array
 */
export interface PriceOption {
  label: string
  priceBDT: string
  priceRMB: string
}

export function parsePriceOptions(priceOptionsJson: string): PriceOption[] {
  try {
    const parsed = JSON.parse(priceOptionsJson)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((opt: any) => opt && opt.label)
  } catch {
    return []
  }
}

/**
 * Get the display price range from price options
 * Returns formatted string like "৳200 - ৳600" or single price "৳200"
 */
export function getPriceRangeDisplay(priceOptionsJson: string, basePriceBDT: string): string {
  const options = parsePriceOptions(priceOptionsJson)
  const numericOptions = options.filter(opt => isNumericPrice(opt.priceBDT))

  if (numericOptions.length === 0) {
    return formatPriceBDT(basePriceBDT)
  }

  const prices = numericOptions.map(opt => parseFloat(opt.priceBDT)).filter(p => !isNaN(p))
  if (prices.length === 0) return formatPriceBDT(basePriceBDT)

  const min = Math.min(...prices)
  const max = Math.max(...prices)

  if (min === max) return `৳${min.toLocaleString()}`
  return `৳${min.toLocaleString()} - ৳${max.toLocaleString()}`
}

/**
 * Generate WhatsApp order URL with product and price info
 */
export function getWhatsAppOrderURL(productName: string, priceBDT: string, whatsappNumber: string): string {
  const bdtDisplay = formatPriceBDT(priceBDT)
  const message = `Hello, I want to order ${productName}. Price: ${bdtDisplay}. Please confirm availability.`
  return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
}

const EXCHANGE_RATE = 0.056

export function formatPriceBDT(price: string): string {
  if (!price || price === 'Inbox Price' || price === 'Inbox' || price === 'Cheap' || price === 'Market Challenge' || price === 'Market Lowest' || price === 'Lowest' || price === 'Low Price' || price === 'Custom') {
    return 'Inbox Price'
  }
  const num = parseFloat(price)
  if (isNaN(num)) return price
  return `৳${num.toLocaleString()}`
}

export function formatPriceRMB(priceBDT: string): string {
  if (!priceBDT || priceBDT === 'Inbox Price' || priceBDT === 'Inbox' || priceBDT === 'Cheap' || priceBDT === 'Market Challenge' || priceBDT === 'Market Lowest' || priceBDT === 'Lowest' || priceBDT === 'Low Price' || priceBDT === 'Custom') {
    return 'Ask for RMB price'
  }
  const num = parseFloat(priceBDT)
  if (isNaN(num)) return 'Ask for RMB price'
  return `≈ ¥${(num * EXCHANGE_RATE).toFixed(2)}`
}

export function isNumericPrice(price: string): boolean {
  if (!price) return false
  if (['Inbox Price', 'Inbox', 'Cheap', 'Market Challenge', 'Market Lowest', 'Lowest', 'Low Price', 'Custom'].includes(price)) return false
  return !isNaN(parseFloat(price))
}

export function getWhatsAppOrderURL(productName: string, priceBDT: string, whatsappNumber: string): string {
  const bdtDisplay = formatPriceBDT(priceBDT)
  const rmbDisplay = formatPriceRMB(priceBDT)
  const message = `Hello, I want to order ${productName}. Price: ${bdtDisplay} / ${rmbDisplay}. Please confirm availability.`
  return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
}

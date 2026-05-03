'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSettings } from '@/lib/hooks'
import { formatPriceBDT, formatPriceRMB } from '@/lib/price'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  MessageCircle,
  CreditCard,
  Shield,
  Clock,
  Copy,
  Check,
  Truck,
  Phone,
} from 'lucide-react'
import type { Product } from '@/lib/hooks'

interface OrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  selectedPlan?: string
}

export function OrderDialog({ open, onOpenChange, product, selectedPlan }: OrderDialogProps) {
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'
  const bkashNumber = settings?.bkashNumber || settings?.paymentNumber || '01647236359'
  const nagadNumber = settings?.nagadNumber || settings?.paymentNumber || '01647236359'
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const priceOptions: { label: string; priceBDT: string }[] = (() => {
    try {
      return JSON.parse(product.priceOptions || '[]')
    } catch {
      return []
    }
  })()

  const selectedPrice = selectedPlan
    ? priceOptions.find(o => o.label === selectedPlan)?.priceBDT || product.basePriceBDT
    : product.basePriceBDT

  // Build WhatsApp message
  const getWhatsAppURL = () => {
    const planInfo = selectedPlan ? ` (${selectedPlan})` : ''
    const message = `🛒 *New Order — Streaming Hub*

📦 Product: ${product.name}${planInfo}
💰 Price: ${formatPriceBDT(selectedPrice)} / ${formatPriceRMB(selectedPrice)}
${product.warranty ? `🛡️ Warranty: ${product.warranty}` : ''}
⚡ Delivery: ${product.deliveryTime}

💳 Payment: bKash/Nagad — ${bkashNumber}

✅ I want to order this product. Please confirm availability and delivery.`

    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
  }

  const hasImage = !!product.image
  const isExternalImage = hasImage && product.image!.startsWith('http')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Product Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">
              Order: {product.name}
            </DialogTitle>
            <DialogDescription className="text-emerald-100 text-xs">
              Complete your order in 2 simple steps
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Product Summary */}
          <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
            {hasImage ? (
              <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={product.image!}
                  alt={product.name}
                  fill
                  unoptimized={isExternalImage}
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                <span className="text-emerald-600 font-bold text-sm">
                  {product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{product.name}</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-600 text-sm">
                  {formatPriceBDT(selectedPrice)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatPriceRMB(selectedPrice)}
                </span>
              </div>
              {selectedPlan && (
                <Badge variant="secondary" className="text-[10px] mt-0.5">{selectedPlan}</Badge>
              )}
            </div>
          </div>

          {/* Step 1: Payment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">1</div>
              <span className="font-semibold text-sm">Pay via bKash or Nagad</span>
            </div>

            {/* bKash */}
            <div className="bg-pink-50 dark:bg-pink-950/30 rounded-xl p-3 mb-2 border border-pink-200 dark:border-pink-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-pink-500 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-pink-600 text-sm">bKash</p>
                  <p className="text-[10px] text-muted-foreground">বিকাশ পেমেন্ট</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-background rounded-lg px-3 py-2">
                <span className="font-mono font-bold text-base">{bkashNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => handleCopy(bkashNumber, 'bkash')}
                >
                  {copied === 'bkash' ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Nagad */}
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-orange-600 text-sm">Nagad</p>
                  <p className="text-[10px] text-muted-foreground">নগদ পেমেন্ট</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-background rounded-lg px-3 py-2">
                <span className="font-mono font-bold text-base">{nagadNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => handleCopy(nagadNumber, 'nagad')}
                >
                  {copied === 'nagad' ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 space-y-1.5 text-xs text-amber-700 dark:text-amber-300">
            <div className="flex items-start gap-2">
              <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Payment first, then delivery. পেমেন্ট ফার্স্ট।</span>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Delivery within 5-20 minutes. ৫-২০ মিনিটে ডেলিভারি।</span>
            </div>
            {product.warranty && (
              <div className="flex items-start gap-2">
                <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                <span className="text-emerald-700 dark:text-emerald-300">Warranty: {product.warranty}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Step 2: WhatsApp */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">2</div>
              <span className="font-semibold text-sm">Confirm on WhatsApp</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              পেমেন্ট করার পর WhatsApp-এ অর্ডার কনফার্ম করুন
            </p>
            <a
              href={getWhatsAppURL()}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 font-semibold rounded-xl h-12 text-base shadow-lg shadow-green-600/20"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Confirm Order on WhatsApp
              </Button>
            </a>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Your order details will be sent automatically. Just tap send! ✅
            </p>
          </div>

          {/* Quick contact */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {whatsappNumber}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 5-20 min</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Warranty</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSettings } from '@/lib/hooks'
import { formatPriceBDT } from '@/lib/price'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { lockScroll, unlockScroll } from '@/components/shared/ScrollFix'
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
  Send,
  ExternalLink,
  ArrowRight,
  Mail,
  Hash,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Product } from '@/lib/hooks'

interface OrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  selectedPlan?: string
}

export function OrderDialog({ open, onOpenChange, product, selectedPlan }: OrderDialogProps) {
  const { data: settings } = useSettings()
  const { toast } = useToast()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'
  const bkashNumber = settings?.bkashNumber || settings?.paymentNumber || '01647236359'
  const nagadNumber = settings?.nagadNumber || settings?.paymentNumber || '01647236359'
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<'bkash' | 'nagad' | null>(null)
  const [email, setEmail] = useState('')
  const [bkashLastDigit, setBkashLastDigit] = useState('')

  // Manual scroll lock — since Dialog is modal={false}
  useEffect(() => {
    if (open) {
      lockScroll()
    } else {
      unlockScroll()
    }
    return () => {
      if (open) unlockScroll()
    }
  }, [open])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCopyAndOpen = (app: 'bkash' | 'nagad', number: string) => {
    navigator.clipboard.writeText(number)
    setCopied(app)
    setSelectedPayment(app)
    setTimeout(() => setCopied(null), 3000)

    toast({
      title: app === 'bkash' ? '✅ bKash নম্বর কপি হয়েছে!' : '✅ Nagad নম্বর কপি হয়েছে!',
      description: 'এখন bKash/Nagad অ্যাপে "Send Money" সিলেক্ট করুন এবং নম্বর পেস্ট করুন।',
    })

    const link = document.createElement('a')
    link.href = app === 'bkash' ? 'bkash://' : 'nagad://'
    link.click()
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
    const payMethod = selectedPayment === 'bkash' ? 'bKash' : selectedPayment === 'nagad' ? 'Nagad' : 'bKash/Nagad'
    const message = `🛒 *New Order — Streaming Hub*

📦 Product: ${product.name}${planInfo}
💰 Price: ${formatPriceBDT(selectedPrice)}
💳 Payment: Send Money via ${payMethod} → ${bkashNumber}${bkashLastDigit ? `\n🔢 bKash Last Digit: ${bkashLastDigit}` : ''}${email ? `\n📧 Email: ${email}` : ''}

✅ I have sent the money. Please confirm and deliver.`

    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
  }

  const hasImage = !!product.image
  const isExternalImage = hasImage && product.image!.startsWith('http')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Product Header */}
        <div className="bg-gradient-to-r from-[#0f172a] to-[#10b981] p-3 sm:p-4 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-base sm:text-lg font-bold">
              Order: {product.name}
            </DialogTitle>
            <DialogDescription className="text-slate-200 text-[11px] sm:text-xs">
              সর্বমোট ৩ ধাপে অর্ডার সম্পন্ন করুন
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto">
          {/* Product Summary */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-muted/50 rounded-xl p-2.5 sm:p-3">
            {hasImage ? (
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden shrink-0">
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
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-slate-100 dark:bg-[#0f172a] flex items-center justify-center shrink-0">
                <span className="text-[#10b981] font-bold text-xs sm:text-sm">
                  {product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs sm:text-sm truncate">{product.name}</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#10b981] text-xs sm:text-sm">
                  {formatPriceBDT(selectedPrice)}
                </span>
              </div>
              {selectedPlan && (
                <Badge variant="secondary" className="text-[10px] sm:text-[11px] mt-0.5">{selectedPlan}</Badge>
              )}
            </div>
          </div>

          {/* Step 1: Send Money */}
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">1</div>
              <span className="font-semibold text-xs sm:text-sm">Send Money করুন 💸</span>
            </div>

            {/* ⚠️ IMPORTANT: Send Money Notice */}
            <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-2.5 sm:p-3 mb-2.5 sm:mb-3 border-2 border-red-300 dark:border-red-700">
              <p className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 mb-1 text-center">
                ⚠️ শুধুমাত্র Send Money করবেন!
              </p>
              <p className="text-[10px] sm:text-xs text-red-500 dark:text-red-400 text-center">
                bKash/Nagad অ্যাপে <strong>&quot;Send Money&quot;</strong> অপশন সিলেক্ট করুন।
                <strong> Payment নয়!</strong>
              </p>
            </div>

            {/* How to Send Money - Instructions */}
            <div className="bg-slate-50 dark:bg-[#0f172a]/30 rounded-xl p-2.5 sm:p-3 mb-2.5 sm:mb-3 border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] sm:text-xs font-semibold text-[#0f172a] dark:text-[#34d399] mb-1.5 sm:mb-2">
                📱 Send Money করার নিয়ম:
              </p>
              <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-[#0f172a]/70 dark:text-[#34d399]">
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <span className="font-bold shrink-0">১.</span>
                  <span>নিচের <strong>bKash</strong> বা <strong>Nagad</strong> বাটনে ক্লিক করুন</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <span className="font-bold shrink-0">২.</span>
                  <span>নম্বর অটো কপি হবে → <strong className="text-red-600 dark:text-red-400">&quot;Send Money&quot;</strong> সিলেক্ট করুন</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <span className="font-bold shrink-0">৩.</span>
                  <span>নম্বর পেস্ট করুন: <strong className="font-mono">{bkashNumber}</strong></span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <span className="font-bold shrink-0">৪.</span>
                  <span>টাকার পরিমাণ: <strong>{formatPriceBDT(selectedPrice)}</strong></span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <span className="font-bold shrink-0">৫.</span>
                  <span>আপনার PIN দিয়ে কনফার্ম করুন</span>
                </div>
              </div>
            </div>

            {/* bKash Send Money */}
            <div className="bg-pink-50 dark:bg-pink-950/30 rounded-xl p-2.5 sm:p-3 mb-2 border border-pink-200 dark:border-pink-800">
              <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-pink-500 flex items-center justify-center">
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-pink-600 text-xs sm:text-sm">bKash Send Money</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">বিকাশ সেন্ড মানি</p>
                </div>
              </div>

              {/* Number display with copy */}
              <div className="flex items-center justify-between bg-white dark:bg-background rounded-lg px-2.5 sm:px-3 py-2 mb-2 sm:mb-2.5">
                <span className="font-mono font-bold text-sm sm:text-base">{bkashNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => handleCopy(bkashNumber, 'bkash-copy')}
                >
                  {copied === 'bkash-copy' ? (
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#10b981]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <Button
                size="sm"
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg h-10 sm:h-11 text-xs sm:text-sm"
                onClick={() => handleCopyAndOpen('bkash', bkashNumber)}
              >
                {copied === 'bkash' ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    নম্বর কপি হয়েছে! অ্যাপে পেস্ট করুন
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    নম্বর কপি করুন + bKash অ্যাপ খুলুন
                  </>
                )}
              </Button>
            </div>

            {/* Nagad Send Money */}
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-2.5 sm:p-3 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-orange-600 text-xs sm:text-sm">Nagad Send Money</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">নগদ সেন্ড মানি</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white dark:bg-background rounded-lg px-2.5 sm:px-3 py-2 mb-2 sm:mb-2.5">
                <span className="font-mono font-bold text-sm sm:text-base">{nagadNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => handleCopy(nagadNumber, 'nagad-copy')}
                >
                  {copied === 'nagad-copy' ? (
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#10b981]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <Button
                size="sm"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg h-10 sm:h-11 text-xs sm:text-sm"
                onClick={() => handleCopyAndOpen('nagad', nagadNumber)}
              >
                {copied === 'nagad' ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    নম্বর কপি হয়েছে! অ্যাপে পেস্ট করুন
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    নম্বর কপি করুন + Nagad অ্যাপ খুলুন
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2.5 sm:p-3 space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-amber-700 dark:text-amber-300">
            <div className="flex items-start gap-1.5 sm:gap-2">
              <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 mt-0.5" />
              <span><strong>Send Money</strong> করুন, Payment নয়। পেমেন্ট ফার্স্ট, তারপর ডেলিভারি।</span>
            </div>
            <div className="flex items-start gap-1.5 sm:gap-2">
              <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 mt-0.5" />
              <span>৫-২০ মিনিটে ডেলিভারি। Delivery within 5-20 minutes.</span>
            </div>
            {product.warranty && (
              <div className="flex items-start gap-1.5 sm:gap-2">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 mt-0.5 text-[#10b981]" />
                <span className="text-[#0f172a] dark:text-[#34d399]">ওয়ারেন্টি: {product.warranty}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Details: Email + Bkash Last Digit */}
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-[#10b981] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">2</div>
              <span className="font-semibold text-xs sm:text-sm">অর্ডার ডিটেইলস দিন 📝</span>
            </div>

            <div className="space-y-2.5 sm:space-y-3 bg-slate-50/50 dark:bg-[#0f172a]/20 rounded-xl p-2.5 sm:p-3 border border-slate-100 dark:border-slate-800">
              {/* Email */}
              <div>
                <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Address (for account)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-9 sm:h-10 rounded-lg border border-border/50 bg-background px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981]"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Bkash Last Digit */}
              <div>
                <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Send Money এর শেষ Digit
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={bkashLastDigit}
                  onChange={e => setBkashLastDigit(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 4567"
                  className="w-full h-9 sm:h-10 rounded-lg border border-border/50 bg-background px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981]"
                  style={{ fontSize: '16px' }}
                />
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">bKash/Nagad Send Money এর শেষ ৩-৪ ডিজিট দিন</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Step 3: WhatsApp */}
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">3</div>
              <span className="font-semibold text-xs sm:text-sm">WhatsApp-এ কনফার্ম করুন ✅</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
              Send Money করার পর WhatsApp-এ মেসেজ পাঠান। আমরা ৫-২০ মিনিটে ডেলিভারি দেব!
            </p>
            <a
              href={getWhatsAppURL()}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 font-semibold rounded-xl h-11 sm:h-12 text-sm sm:text-base shadow-lg shadow-green-600/20 min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                WhatsApp-এ অর্ডার কনফার্ম করুন
              </Button>
            </a>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground text-center mt-1.5 sm:mt-2">
              আপনার অর্ডার ডিটেইলস অটোমেটিক পাঠানো হবে, শুধু Send ট্যাপ করুন! ✅
            </p>
          </div>

          {/* Quick contact */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {whatsappNumber}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 5-20 min</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Warranty</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

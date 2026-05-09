'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useProduct, useSettings } from '@/lib/hooks'
import { formatPriceBDT } from '@/lib/price'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, CreditCard, CheckCircle, MessageCircle, 
  Shield, Clock, Truck, Copy, Check, Send, ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type Step = 'details' | 'payment' | 'complete'

export function OrderForm() {
  const { pageParams, navigate } = useAppStore()
  const { data: product } = useProduct(pageParams.productId)
  const { data: settings } = useSettings()
  const { toast } = useToast()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'
  const bkashNumber = settings?.bkashNumber || settings?.paymentNumber || '01647236359'
  const nagadNumber = settings?.nagadNumber || settings?.paymentNumber || '01647236359'

  const [step, setStep] = useState<Step>('details')
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    customerName: '',
    customerWhatsApp: '',
    email: '',
    plan: '',
    accountType: '',
    paymentMethod: '',
    transactionId: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCopyAndOpen = (app: 'bkash' | 'nagad', number: string) => {
    // Copy number to clipboard first (always works)
    navigator.clipboard.writeText(number)
    setCopied(app)
    handleChange('paymentMethod', app === 'bkash' ? 'bKash' : 'Nagad')
    setTimeout(() => setCopied(null), 3000)

    toast({
      title: app === 'bkash' ? '✅ bKash নম্বর কপি হয়েছে!' : '✅ Nagad নম্বর কপি হয়েছে!',
      description: 'এখন bKash/Nagad অ্যাপে "Send Money" সিলেক্ট করুন এবং নম্বর পেস্ট করুন।',
    })

    // Try to open the app on mobile
    const link = document.createElement('a')
    link.href = app === 'bkash' ? 'bkash://' : 'nagad://'
    link.click()
  }

  const priceOptions: { label: string; priceBDT: string }[] = product?.priceOptions ? JSON.parse(product.priceOptions) : []

  const handleProceed = () => {
    setStep('payment')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePaymentDone = () => {
    setStep('complete')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Build WhatsApp message with order details
  const getWhatsAppURL = () => {
    const planInfo = form.plan ? ` (${form.plan})` : ''
    const typeInfo = form.accountType ? ` [${form.accountType}]` : ''
    const payInfo = form.paymentMethod ? `\n💳 Payment: Send Money via ${form.paymentMethod}` : ''
    const txnInfo = form.transactionId ? `\n🧾 Last 3 digits: ...${form.transactionId}` : ''
    const message = `🛒 *New Order — Streaming Hub*

📦 Product: ${product?.name || pageParams.productName}${planInfo}${typeInfo}
💰 Price: ${formatPriceBDT(product?.basePriceBDT || '')}${payInfo}${txnInfo}

👤 Name: ${form.customerName || 'N/A'}
📱 WhatsApp: ${form.customerWhatsApp || 'N/A'}
${form.email ? `📧 Email: ${form.email}` : ''}

✅ I have sent the money. Please confirm and deliver.`

    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
  }

  // ─── STEP 3: PAYMENT COMPLETE → WhatsApp ───
  if (step === 'complete') {
    return (
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-lg">
          <div className="text-center py-8">
            {/* Success animation */}
            <div className="relative mx-auto mb-6">
              <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">Send Money সম্পন্ন! ✅</h2>
            <p className="text-muted-foreground text-sm mb-1">
              এখন WhatsApp-এ যোগাযোগ করুন, আমরা ডেলিভারি দেব!
            </p>
            <p className="text-muted-foreground text-xs mb-8">
              Now contact us on WhatsApp with your order details. We&apos;ll deliver within 5-20 minutes!
            </p>

            {/* Order Summary */}
            <Card className="border shadow-sm mb-6 text-left">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product</span>
                    <span className="font-medium">{product?.name || pageParams.productName}</span>
                  </div>
                  {form.plan && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{form.plan}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-bold text-emerald-600">{formatPriceBDT(product?.basePriceBDT || '')}</span>
                  </div>
                  {form.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment</span>
                      <span className="font-medium">Send Money via {form.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp CTA — BIG */}
            <a
              href={getWhatsAppURL()}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 font-semibold rounded-xl h-14 text-base shadow-lg shadow-green-600/20">
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp-এ অর্ডার কনফার্ম করুন
              </Button>
            </a>

            <p className="text-[11px] text-muted-foreground mt-3">
              আপনার অর্ডার ডিটেইলস অটোমেটিক পাঠানো হবে, শুধু Send ট্যাপ করুন!
            </p>

            <Button
              variant="ghost"
              className="mt-4 text-muted-foreground"
              onClick={() => navigate('home')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    )
  }

  // ─── STEP 2: PAYMENT (Send Money) ───
  if (step === 'payment') {
    return (
      <section className="py-4 sm:py-6 px-4">
        <div className="container mx-auto max-w-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('details')}
            className="mb-4 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <h1 className="text-xl sm:text-2xl font-bold mb-1">Send Money করুন 💸</h1>
          <p className="text-muted-foreground text-sm mb-6">
            নিচের bKash বা Nagad অ্যাপে Send Money করুন
          </p>

          {/* Product Summary */}
          <Card className="border shadow-sm mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{product?.name || pageParams.productName}</p>
                  {form.plan && <p className="text-xs text-muted-foreground">{form.plan}</p>}
                </div>
                <span className="font-bold text-emerald-600">{formatPriceBDT(product?.basePriceBDT || '')}</span>
              </div>
            </CardContent>
          </Card>

          {/* How to Send Money Instructions */}
          <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-4 mb-3 border-2 border-red-300 dark:border-red-700">
            <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1 text-center">
              ⚠️ শুধুমাত্র Send Money করবেন!
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 text-center">
              bKash/Nagad অ্যাপে <strong>&quot;Send Money&quot; / &quot;সেন্ড মানি&quot;</strong> অপশন সিলেক্ট করুন।<br/>
              <strong>Payment বা Cash Out নয়!</strong> Only use Send Money option.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
              📱 Send Money করার নিয়ম:
            </p>
            <div className="space-y-1.5 text-xs text-blue-600 dark:text-blue-400">
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">১.</span>
                <span>নিচের <strong>bKash</strong> বা <strong>Nagad</strong> বাটনে ক্লিক করুন</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">২.</span>
                <span>নম্বর অটো কপি হবে → অ্যাপে <strong className="text-red-600 dark:text-red-400">&quot;Send Money&quot;</strong> সিলেক্ট করুন</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">৩.</span>
                <span>নম্বর পেস্ট করুন ও টাকার পরিমাণ দিন</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">৪.</span>
                <span>আপনার PIN দিয়ে কনফার্ম করুন</span>
              </div>
            </div>
          </div>

          {/* bKash Send Money */}
          <Card className="border shadow-sm mb-3">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500 flex items-center justify-center">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-pink-600">bKash Send Money</h3>
                  <p className="text-[11px] text-muted-foreground">বিকাশ সেন্ড মানি</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5 mb-3">
                <span className="font-mono font-bold text-lg">{bkashNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => handleCopy(bkashNumber, 'bkash-copy')}
                >
                  {copied === 'bkash-copy' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                size="sm"
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg h-11"
                onClick={() => handleCopyAndOpen('bkash', bkashNumber)}
              >
                {copied === 'bkash' ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    নম্বর কপি হয়েছে! অ্যাপে পেস্ট করুন
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    নম্বর কপি করুন + bKash অ্যাপ খুলুন
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Nagad Send Money */}
          <Card className="border shadow-sm mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-600">Nagad Send Money</h3>
                  <p className="text-[11px] text-muted-foreground">নগদ সেন্ড মানি</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5 mb-3">
                <span className="font-mono font-bold text-lg">{nagadNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => handleCopy(nagadNumber, 'nagad-copy')}
                >
                  {copied === 'nagad-copy' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                size="sm"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg h-11"
                onClick={() => handleCopyAndOpen('nagad', nagadNumber)}
              >
                {copied === 'nagad' ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    নম্বর কপি হয়েছে! অ্যাপে পেস্ট করুন
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    নম্বর কপি করুন + Nagad অ্যাপ খুলুন
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 mb-4">
            <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                <span><strong>Send Money</strong> করুন, Payment নয়। পেমেন্ট ফার্স্ট।</span>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>৫-২০ মিনিটে ডেলিভারি। Delivery within 5-20 minutes.</span>
              </div>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="mb-4">
            <Label className="text-sm font-medium">Transaction Last 3 Digits (optional)</Label>
            <Input
              maxLength={3}
              value={form.transactionId}
              onChange={e => handleChange('transactionId', e.target.value.replace(/\D/g, ''))}
              className="mt-1.5 h-10"
              style={{ fontSize: '16px' }}
              placeholder="e.g. 123"
            />
          </div>

          {/* Done Button */}
          <Button
            size="lg"
            onClick={handlePaymentDone}
            className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-xl h-12 text-base"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            আমি Send Money করেছি
          </Button>

          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Send Money করা হয়ে গেলে উপরের বাটনে ক্লিক করুন
          </p>
        </div>
      </section>
    )
  }

  // ─── STEP 1: ORDER DETAILS ───
  return (
    <section className="py-4 sm:py-6 px-4">
      <div className="container mx-auto max-w-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('products')}
          className="mb-4 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Product Card */}
        {product && (
          <Card className="border shadow-sm mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                  <ShoppingBagIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm">{product.name}</h2>
                  <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                </div>
                <span className="ml-auto font-bold text-emerald-600 whitespace-nowrap">
                  {formatPriceBDT(product.basePriceBDT)}
                </span>
              </div>
              {/* Price options */}
              {priceOptions.length > 1 && (
                <div className="mt-3 space-y-1">
                  {priceOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleChange('plan', `${opt.label} — ${formatPriceBDT(opt.priceBDT)}`)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        form.plan === `${opt.label} — ${formatPriceBDT(opt.priceBDT)}`
                          ? 'bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-700'
                          : 'bg-muted/50 hover:bg-muted border border-transparent'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="font-semibold text-emerald-600">{formatPriceBDT(opt.priceBDT)}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!product && pageParams.productName && (
          <div className="mb-6">
            <h2 className="font-bold text-lg">{pageParams.productName}</h2>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-bold mb-1">আপনার তথ্য দিন</h1>
        <p className="text-muted-foreground text-sm mb-5">
          Fill in your details to proceed
        </p>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label className="text-sm font-medium">আপনার নাম *</Label>
            <Input
              value={form.customerName}
              onChange={e => handleChange('customerName', e.target.value)}
              required
              className="mt-1.5 h-10"
              style={{ fontSize: '16px' }}
              placeholder="আপনার নাম"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <Label className="text-sm font-medium">WhatsApp Number *</Label>
            <Input
              value={form.customerWhatsApp}
              onChange={e => handleChange('customerWhatsApp', e.target.value)}
              required
              className="mt-1.5 h-10"
              style={{ fontSize: '16px' }}
              placeholder="+880XXXXXXXXXX"
            />
          </div>

          {/* Email */}
          <div>
            <Label className="text-sm font-medium">Email (for account)</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              className="mt-1.5 h-10"
              style={{ fontSize: '16px' }}
              placeholder="your@email.com"
            />
          </div>

          {/* Account Type — if applicable */}
          {product?.accountType && (
            <div>
              <Label className="text-sm font-medium">Account Type</Label>
              <Input
                value={form.accountType || product.accountType}
                onChange={e => handleChange('accountType', e.target.value)}
                className="mt-1.5 h-10"
                style={{ fontSize: '16px' }}
                placeholder={product.accountType}
              />
            </div>
          )}

          {/* Proceed to Payment */}
          <Button
            size="lg"
            onClick={handleProceed}
            disabled={!form.customerName || !form.customerWhatsApp}
            className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-xl h-12 text-base mt-2 disabled:opacity-50"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Send Money পেজে যান
          </Button>

          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground mt-2">
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 5-20 min delivery</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> WhatsApp support</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

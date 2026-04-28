'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useSettings } from '@/lib/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, MessageCircle, Loader2 } from 'lucide-react'
import { getWhatsAppOrderURL } from '@/lib/price'

export function OrderForm() {
  const { pageParams, navigate } = useAppStore()
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    productName: pageParams.productName || '',
    customerName: '',
    whatsappNumber: '',
    email: '',
    planDuration: '',
    accountType: '',
    quantity: '1',
    notes: '',
    paymentMethod: '',
    transactionLast3: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName,
          customerName: form.customerName,
          whatsappNumber: form.whatsappNumber,
          email: form.email || null,
          planDuration: form.planDuration || null,
          accountType: form.accountType || null,
          quantity: parseInt(form.quantity) || 1,
          notes: form.notes || null,
          paymentMethod: form.paymentMethod || null,
          transactionLast3: form.transactionLast3 || null,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      }
    } catch {
      // Error handling
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    const waURL = getWhatsAppOrderURL(form.productName, '', whatsappNumber)
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-lg text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Order Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your order has been received. Please complete your payment and send the transaction details via WhatsApp for quick processing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={waURL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4 mr-2" /> Send on WhatsApp
              </Button>
            </a>
            <Button variant="outline" onClick={() => navigate('home')}>
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('products')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Place Your Order</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Fill in the details below to place your order. We&apos;ll process it within 5-20 minutes after payment.
        </p>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Name */}
              <div>
                <Label className="text-sm font-medium">Product Name</Label>
                <Input
                  value={form.productName}
                  onChange={e => handleChange('productName', e.target.value)}
                  required
                  className="mt-1.5"
                  placeholder="Enter product name"
                />
              </div>

              {/* Customer Name */}
              <div>
                <Label className="text-sm font-medium">Your Name *</Label>
                <Input
                  value={form.customerName}
                  onChange={e => handleChange('customerName', e.target.value)}
                  required
                  className="mt-1.5"
                  placeholder="Enter your name"
                />
              </div>

              {/* WhatsApp Number */}
              <div>
                <Label className="text-sm font-medium">WhatsApp Number *</Label>
                <Input
                  value={form.whatsappNumber}
                  onChange={e => handleChange('whatsappNumber', e.target.value)}
                  required
                  className="mt-1.5"
                  placeholder="+880XXXXXXXXXX"
                />
              </div>

              {/* Email */}
              <div>
                <Label className="text-sm font-medium">Email / Account Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="mt-1.5"
                  placeholder="your@email.com"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Plan Duration */}
                <div>
                  <Label className="text-sm font-medium">Plan Duration</Label>
                  <Select value={form.planDuration} onValueChange={v => handleChange('planDuration', v)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 month">1 Month</SelectItem>
                      <SelectItem value="3 months">3 Months</SelectItem>
                      <SelectItem value="6 months">6 Months</SelectItem>
                      <SelectItem value="1 year">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Type */}
                <div>
                  <Label className="text-sm font-medium">Account Type</Label>
                  <Select value={form.accountType} onValueChange={v => handleChange('accountType', v)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Shared">Shared</SelectItem>
                      <SelectItem value="Own Mail">Own Mail</SelectItem>
                      <SelectItem value="Mail Access">Mail Access</SelectItem>
                      <SelectItem value="Gift Card">Gift Card</SelectItem>
                      <SelectItem value="TopUp">TopUp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label className="text-sm font-medium">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e => handleChange('quantity', e.target.value)}
                  className="mt-1.5 max-w-32"
                />
              </div>

              {/* Notes */}
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  className="mt-1.5"
                  placeholder="Any special instructions..."
                  rows={3}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Payment Method */}
                <div>
                  <Label className="text-sm font-medium">Payment Method *</Label>
                  <Select value={form.paymentMethod} onValueChange={v => handleChange('paymentMethod', v)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bKash">bKash</SelectItem>
                      <SelectItem value="Nagad">Nagad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transaction Last 3 */}
                <div>
                  <Label className="text-sm font-medium">Transaction Last 3 Digits</Label>
                  <Input
                    maxLength={3}
                    value={form.transactionLast3}
                    onChange={e => handleChange('transactionLast3', e.target.value.replace(/\D/g, ''))}
                    className="mt-1.5"
                    placeholder="e.g. 123"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Order'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

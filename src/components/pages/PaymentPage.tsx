'use client'

import { useAppStore } from '@/lib/store'
import { useSettings } from '@/lib/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Phone, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react'

export function PaymentPage() {
  const { navigate } = useAppStore()
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'
  const bkashNumber = settings?.bkashNumber || settings?.paymentNumber || '01647236359'
  const nagadNumber = settings?.nagadNumber || settings?.paymentNumber || '01647236359'

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Payment Information</h1>
        <p className="text-muted-foreground text-sm mb-8">
          পেমেন্ট সংক্রান্ত তথ্য / Payment Instructions
        </p>

        {/* bKash */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-pink-600">bKash Payment</h2>
                <p className="text-sm text-muted-foreground">বিকাশ পেমেন্ট</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span><strong>bKash Number:</strong> {bkashNumber}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-semibold">Instructions / নিয়মাবলী:</p>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Send payment to the bKash number above.<br />উপরের বিকাশ নম্বরে পেমেন্ট পাঠান।</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>In the reference, mention your name and the product name.<br />রেফারেন্সে আপনার নাম এবং পণ্যের নাম লিখুন।</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>After payment, send the last 3 digits of transaction ID via WhatsApp.<br />পেমেন্টের পর ট্রানজেকশন আইডির শেষ ৩ ডিজিট WhatsApp-এ পাঠান।</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nagad */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-orange-600">Nagad Payment</h2>
                <p className="text-sm text-muted-foreground">নগদ পেমেন্ট</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span><strong>Nagad Number:</strong> {nagadNumber}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-semibold">Instructions / নিয়মাবলী:</p>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Send payment to the Nagad number above.<br />উপরের নগদ নম্বরে পেমেন্ট পাঠান।</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>In the reference, mention your name and the product name.<br />রেফারেন্সে আপনার নাম এবং পণ্যের নাম লিখুন।</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>After payment, send the last 3 digits of transaction ID via WhatsApp.<br />পেমেন্টের পর ট্রানজেকশন আইডির শেষ ৩ ডিজিট WhatsApp-এ পাঠান।</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-6 border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-amber-600">Important Notes / গুরুত্বপূর্ণ তথ্য</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Payment First:</strong> We require payment before delivery. পেমেন্ট ফার্স্ট ব্যবস্থা।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Delivery Time:</strong> 5-20 minutes after payment confirmation. পেমেন্ট নিশ্চিত হওয়ার ৫-২০ মিনিটের মধ্যে ডেলিভারি।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Warranty:</strong> All subscriptions come with warranty. সকল সাবস্ক্রিপশনে ওয়ারেন্টি আছে।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Support:</strong> Contact us on WhatsApp for any issues. যেকোনো সমস্যায় WhatsApp-এ যোগাযোগ করুন।</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <h2 className="font-bold mb-4">Need Help? / সাহায্য দরকার?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Contact us on WhatsApp for any payment-related queries.<br />
              পেমেন্ট সংক্রান্ত যেকোনো প্রশ্নে WhatsApp-এ যোগাযোগ করুন।
            </p>
            <a
              href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4 mr-2" /> Chat on WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

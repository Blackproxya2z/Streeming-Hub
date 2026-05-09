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
        <p className="text-muted-foreground text-sm mb-4">
          পেমেন্ট সংক্রান্ত তথ্য / Payment Instructions
        </p>

        {/* ⚠️ IMPORTANT: Send Money Notice */}
        <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-4 mb-6 border-2 border-red-300 dark:border-red-700">
          <p className="text-base font-bold text-red-600 dark:text-red-400 mb-1 text-center">
            ⚠️ শুধুমাত্র Send Money করবেন!
          </p>
          <p className="text-sm text-red-500 dark:text-red-400 text-center">
            bKash/Nagad অ্যাপে <strong>&quot;Send Money&quot; / &quot;সেন্ড মানি&quot;</strong> অপশন সিলেক্ট করুন।<br/>
            <strong>Payment বা Cash Out নয়!</strong> Only use Send Money option.
          </p>
        </div>

        {/* bKash */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-pink-600">bKash Send Money</h2>
                <p className="text-sm text-muted-foreground">বিকাশ সেন্ড মানি</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span><strong>bKash Number:</strong> {bkashNumber}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-semibold">Send Money করার নিয়ম:</p>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Send Money</strong> অপশন সিলেক্ট করুন, Payment নয়!<br />Select <strong>Send Money</strong>, not Payment!</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>উপরের বিকাশ নম্বরে Send Money করুন।<br />Send Money to the bKash number above.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Send Money করার পর Transaction ID-এর শেষ ৩ ডিজিট WhatsApp-এ পাঠান।<br />After sending, share the last 3 digits of transaction ID via WhatsApp.</span>
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
                <h2 className="text-lg font-bold text-orange-600">Nagad Send Money</h2>
                <p className="text-sm text-muted-foreground">নগদ সেন্ড মানি</p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span><strong>Nagad Number:</strong> {nagadNumber}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="font-semibold">Send Money করার নিয়ম:</p>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Send Money</strong> অপশন সিলেক্ট করুন, Payment নয়!<br />Select <strong>Send Money</strong>, not Payment!</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>উপরের নগদ নম্বরে Send Money করুন।<br />Send Money to the Nagad number above.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Send Money করার পর Transaction ID-এর শেষ ৩ ডিজিট WhatsApp-এ পাঠান।<br />After sending, share the last 3 digits of transaction ID via WhatsApp.</span>
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
                <span><strong>Send Money First:</strong> পেমেন্ট ফার্স্ট — আগে Send Money, তারপর ডেলিভারি। Payment first, then delivery.</span>
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

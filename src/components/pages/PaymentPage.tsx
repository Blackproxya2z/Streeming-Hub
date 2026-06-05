'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useSettings } from '@/lib/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Phone, MessageCircle, CheckCircle, AlertCircle, Copy, Check, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function PaymentPage() {
  const { navigate } = useAppStore()
  const { data: settings } = useSettings()
  const { toast } = useToast()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'
  const bkashNumber = settings?.bkashNumber || settings?.paymentNumber || '01647236359'
  const nagadNumber = settings?.nagadNumber || settings?.paymentNumber || '01647236359'
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCopyAndOpen = (app: 'bkash' | 'nagad', number: string) => {
    // Copy number to clipboard first (always works)
    navigator.clipboard.writeText(number)
    setCopied(app)
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

  return (
    <section className="py-4 sm:py-8 px-3 sm:px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2">Payment Information</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
          পেমেন্ট সংক্রান্ত তথ্য / Payment Instructions
        </p>

        {/* ⚠️ IMPORTANT: Send Money Notice */}
        <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-red-300 dark:border-red-700">
          <p className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400 mb-1 text-center">
            ⚠️ শুধুমাত্র Send Money করবেন!
          </p>
          <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 text-center">
            bKash/Nagad অ্যাপে <strong>&quot;Send Money&quot; / &quot;সেন্ড মানি&quot;</strong> অপশন সিলেক্ট করুন।<br/>
            <strong>Payment বা Cash Out নয়!</strong> Only use Send Money option.
          </p>
        </div>

        {/* bKash */}
        <Card className="mb-4 sm:mb-6 border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-pink-600">bKash Send Money</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">বিকাশ সেন্ড মানি</p>
              </div>
            </div>
            <Separator className="mb-3 sm:mb-4" />
            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                <span><strong>bKash Number:</strong> {bkashNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 ml-auto"
                  onClick={() => handleCopy(bkashNumber, 'bkash-copy')}
                >
                  {copied === 'bkash-copy' ? <Check className="h-4 w-4 text-[#00A6A6]" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                <p className="font-semibold text-xs sm:text-sm">Send Money করার নিয়ম:</p>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-xs">নিচের বাটনে ক্লিক করুন — নম্বর অটো কপি হবে</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-xs"><strong>Send Money</strong> অপশন সিলেক্ট করুন, Payment নয়!</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-xs">নম্বর পেস্ট করুন এবং Send Money করুন।</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-xs">Transaction ID-এর শেষ ৩ ডিজিট WhatsApp-এ পাঠান।</span>
                </div>
              </div>
              <Button
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg h-10 sm:h-11 text-xs sm:text-sm"
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
            </div>
          </CardContent>
        </Card>

        {/* Nagad */}
        <Card className="mb-4 sm:mb-6 border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-orange-600">Nagad Send Money</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">নগদ সেন্ড মানি</p>
              </div>
            </div>
            <Separator className="mb-3 sm:mb-4" />
            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                <span><strong>Nagad Number:</strong> {nagadNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 ml-auto"
                  onClick={() => handleCopy(nagadNumber, 'nagad-copy')}
                >
                  {copied === 'nagad-copy' ? <Check className="h-4 w-4 text-[#00A6A6]" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                <p className="font-semibold text-xs sm:text-sm">Send Money করার নিয়ম:</p>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-xs">নিচের বাটনে ক্লিক করুন — নম্বর অটো কপি হবে</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-xs"><strong>Send Money</strong> অপশন সিলেক্ট করুন, Payment নয়!</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-xs">নম্বর পেস্ট করুন এবং Send Money করুন।</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-xs">Transaction ID-এর শেষ ৩ ডিজিট WhatsApp-এ পাঠান।</span>
                </div>
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg h-10 sm:h-11 text-xs sm:text-sm"
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
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-4 sm:mb-6 border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              <h2 className="font-bold text-sm sm:text-base text-amber-600">Important Notes / গুরুত্বপূর্ণ তথ্য</h2>
            </div>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                <span><strong>Send Money First:</strong> পেমেন্ট ফার্স্ট — আগে Send Money, তারপর ডেলিভারি।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                <span><strong>Delivery Time:</strong> 5-20 minutes after payment confirmation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                <span><strong>Warranty:</strong> All subscriptions come with warranty.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00A6A6] shrink-0 mt-0.5" />
                <span><strong>Support:</strong> Contact us on WhatsApp for any issues.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center">
            <h2 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Need Help? / সাহায্য দরকার?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Contact us on WhatsApp for any payment-related queries.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-green-600 hover:bg-green-700 h-10 sm:h-auto text-xs sm:text-sm">
                <MessageCircle className="h-4 w-4 mr-2" /> Chat on WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

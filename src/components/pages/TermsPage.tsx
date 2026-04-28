'use client'

import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TermsPage() {
  const { navigate } = useAppStore()

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('home')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: January 2025</p>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
              <h2>1. General Terms</h2>
              <p>
                By using Subscription Lagbe&apos;s services, you agree to these terms and conditions. These terms apply to all users of the website and services provided by Subscription Lagbe.
              </p>

              <h2>2. Service Description</h2>
              <p>
                Subscription Lagbe provides digital subscription services including but not limited to OTT platforms, AI tools, educational platforms, VPN services, gaming top-ups, and gift cards. All subscriptions are provided as per the described duration and terms.
              </p>

              <h2>3. Payment Terms</h2>
              <p>
                All orders require advance payment via bKash or Nagad. Payment must be confirmed before delivery. We do not offer cash on delivery (COD) or any post-delivery payment options.
              </p>

              <h2>4. Delivery</h2>
              <p>
                Most subscriptions are delivered within 5-20 minutes after payment confirmation. Delivery times may vary depending on product availability and demand. We strive to deliver as quickly as possible.
              </p>

              <h2>5. Warranty Policy</h2>
              <p>
                All subscriptions come with a warranty period as specified in the product listing. During the warranty period, if any issues arise with the subscription, we will fix or replace the account at no extra cost. Warranty does not cover:
              </p>
              <ul>
                <li>Account sharing outside our terms</li>
                <li>Intentional violation of the service provider&apos;s terms</li>
                <li>Changes made to the account without our knowledge</li>
              </ul>

              <h2>6. Refund Policy</h2>
              <p>
                Refunds are available only if:
              </p>
              <ul>
                <li>The subscription cannot be delivered within a reasonable time</li>
                <li>The subscription stops working and cannot be replaced</li>
                <li>A mutual agreement is reached between both parties</li>
              </ul>
              <p>
                Refunds will be processed via the same payment method within 24-48 hours.
              </p>

              <h2>7. Account Usage</h2>
              <p>
                For shared accounts, users must not change the password or any account settings without permission. For personal accounts, users have full control. Any violation may result in warranty voiding.
              </p>

              <h2>8. Privacy</h2>
              <p>
                We respect your privacy and will not share your personal information with third parties. See our Privacy Policy for more details.
              </p>

              <h2>9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Users will be notified of significant changes via our website or WhatsApp.
              </p>

              <h2>10. Contact</h2>
              <p>
                For any questions regarding these terms, contact us on WhatsApp: +8801647236359
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

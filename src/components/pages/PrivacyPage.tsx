'use client'

import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrivacyPage() {
  const { navigate } = useAppStore()

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('home')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: January 2025</p>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Information We Collect</h2>
              <p>We collect the following information when you place an order:</p>
              <ul>
                <li><strong>Personal Information:</strong> Your name, WhatsApp number, and email address (if provided).</li>
                <li><strong>Payment Information:</strong> Payment method and last 3 digits of transaction ID (for verification only).</li>
                <li><strong>Order Information:</strong> Product name, quantity, and order preferences.</li>
              </ul>
              <p>We do NOT collect or store full payment details, card numbers, or banking information.</p>

              <h2>2. How We Use Your Information</h2>
              <p>Your information is used solely for:</p>
              <ul>
                <li>Processing and delivering your orders</li>
                <li>Communicating order status and updates</li>
                <li>Providing customer support</li>
                <li>Warranty claims and account recovery</li>
              </ul>

              <h2>3. Information Sharing</h2>
              <p>
                We do NOT sell, trade, or share your personal information with third parties. Your data is kept strictly confidential and used only for the purposes stated above.
              </p>

              <h2>4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. All communications via WhatsApp are encrypted. We do not store sensitive payment data.
              </p>

              <h2>5. Cookies</h2>
              <p>
                Our website may use cookies for basic functionality such as theme preference and navigation state. We do not use tracking cookies or third-party analytics that identify you personally.
              </p>

              <h2>6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Request access to your personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Opt out of any non-essential communications</li>
              </ul>

              <h2>7. Children&apos;s Privacy</h2>
              <p>
                Our services are not intended for children under 18. We do not knowingly collect personal information from minors. Adult content is age-gated and requires age verification.
              </p>

              <h2>8. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. Changes will be posted on this page with an updated date.
              </p>

              <h2>9. Contact Us</h2>
              <p>
                If you have questions about this privacy policy, contact us on WhatsApp: +8801647236359
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

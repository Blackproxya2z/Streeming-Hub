'use client'

import { useAppStore } from '@/lib/store'
import { useSettings } from '@/lib/hooks'
import { ShoppingBag, Phone, MessageCircle, Shield, Clock, CreditCard, Heart } from 'lucide-react'

export function Footer() {
  const { navigate } = useAppStore()
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'
  const paymentNumber = settings?.paymentNumber || 'bKash/Nagad'

  return (
    <footer className="bg-muted/50 border-t mt-auto pb-[env(safe-area-inset-bottom,0px)]" role="contentinfo" itemScope itemType="https://schema.org/Organization">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center" aria-hidden="true">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent" itemProp="name">
                Streaming Hub
              </span>
            </div>
            <p className="text-sm text-muted-foreground" itemProp="description">
              Your trusted store for premium digital subscriptions in Bangladesh. OTT, AI tools, education, VPN & more — fast delivery with full warranty.
            </p>
            <meta itemProp="url" content="https://streaminghub.com.bd" />
            <meta itemProp="telephone" content="+8801647236359" />
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider">Quick Links</h2>
            <nav className="flex flex-col gap-2" aria-label="Footer navigation">
              <button onClick={() => navigate('home')} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Home</button>
              <button onClick={() => navigate('products')} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">All Products</button>
              <button onClick={() => navigate('payment')} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Payment Number</button>
              <button onClick={() => navigate('reviews')} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Customer Reviews</button>
              <button onClick={() => navigate('terms')} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Terms & Conditions</button>
              <button onClick={() => navigate('privacy')} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Privacy Policy</button>
              <button onClick={() => navigate('contact')} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Contact Us</button>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider">Contact Us</h2>
            <div className="flex flex-col gap-3">
              <a
                href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                WhatsApp: {whatsappNumber}
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                Payment: {paymentNumber}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-amber-500" />
                Delivery: 5–20 minutes
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider">Why Trust Us</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-emerald-500" />
                Warranty Available
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-amber-500" />
                Fast Delivery
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4 text-blue-500" />
                Secure Payment
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-green-500" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Streaming Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('admin')}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                Admin
              </button>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> in Bangladesh
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

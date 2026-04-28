'use client'

import { useAppStore } from '@/lib/store'
import { useSettings } from '@/lib/hooks'
import { getWhatsAppOrderURL } from '@/lib/price'
import { Button } from '@/components/ui/button'
import { ShoppingBag, MessageCircle, Sparkles, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export function HeroSection() {
  const { navigate } = useAppStore()
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-20 lg:py-28 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Trusted by 1000+ customers in Bangladesh
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6"
          >
            Premium Subscriptions
            <span className="block text-emerald-200">at Best Price</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-emerald-100 mb-10 max-w-2xl mx-auto"
          >
            OTT, AI tools, education, VPN, software, gaming top-up and more — all in one trusted store.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate('products')}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-base px-8 h-12 rounded-xl shadow-lg"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Shop Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <a
              href={getWhatsAppOrderURL('', '', whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold text-base px-8 h-12 rounded-xl"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Order on WhatsApp
              </Button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-14 grid grid-cols-3 gap-6 max-w-md mx-auto"
          >
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">129+</p>
              <p className="text-xs sm:text-sm text-emerald-200">Products</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">11</p>
              <p className="text-xs sm:text-sm text-emerald-200">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">5-20</p>
              <p className="text-xs sm:text-sm text-emerald-200">Min Delivery</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

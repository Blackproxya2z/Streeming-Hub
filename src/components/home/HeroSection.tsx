'use client'

import { useAppStore } from '@/lib/store'
import { useSettings } from '@/lib/hooks'
import { getWhatsAppOrderURL } from '@/lib/price'
import { Button } from '@/components/ui/button'
import { ShoppingBag, MessageCircle, Sparkles, ArrowRight, Shield, Zap, Clock } from 'lucide-react'
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
        {/* Animated floating orbs */}
        <motion.div
          animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-[15%] w-20 h-20 rounded-full bg-white/5 blur-xl"
        />
        <motion.div
          animate={{ y: [10, -10, 10], x: [5, -5, 5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-[10%] w-32 h-32 rounded-full bg-teal-300/10 blur-xl"
        />
        <motion.div
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[60%] right-[25%] w-16 h-16 rounded-full bg-emerald-300/8 blur-lg"
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-20 lg:py-28 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-sm font-medium mb-6 border border-white/10">
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
            <span className="block text-emerald-200">at the Best Price in BD</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-emerald-100 mb-10 max-w-2xl mx-auto"
          >
            OTT, AI tools, education, VPN, software, gaming top-up & more — delivered in 5-20 minutes with full warranty.
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
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-base px-8 h-12 rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:shadow-xl hover:shadow-emerald-900/30"
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
                className="border-white/30 text-white hover:bg-white/10 font-semibold text-base px-8 h-12 rounded-xl backdrop-blur-sm"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Order on WhatsApp
              </Button>
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12"
          >
            <div className="flex items-center justify-center gap-6 sm:gap-8 flex-wrap">
              <div className="flex items-center gap-2 text-emerald-100">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-emerald-200" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-emerald-200/70">Secure</p>
                  <p className="text-sm font-semibold">Warranty</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-100">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-emerald-200" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-emerald-200/70">Fast</p>
                  <p className="text-sm font-semibold">5-20 Min</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-100">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-emerald-200" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-emerald-200/70">24/7</p>
                  <p className="text-sm font-semibold">Support</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 grid grid-cols-3 gap-6 max-w-sm mx-auto bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10"
          >
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">129+</p>
              <p className="text-xs sm:text-sm text-emerald-200">Products</p>
            </div>
            <div className="text-center border-x border-white/10">
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

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" className="fill-background" />
        </svg>
      </div>
    </section>
  )
}

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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2027] to-[#0c1a1a] text-white animate-gradient" style={{ backgroundSize: '200% 200%' }} aria-label="Hero Banner — Premium Subscriptions at Best Price in Bangladesh">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-400/8 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-coral-400/8 blur-3xl" style={{ background: 'oklch(0.72 0.19 30 / 8%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'oklch(0.62 0.19 170 / 6%)' }} />
        {/* Animated floating orbs */}
        <motion.div
          animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-[15%] w-20 h-20 rounded-full blur-xl"
          style={{ background: 'oklch(0.62 0.19 170 / 12%)' }}
        />
        <motion.div
          animate={{ y: [10, -10, 10], x: [5, -5, 5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-[10%] w-32 h-32 rounded-full blur-xl"
          style={{ background: 'oklch(0.72 0.19 30 / 12%)' }}
        />
        <motion.div
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[60%] right-[25%] w-16 h-16 rounded-full blur-lg"
          style={{ background: 'oklch(0.55 0.22 340 / 10%)' }}
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-14 sm:py-18 md:py-22 lg:py-28 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/10 backdrop-blur text-xs sm:text-sm font-medium mb-5 sm:mb-6 border border-white/10" style={{ boxShadow: '0 0 20px oklch(0.72 0.19 30 / 15%)' }}>
              <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5" style={{ color: 'oklch(0.72 0.19 30)' }} />
              Trusted by 1000+ customers in Bangladesh
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5 sm:mb-6"
          >
            Premium Subscriptions
            <span className="block bg-gradient-to-r from-teal-300 to-[#10b981] bg-clip-text text-transparent">at the Best Price in BD</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-slate-200 mb-7 sm:mb-9 md:mb-10 max-w-2xl mx-auto"
          >
            OTT, AI tools, education, VPN, software, gaming top-up & more — delivered in 5-20 minutes with full warranty.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate('products')}
              className="w-full sm:w-auto bg-[#10b981] hover:bg-[#34d399] text-white font-semibold text-sm sm:text-base px-7 sm:px-8 h-12 sm:h-13 rounded-xl shadow-lg shadow-[#10b981]/25 transition-all hover:shadow-xl hover:shadow-[#10b981]/40 hover:scale-[1.02]"
            >
              <ShoppingBag className="h-5 w-5 sm:h-5.5 sm:w-5.5 mr-2" />
              Shop Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <a
              href={getWhatsAppOrderURL('', '', whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 font-semibold text-sm sm:text-base px-7 sm:px-8 h-12 sm:h-13 rounded-xl backdrop-blur-sm hover:border-[oklch(0.72_0.19_30/0.5)] transition-colors"
              >
                <MessageCircle className="h-5 w-5 sm:h-5.5 sm:w-5.5 mr-2" />
                Order on WhatsApp
              </Button>
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-9 sm:mt-11 md:mt-12"
          >
            <div className="flex items-center justify-center gap-5 sm:gap-7 md:gap-9 flex-wrap">
              <div className="flex items-center gap-2 sm:gap-2.5 text-slate-200">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-teal-300" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] sm:text-xs text-slate-300/70">Secure</p>
                  <p className="text-xs sm:text-sm font-semibold">Warranty</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5 text-slate-200">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 sm:h-4.5 sm:w-4.5" style={{ color: 'oklch(0.72 0.19 30)' }} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] sm:text-xs text-slate-300/70">Fast</p>
                  <p className="text-xs sm:text-sm font-semibold">5-20 Min</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5 text-slate-200">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-teal-300" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] sm:text-xs text-slate-300/70">24/7</p>
                  <p className="text-xs sm:text-sm font-semibold">Support</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-xs sm:max-w-sm mx-auto rounded-2xl p-4 sm:p-5 backdrop-blur-sm border border-white/10" style={{ background: 'linear-gradient(135deg, oklch(1 0 0 / 5%), oklch(0.62 0.19 170 / 8%), oklch(0.72 0.19 30 / 5%))' }}
          >
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">200+</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-slate-300">Products</p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">11</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-slate-300">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">5-20</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-slate-300">Min Delivery</p>
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

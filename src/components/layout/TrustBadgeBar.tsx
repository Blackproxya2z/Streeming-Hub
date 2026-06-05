'use client'

import {
  Shield,
  Zap,
  Clock,
  CreditCard,
  BadgeCheck,
  Truck,
  Headphones,
  Lock,
} from 'lucide-react'
import { motion } from 'framer-motion'

const badges = [
  {
    icon: Shield,
    label: 'Full Warranty',
    sublabel: 'গ্যারান্টি সহ',
    color: 'text-[#10b981] dark:text-[#34d399]',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  {
    icon: Zap,
    label: '5-20 Min Delivery',
    sublabel: 'দ্রুত ডেলিভারি',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
  },
  {
    icon: CreditCard,
    label: 'bKash / Nagad',
    sublabel: 'পেমেন্ট সুবিধা',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
  },
  {
    icon: Headphones,
    label: '24/7 Support',
    sublabel: 'সাপোর্ট পাওয়া যায়',
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/50',
  },
  {
    icon: Lock,
    label: 'Secure Payment',
    sublabel: 'নিরাপদ পেমেন্ট',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/50',
  },
  {
    icon: BadgeCheck,
    label: '1000+ Customers',
    sublabel: 'বিশ্বস্ত ক্রেতা',
    color: 'text-[#0f172a] dark:text-[#10b981]',
    bg: 'bg-slate-50 dark:bg-[#0f172a]/50',
  },
]

export function TrustBadgeBar() {
  return (
    <div className="w-full border-b bg-background/80 backdrop-blur-sm" role="complementary" aria-label="Trust badges and guarantees">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5 py-2.5 sm:py-3 overflow-x-auto scrollbar-none">
          {badges.map((badge, i) => {
            const Icon = badge.icon
            return (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-2 sm:gap-2.5 shrink-0"
              >
                <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border/50 ${badge.bg} transition-all hover:shadow-sm`}>
                  <Icon className={`h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0 ${badge.color}`} />
                  <div className="flex flex-col leading-none">
                    <span className="text-[11px] sm:text-xs font-semibold text-foreground whitespace-nowrap">{badge.label}</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap hidden sm:block">{badge.sublabel}</span>
                  </div>
                </div>
                {i < badges.length - 1 && (
                  <div className="w-px h-5 sm:h-7 bg-border/40 shrink-0 hidden md:block" />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useBanners } from '@/lib/hooks'
import { Megaphone } from 'lucide-react'

export function AnnouncementBar() {
  const { data: banners } = useBanners()

  const defaultText = 'Fast delivery in 5–20 minutes | Payment First | WhatsApp Order Available'
  const text = banners && banners.length > 0
    ? banners.map(b => b.text).join(' | ')
    : defaultText

  return (
    <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 dark:from-[#0a1628] dark:via-[#0c2a2a] dark:to-[#1a0f0a] text-white py-1.5 sm:py-2 overflow-hidden relative">
      {/* Scrolling marquee */}
      <div className="flex items-center animate-marquee whitespace-nowrap">
        <div className="flex items-center gap-8 px-4">
          {[1, 2, 3].map((i) => (
            <span key={i} className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Megaphone className="h-3.5 w-3.5 shrink-0" />
              {text}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-8 px-4">
          {[1, 2, 3].map((i) => (
            <span key={`dup-${i}`} className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Megaphone className="h-3.5 w-3.5 shrink-0" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

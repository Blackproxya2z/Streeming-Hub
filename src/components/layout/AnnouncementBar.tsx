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
    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white py-2 overflow-hidden relative">
      <div className="flex items-center justify-center gap-2 px-4">
        <Megaphone className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium truncate">
          {text}
        </p>
      </div>
    </div>
  )
}

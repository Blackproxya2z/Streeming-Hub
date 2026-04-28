'use client'

import { useSettings } from '@/lib/hooks'
import { MessageCircle } from 'lucide-react'

export function FloatingWhatsApp() {
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'

  return (
    <a
      href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-40 lg:bottom-6 lg:right-6 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  )
}

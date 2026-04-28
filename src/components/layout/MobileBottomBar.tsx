'use client'

import { useAppStore } from '@/lib/store'
import { useSettings } from '@/lib/hooks'
import { Home, Search, Grid3X3, MessageCircle } from 'lucide-react'

export function MobileBottomBar() {
  const { navigate, setSearchQuery, currentPage } = useAppStore()
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur border-t">
      <div className="grid grid-cols-4 h-16">
        <button
          onClick={() => navigate('home')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentPage === 'home' ? 'text-emerald-600' : 'text-muted-foreground'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => {
            setSearchQuery('')
            navigate('products')
          }}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentPage === 'products' || currentPage === 'category' ? 'text-emerald-600' : 'text-muted-foreground'
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium">Search</span>
        </button>
        <button
          onClick={() => navigate('products')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentPage === 'products' ? 'text-emerald-600' : 'text-muted-foreground'
          }`}
        >
          <Grid3X3 className="h-5 w-5" />
          <span className="text-[10px] font-medium">Categories</span>
        </button>
        <a
          href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 text-green-600"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px] font-medium">WhatsApp</span>
        </a>
      </div>
    </div>
  )
}

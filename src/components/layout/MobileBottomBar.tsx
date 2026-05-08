'use client'

import { useAppStore } from '@/lib/store'
import { useSettings } from '@/lib/hooks'
import { Home, Search, Grid3X3, MessageCircle } from 'lucide-react'

export function MobileBottomBar() {
  const { navigate, setSearchQuery, currentPage } = useAppStore()
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t shadow-[0_-1px_3px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-4 h-14">
        <button
          onClick={() => navigate('home')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 ${
            currentPage === 'home' ? 'text-emerald-600' : 'text-muted-foreground'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[11px] font-medium">Home</span>
        </button>
        <button
          onClick={() => {
            setSearchQuery('')
            navigate('products')
          }}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 ${
            currentPage === 'products' || currentPage === 'category' ? 'text-emerald-600' : 'text-muted-foreground'
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-[11px] font-medium">Search</span>
        </button>
        <button
          onClick={() => navigate('products')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 ${
            currentPage === 'products' ? 'text-emerald-600' : 'text-muted-foreground'
          }`}
        >
          <Grid3X3 className="h-5 w-5" />
          <span className="text-[11px] font-medium">Categories</span>
        </button>
        <a
          href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-0.5 text-green-600 active:scale-95"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[11px] font-medium">WhatsApp</span>
        </a>
      </div>
    </div>
  )
}

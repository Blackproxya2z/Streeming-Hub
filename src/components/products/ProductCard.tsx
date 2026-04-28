'use client'

import { useAppStore } from '@/lib/store'
import { useSettings } from '@/lib/hooks'
import { formatPriceBDT, formatPriceRMB, getWhatsAppOrderURL } from '@/lib/price'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Eye, Star, Clock, Shield, Zap, Globe, Timer } from 'lucide-react'
import type { Product } from '@/lib/hooks'

const stockColors: Record<string, string> = {
  'Available': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Limited Stock': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Out of Stock': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const gradients = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-purple-400 to-violet-500',
  'from-pink-400 to-rose-500',
  'from-blue-400 to-cyan-500',
  'from-red-400 to-rose-500',
  'from-indigo-400 to-blue-500',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { navigate } = useAppStore()
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'

  const initials = product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const gradient = getGradient(product.name)
  const stockClass = stockColors[product.stockStatus] || stockColors['Available']

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image area */}
        <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-4xl font-bold text-white/70">{initials}</span>
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isBestSeller && (
              <Badge className="bg-amber-500 text-white border-0 text-[10px]">
                <Star className="h-3 w-3 mr-0.5" /> Best Seller
              </Badge>
            )}
            {product.isNewArrival && (
              <Badge className="bg-emerald-500 text-white border-0 text-[10px]">
                <Zap className="h-3 w-3 mr-0.5" /> New
              </Badge>
            )}
          </div>
          <Badge className={`absolute top-2 right-2 text-[10px] ${stockClass}`}>
            {product.stockStatus}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <Badge variant="secondary" className="text-[10px] w-fit mb-2">
            {product.category?.name}
          </Badge>
          <h3 className="font-semibold text-sm line-clamp-1 mb-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>

          {/* Meta info */}
          <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
            {product.duration && (
              <span className="flex items-center gap-1 bg-muted rounded px-2 py-0.5">
                <Timer className="h-3 w-3" /> {product.duration}
              </span>
            )}
            {product.accountType && (
              <span className="flex items-center gap-1 bg-muted rounded px-2 py-0.5">
                <Globe className="h-3 w-3" /> {product.accountType}
              </span>
            )}
          </div>

          {product.warranty && (
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              <Shield className="h-3 w-3" /> {product.warranty}
            </div>
          )}

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                {formatPriceBDT(product.basePriceBDT)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatPriceRMB(product.basePriceBDT)}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" /> {product.deliveryTime}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <a
              href={getWhatsAppOrderURL(product.name, product.basePriceBDT, whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
              onClick={e => e.stopPropagation()}
            >
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs h-9">
                <MessageCircle className="h-3.5 w-3.5 mr-1" /> Order Now
              </Button>
            </a>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-9"
              onClick={() => navigate('product', { productId: product.id })}
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

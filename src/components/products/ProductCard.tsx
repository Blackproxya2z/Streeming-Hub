'use client'

import Image from 'next/image'
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
  const hasImage = product.image && !product.image.startsWith('/images/categories/')

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col rounded-2xl border-0 shadow-sm">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image area */}
        <div className={`relative h-44 sm:h-48 shrink-0 ${hasImage ? '' : `bg-gradient-to-br ${gradient}`} flex items-center justify-center overflow-hidden`}>
          {hasImage ? (
            <Image
              src={product.image!}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <span className="text-4xl font-bold text-white/70">{initials}</span>
          )}
          {/* Gradient overlay for text readability */}
          {hasImage && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.isBestSeller && (
              <Badge className="bg-amber-500 text-white border-0 text-[10px] px-2 py-0.5 shadow-sm">
                <Star className="h-3 w-3 mr-0.5" /> Best Seller
              </Badge>
            )}
            {product.isNewArrival && (
              <Badge className="bg-emerald-500 text-white border-0 text-[10px] px-2 py-0.5 shadow-sm">
                <Zap className="h-3 w-3 mr-0.5" /> New
              </Badge>
            )}
          </div>
          <Badge className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 z-10 shadow-sm ${stockClass}`}>
            {product.stockStatus}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0">
          <Badge variant="secondary" className="text-[10px] w-fit mb-1.5">
            {product.category?.name}
          </Badge>
          <h3 className="font-semibold text-sm line-clamp-1 mb-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{product.description}</p>

          {/* Meta info */}
          <div className="flex flex-wrap gap-1.5 mb-2 text-[11px] text-muted-foreground">
            {product.duration && (
              <span className="flex items-center gap-1 bg-muted rounded-md px-1.5 py-0.5">
                <Timer className="h-3 w-3" /> {product.duration}
              </span>
            )}
            {product.accountType && (
              <span className="flex items-center gap-1 bg-muted rounded-md px-1.5 py-0.5">
                <Globe className="h-3 w-3" /> {product.accountType}
              </span>
            )}
          </div>

          {product.warranty && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mb-2">
              <Shield className="h-3 w-3" /> {product.warranty}
            </div>
          )}

          {/* Price */}
          <div className="mt-auto pt-2 border-t border-border/50">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                {formatPriceBDT(product.basePriceBDT)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatPriceRMB(product.basePriceBDT)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
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
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs h-8 sm:h-9 rounded-lg">
                <MessageCircle className="h-3.5 w-3.5 mr-1" /> Order
              </Button>
            </a>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8 sm:h-9 rounded-lg"
              onClick={() => navigate('product', { productId: product.id })}
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import Image from 'next/image'
import { useAppStore } from '@/lib/store'
import { formatPriceBDT, formatPriceRMB } from '@/lib/price'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Shield, Zap, Star } from 'lucide-react'
import type { Product } from '@/lib/hooks'

const categoryImages: Record<string, string> = {
  'streaming': '/images/categories/streaming.png',
  'ai-tools': '/images/categories/ai-tools.png',
  'educational': '/images/categories/educational.png',
  'design-creative': '/images/categories/design-creative.png',
  'productivity': '/images/categories/productivity.png',
  'cloud-storage': '/images/categories/cloud-storage.png',
  'vpn': '/images/categories/vpn.png',
  'gift-cards': '/images/categories/gift-cards.png',
  'gaming-topup': '/images/categories/gaming-topup.png',
  'multi-collection': '/images/categories/multi-collection.png',
  'adult': '/images/categories/adult.png',
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

  const initials = product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const gradient = getGradient(product.name)
  const hasImage = product.image && !product.image.startsWith('/images/categories/')
  const isExternalImage = hasImage && product.image!.startsWith('http')
  const categoryImage = product.category?.slug ? categoryImages[product.category.slug] : null
  const showCategoryImage = !hasImage && categoryImage

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden h-full flex flex-col rounded-xl border shadow-sm cursor-pointer"
      onClick={() => navigate('product', { productId: product.id })}
    >
      <CardContent className="p-0 flex flex-col h-full overflow-hidden">
        {/* Image */}
        <div className={`relative h-32 sm:h-40 shrink-0 ${hasImage || showCategoryImage ? '' : `bg-gradient-to-br ${gradient}`} flex items-center justify-center overflow-hidden`}>
          {hasImage ? (
            <Image
              src={product.image!}
              alt={product.name}
              fill
              unoptimized={isExternalImage}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : showCategoryImage ? (
            <Image src={categoryImage} alt={product.category?.name || ''} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
          ) : (
            <span className="text-3xl font-bold text-white/70">{initials}</span>
          )}
          {/* Badges */}
          {(product.isBestSeller || product.isNewArrival) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {product.isBestSeller && (
                <Badge className="bg-amber-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                  <Star className="h-2.5 w-2.5 mr-0.5" /> Best
                </Badge>
              )}
              {product.isNewArrival && (
                <Badge className="bg-emerald-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                  <Zap className="h-2.5 w-2.5 mr-0.5" /> New
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Content — Simple & Clean */}
        <div className="p-3 flex flex-col flex-1 min-h-0 gap-1">
          <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>

          {product.warranty && (
            <div className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
              <Shield className="h-3 w-3" /> {product.warranty}
            </div>
          )}

          {/* Price */}
          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                {formatPriceBDT(product.basePriceBDT)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatPriceRMB(product.basePriceBDT)}
              </span>
            </div>
            {product.duration && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{product.duration}</p>
            )}
          </div>

          {/* Single Order Button — goes to order form */}
          <div className="mt-2">
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700 text-xs h-8 rounded-lg font-medium"
              onClick={(e) => {
                e.stopPropagation()
                navigate('order', { productId: product.id, productName: product.name })
              }}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Order Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

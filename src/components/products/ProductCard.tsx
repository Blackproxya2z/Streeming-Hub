'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/lib/store'
import { formatPriceBDT } from '@/lib/price'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Shield, Zap, Star, Clock } from 'lucide-react'
import { OrderDialog } from '@/components/order/OrderDialog'
import type { Product } from '@/lib/hooks'

const gradients = [
  'from-blue-600 to-sky-600',
  'from-amber-400 to-orange-500',
  'from-purple-400 to-violet-500',
  'from-pink-400 to-rose-500',
  'from-blue-400 to-sky-500',
  'from-red-400 to-rose-500',
  'from-indigo-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-cyan-400 to-sky-500',
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

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { navigate } = useAppStore()
  const [orderOpen, setOrderOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>()

  const initials = product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const gradient = getGradient(product.name)
  const hasImage = !!product.image
  const isExternalImage = hasImage && product.image!.startsWith('http')
  const isCategoryImage = hasImage && product.image!.startsWith('/images/categories/')

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOrderOpen(true)
  }

  const handleCardClick = () => {
    navigate('product', { productId: product.id })
  }

  // Parse price options to show first one as the plan
  const priceOptions: { label: string; priceBDT: string }[] = (() => {
    try {
      return JSON.parse(product.priceOptions || '[]')
    } catch {
      return []
    }
  })()

  const isNumericPrice = !isNaN(parseFloat(product.basePriceBDT))

  return (
    <>
      <Card
        className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden h-full flex flex-col rounded-xl border shadow-sm cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-0 flex flex-col h-full overflow-hidden">
          {/* Image */}
          <div className={`relative h-28 sm:h-36 md:h-40 shrink-0 ${!hasImage || isCategoryImage ? `bg-gradient-to-br ${gradient}` : ''} flex items-center justify-center overflow-hidden`}>
            {hasImage ? (
              <>
                <Image
                  src={product.image!}
                  alt={product.name}
                  fill
                  unoptimized={isExternalImage}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 480px) 50vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {isCategoryImage && (
                  <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white drop-shadow-lg">{initials}</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-3xl font-bold text-white/70">{initials}</span>
            )}
            {/* Badges */}
            {(product.isBestSeller || product.isNewArrival) && (
              <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
                {product.isBestSeller && (
                  <Badge className="bg-amber-500 text-white border-0 text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0.5">
                    <Star className="h-2.5 w-2.5 mr-0.5" /> Best
                  </Badge>
                )}
                {product.isNewArrival && (
                  <Badge className="bg-blue-600 text-white border-0 text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0.5">
                    <Zap className="h-2.5 w-2.5 mr-0.5" /> New
                  </Badge>
                )}
              </div>
            )}
            {/* Delivery badge on image */}
            <Badge className="absolute bottom-1.5 right-1.5 bg-black/60 text-white border-0 text-[9px] sm:text-[10px] px-1.5 py-0.5 backdrop-blur-sm">
              <Clock className="h-2.5 w-2.5 mr-0.5" /> {product.deliveryTime}
            </Badge>
          </div>

          {/* Content — Responsive & Compact */}
          <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-h-0 gap-1">
            {/* Category badge */}
            <Badge variant="secondary" className="text-[10px] sm:text-[11px] w-fit px-1.5 py-0">
              {product.category?.name}
            </Badge>

            <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 leading-tight">{product.name}</h3>

            {product.warranty && (
              <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-blue-700 dark:text-blue-500 line-clamp-1">
                <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" /> {product.warranty}
              </div>
            )}

            {/* Duration */}
            {product.duration && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1">{product.duration}</p>
            )}

            {/* Price */}
            <div className="mt-auto pt-1.5 sm:pt-2">
              <div className="flex items-baseline gap-1">
                <span className={`font-bold text-sm sm:text-base ${isNumericPrice ? 'text-blue-700 dark:text-blue-500' : 'text-green-700 dark:text-green-500'}`}>
                  {isNumericPrice ? formatPriceBDT(product.basePriceBDT) : product.basePriceBDT}
                </span>
              </div>
            </div>

            {/* Order Now Button */}
            <div className="mt-1.5 sm:mt-2">
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-9 sm:h-10 rounded-lg font-medium min-h-[36px] sm:min-h-[40px]"
                onClick={handleOrderClick}
              >
                <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> Order Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Dialog */}
      <OrderDialog
        open={orderOpen}
        onOpenChange={setOrderOpen}
        product={product}
        selectedPlan={selectedPlan}
      />
    </>
  )
})

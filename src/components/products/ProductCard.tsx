'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/lib/store'
import { formatPriceBDT } from '@/lib/price'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Shield, Zap, Star } from 'lucide-react'
import { OrderDialog } from '@/components/order/OrderDialog'
import type { Product } from '@/lib/hooks'

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

  return (
    <>
      <Card
        className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden h-full flex flex-col rounded-xl border shadow-sm cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-0 flex flex-col h-full overflow-hidden">
          {/* Image */}
          <div className={`relative h-32 sm:h-40 shrink-0 ${!hasImage || isCategoryImage ? `bg-gradient-to-br ${gradient}` : ''} flex items-center justify-center overflow-hidden`}>
            {hasImage ? (
              <>
                <Image
                  src={product.image!}
                  alt={product.name}
                  fill
                  unoptimized={isExternalImage}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

            {/* Short description */}
            {product.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="mt-auto pt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                  {formatPriceBDT(product.basePriceBDT)}
                </span>
              </div>
              {product.duration && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{product.duration}</p>
              )}
            </div>

            {/* Order Now Button */}
            <div className="mt-2">
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-xs h-8 rounded-lg font-medium"
                onClick={handleOrderClick}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Order Now
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

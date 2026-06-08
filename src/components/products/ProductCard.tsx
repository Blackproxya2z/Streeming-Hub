'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/lib/store'
import { formatPriceBDT } from '@/lib/price'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Shield, Zap, Star, Clock, Eye } from 'lucide-react'
import { OrderDialog } from '@/components/order/OrderDialog'
import type { Product } from '@/lib/hooks'

const gradients = [
  'from-[#10b981] to-[#34d399]',
  'from-amber-400 to-orange-500',
  'from-purple-400 to-violet-500',
  'from-pink-400 to-rose-500',
  'from-[#0f172a] to-[#10b981]',
  'from-red-400 to-rose-500',
  'from-[#34d399] to-[#10b981]',
  'from-[#34d399] to-[#10b981]',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

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

interface ProductCardProps {
  product: Product
  /** Show both Order + Details buttons (featured layout). Default: true */
  showDetails?: boolean
  /** Variant: 'default' for catalog, 'compact' for related products */
  variant?: 'default' | 'compact'
}

export const ProductCard = memo(function ProductCard({ product, showDetails = true, variant = 'default' }: ProductCardProps) {
  const { navigate } = useAppStore()
  const [orderOpen, setOrderOpen] = useState(false)

  const initials = product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const gradient = getGradient(product.name)
  const hasImage = !!product.image
  const isExternalImage = hasImage && product.image!.startsWith('http')
  const isCategoryImage = hasImage && product.image!.startsWith('/images/categories/')
  const categoryImage = product.category?.slug ? categoryImages[product.category.slug] : null
  const isNumericPrice = !isNaN(parseFloat(product.basePriceBDT))

  const stockColor =
    product.stockStatus === 'Available' ? 'text-[#10b981] bg-emerald-50' :
    product.stockStatus === 'Limited Stock' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400' :
    'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOrderOpen(true)
  }

  const handleCardClick = () => {
    navigate('product', { productId: product.id })
  }

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate('product', { productId: product.id })
  }

  const isCompact = variant === 'compact'

  return (
    <>
      <Card
        className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col rounded-xl border shadow-sm cursor-pointer active:scale-[0.98] card-gradient-border product-card-glow"
        onClick={handleCardClick}
      >
        <CardContent className="p-0 flex flex-col h-full overflow-hidden">
          {/* Image Section */}
          <div className={`relative shrink-0 ${!hasImage || isCategoryImage ? `bg-gradient-to-br ${gradient}` : ''} flex items-center justify-center overflow-hidden ${
            isCompact ? 'h-28 sm:h-36 md:h-40' : 'h-36 sm:h-44 md:h-48'
          }`}>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                )}
                {/* Overlay gradient for text readability */}
                {!isCategoryImage && hasImage && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                )}
              </>
            ) : categoryImage ? (
              <>
                <Image src={categoryImage} alt={product.category?.name || ''} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 480px) 50vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              </>
            ) : (
              <span className="text-3xl sm:text-4xl font-bold text-white drop-shadow-sm">{initials}</span>
            )}

            {/* Badges */}
            {(product.isBestSeller || product.isNewArrival) && (
              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                {product.isBestSeller && (
                  <Badge className="bg-amber-500 text-white border-0 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 shadow-sm">
                    <Star className="h-3 w-3 mr-0.5" /> Best
                  </Badge>
                )}
                {product.isNewArrival && (
                  <Badge className="bg-sky-600 text-white border-0 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 shadow-sm">
                    <Zap className="h-3 w-3 mr-0.5" /> New
                  </Badge>
                )}
              </div>
            )}

            {/* Delivery badge */}
            <Badge className="absolute bottom-2 right-2 bg-black/60 text-white border-0 text-[11px] sm:text-xs px-2 py-0.5 backdrop-blur-sm z-10">
              <Clock className="h-3 w-3 mr-0.5" /> {product.deliveryTime || '5-20 min'}
            </Badge>
          </div>

          {/* Content Section */}
          <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0 gap-1.5 sm:gap-2">
            {/* Category badge */}
            <Badge variant="secondary" className="text-[11px] sm:text-xs w-fit px-2 py-0.5">
              {product.category?.name}
            </Badge>

            {/* Product Name */}
            <h3 className="font-semibold text-sm sm:text-base line-clamp-1 leading-tight">{product.name}</h3>

            {/* Description - visible on sm+ and in default variant */}
            {!isCompact && product.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">{product.description}</p>
            )}

            {/* Duration & Warranty row */}
            <div className="flex flex-wrap gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
              {product.duration && (
                <span className="flex items-center gap-1 bg-muted rounded-md px-1.5 sm:px-2 py-0.5">
                  <Clock className="h-3 w-3" /> {product.duration}
                </span>
              )}
              {product.warranty && (
                <span className="flex items-center gap-1 bg-muted rounded-md px-1.5 sm:px-2 py-0.5">
                  <Shield className="h-3 w-3 text-emerald-700" /> {product.warranty}
                </span>
              )}
            </div>

            {/* Price + Stock row */}
            <div className="mt-auto pt-1.5 sm:pt-2 border-t border-border/50">
              <div className="flex items-baseline justify-between gap-1.5">
                <span className={`font-bold text-base sm:text-lg ${isNumericPrice ? 'text-emerald-700' : 'text-green-700'}`}>
                  {isNumericPrice ? formatPriceBDT(product.basePriceBDT) : product.basePriceBDT}
                </span>
                {product.stockStatus && (
                  <Badge className={`text-[10px] sm:text-[11px] ${stockColor}`}>
                    {product.stockStatus}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex gap-2 mt-1.5 sm:mt-2 ${showDetails ? '' : ''}`}>
              <Button
                size="sm"
                className={`bg-green-600 hover:bg-green-700 text-xs sm:text-sm rounded-lg font-medium min-h-[40px] ${
                  showDetails ? 'flex-1' : 'w-full'
                }`}
                onClick={handleOrderClick}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1" /> Order
              </Button>
              {showDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm rounded-lg font-medium min-h-[40px]"
                  onClick={handleDetailsClick}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> Details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Dialog */}
      <OrderDialog
        open={orderOpen}
        onOpenChange={setOrderOpen}
        product={product}
      />
    </>
  )
})

'use client'

import Image from 'next/image'
import { useProducts, useSettings } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { formatPriceBDT, formatPriceRMB, getWhatsAppOrderURL } from '@/lib/price'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Eye, Star, Clock, Shield, Zap, Timer, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

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
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function ProductCardMini({ product, index }: { product: any; index: number }) {
  const { navigate } = useAppStore()
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'

  const initials = product.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const gradient = getGradient(product.name)
  const stockColor =
    product.stockStatus === 'Available' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' :
    product.stockStatus === 'Limited Stock' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400' :
    'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
  const hasImage = product.image && !product.image.startsWith('/images/categories/')
  const isExternalImage = hasImage && product.image.startsWith('http')
  const categoryImage = product.category?.slug ? categoryImages[product.category.slug] : null
  const showCategoryImage = !hasImage && categoryImage

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="card-shine group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0 flex flex-col h-full overflow-hidden">
          {/* Image */}
          <div className={`relative h-36 sm:h-44 shrink-0 ${hasImage || showCategoryImage ? '' : `bg-gradient-to-br ${gradient}`} flex items-center justify-center overflow-hidden`}>
            {hasImage ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                unoptimized={isExternalImage}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : showCategoryImage ? (
              <>
                <Image src={categoryImage} alt={product.category?.name || ''} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                <span className="absolute bottom-2 left-3 text-white font-bold text-sm drop-shadow-lg">{product.name}</span>
              </>
            ) : (
              <span className="text-4xl font-bold text-white/80">{initials}</span>
            )}
            {hasImage && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            )}
            {product.isBestSeller && (
              <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 text-[10px] z-10 shadow-sm">
                <Star className="h-3 w-3 mr-0.5" /> Best Seller
              </Badge>
            )}
            {product.isNewArrival && (
              <Badge className="absolute top-2 right-2 bg-emerald-500 text-white border-0 text-[10px] z-10 shadow-sm">
                <Zap className="h-3 w-3 mr-0.5" /> New
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0 gap-1.5">
            <Badge variant="secondary" className="text-[10px] w-fit">
              {product.category?.name}
            </Badge>
            <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>

            <div className="flex flex-wrap gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
              {product.duration && (
                <span className="flex items-center gap-0.5 bg-muted rounded-md px-1.5 py-0.5">
                  <Timer className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {product.duration}
                </span>
              )}
              {product.warranty && (
                <span className="flex items-center gap-0.5 bg-muted rounded-md px-1.5 py-0.5">
                  <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {product.warranty}
                </span>
              )}
            </div>

            <div className="mt-auto pt-1.5 sm:pt-2 border-t border-border/50">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                  {formatPriceBDT(product.basePriceBDT)}
                </span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                  {formatPriceRMB(product.basePriceBDT)}
                </span>
              </div>
              <Badge className={`text-[10px] mt-1 mr-1 ${stockColor}`}>
                {product.stockStatus}
              </Badge>
            </div>

            <div className="flex gap-1.5 sm:gap-2 mt-2">
              <a
                href={getWhatsAppOrderURL(product.name, product.basePriceBDT, whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-[11px] sm:text-xs h-7 sm:h-8 rounded-lg">
                  <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5" /> Order
                </Button>
              </a>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-[11px] sm:text-xs h-7 sm:h-8 rounded-lg"
                onClick={() => navigate('product', { productId: product.id })}
              >
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5" /> Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function FeaturedProducts() {
  const { data, isLoading } = useProducts({ isFeatured: 'true' })

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 items-start">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse" style={{ height: '320px' }} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  const products = data?.products || []
  if (products.length === 0) return null

  return (
    <section className="py-12 sm:py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Featured Products</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Our most popular and recommended subscriptions at unbeatable prices
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 items-start">
          {products.slice(0, 8).map((product, index) => (
            <ProductCardMini key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

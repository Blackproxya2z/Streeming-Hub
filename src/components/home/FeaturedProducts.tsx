'use client'

import { useProducts, useSettings } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { formatPriceBDT, formatPriceRMB, getWhatsAppOrderURL } from '@/lib/price'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Eye, Star, Clock, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

function ProductCardMini({ product, index }: { product: any; index: number }) {
  const { navigate } = useAppStore()
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'

  const initials = product.name.charAt(0).toUpperCase()
  const stockColor =
    product.stockStatus === 'Available' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' :
    product.stockStatus === 'Limited Stock' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400' :
    'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image placeholder */}
          <div className="relative h-36 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <span className="text-5xl font-bold text-white/80">{initials}</span>
            {product.isBestSeller && (
              <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 text-[10px]">
                <Star className="h-3 w-3 mr-0.5" /> Best Seller
              </Badge>
            )}
            {product.isNewArrival && (
              <Badge className="absolute top-2 right-2 bg-emerald-500 text-white border-0 text-[10px]">
                <Zap className="h-3 w-3 mr-0.5" /> New
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-1">
            <Badge variant="secondary" className="text-[10px] w-fit mb-2">
              {product.category?.name}
            </Badge>
            <h3 className="font-semibold text-sm line-clamp-1 mb-1">{product.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>

            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              {product.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {product.duration}
                </span>
              )}
              {product.warranty && (
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" /> {product.warranty}
                </span>
              )}
            </div>

            <div className="mt-auto">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                  {formatPriceBDT(product.basePriceBDT)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatPriceRMB(product.basePriceBDT)}
              </span>
              <Badge className={`text-[10px] mt-2 mr-1 ${stockColor}`}>
                {product.stockStatus}
              </Badge>
            </div>

            <div className="flex gap-2 mt-3">
              <a
                href={getWhatsAppOrderURL(product.name, product.basePriceBDT, whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs h-8">
                  <MessageCircle className="h-3 w-3 mr-1" /> Order
                </Button>
              </a>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={() => navigate('product', { productId: product.id })}
              >
                <Eye className="h-3 w-3 mr-1" /> Details
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
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  const products = data?.products || []
  if (products.length === 0) return null

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Featured Products</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our most popular and recommended subscriptions at unbeatable prices
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map((product, index) => (
            <ProductCardMini key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

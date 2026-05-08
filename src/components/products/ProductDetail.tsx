'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useProduct, useProducts, useSettings } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { formatPriceBDT } from '@/lib/price'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MessageCircle,
  Clock,
  Shield,
  Globe,
  Timer,
  CheckCircle,
  Star,
  Zap,
  ArrowLeft,
} from 'lucide-react'
import { ProductCard } from './ProductCard'
import { OrderDialog } from '@/components/order/OrderDialog'
import { SEOHead } from '@/components/shared/SEOHead'

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

export function ProductDetail() {
  const { pageParams, navigate } = useAppStore()
  const { data: product, isLoading } = useProduct(pageParams.productId)
  const [orderOpen, setOrderOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>()

  const { data: relatedData } = useProducts(
    product?.categoryId ? { categorySlug: product.category?.slug } : {}
  )
  const relatedProducts = (relatedData?.products || [])
    .filter(p => p.id !== product?.id)
    .slice(0, 4)

  if (isLoading) {
    return (
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="h-8 w-28 bg-muted rounded-lg mb-6 animate-pulse" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-56 bg-muted rounded-2xl animate-pulse" />
            <div className="space-y-3">
              <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-full animate-pulse" />
              <div className="h-10 bg-muted rounded-xl w-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="py-16 px-4 text-center">
        <h2 className="text-xl font-semibold mb-4">Product not found</h2>
        <Button onClick={() => navigate('products')}>Back to Products</Button>
      </section>
    )
  }

  const initials = product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const gradient = getGradient(product.name)
  const features: string[] = product.features ? JSON.parse(product.features) : []
  const priceOptions: { label: string; priceBDT: string }[] =
    product.priceOptions ? JSON.parse(product.priceOptions) : []
  const hasImage = !!product.image
  const isExternalImage = hasImage && product.image!.startsWith('http')
  const isCategoryImage = hasImage && product.image!.startsWith('/images/categories/')

  const handlePlanClick = (opt: { label: string; priceBDT: string }) => {
    setSelectedPlan(opt.label)
    setOrderOpen(true)
  }

  const handleOrderNow = () => {
    setSelectedPlan(undefined)
    setOrderOpen(true)
  }

  // Product SEO structured data
  const productSchema = product ? {
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} subscription at best price in Bangladesh`,
    image: product.image || undefined,
    brand: {
      "@type": "Brand",
      name: product.category?.name || "Streaming Hub",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: product.basePriceBDT?.replace(/[^\d.]/g, '') || "0",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Streaming Hub",
      },
      url: `https://streaminghub.com.bd/?page=product&id=${product.id}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "50",
      bestRating: "5",
      worstRating: "1",
    },
  } : undefined

  return (
    <section className="py-4 sm:py-6 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Product SEO */}
        {product && (
          <SEOHead
            title={`${product.name} — ${formatPriceBDT(product.basePriceBDT)} | ${product.category?.name}`}
            description={`Buy ${product.name} at ${formatPriceBDT(product.basePriceBDT)} in Bangladesh. ${product.warranty ? `Warranty: ${product.warranty}.` : ''} ${product.deliveryTime ? `Delivery: ${product.deliveryTime}.` : ''} bKash/Nagad payment, fast delivery.`}
            keywords={[product.name, `${product.name} Bangladesh`, `${product.name} price BD`, `${product.category?.name} subscription`, 'buy subscription Bangladesh']}
            ogType="product"
            ogImage={product.image || undefined}
            productSchema={productSchema}
          />
        )}
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('products')}
          className="mb-4 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Main Content */}
        <div className="grid md:grid-cols-5 gap-6">
          {/* Image — 2 cols */}
          <div className="md:col-span-2">
            <div className={`relative rounded-2xl overflow-hidden h-52 sm:h-64 md:h-80 ${!hasImage || isCategoryImage ? `bg-gradient-to-br ${gradient}` : ''} flex items-center justify-center sticky top-24`}>
              {hasImage ? (
                <>
                  <Image
                    src={product.image!}
                    alt={product.name}
                    fill
                    unoptimized={isExternalImage}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                    priority
                  />
                  {isCategoryImage && (
                    <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/30 flex items-center justify-center">
                      <span className="text-5xl font-bold text-white drop-shadow-lg">{initials}</span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-6xl font-bold text-white/60">{initials}</span>
              )}
            </div>
          </div>

          {/* Details — 3 cols */}
          <div className="md:col-span-3 space-y-4">
            {/* Title + Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">{product.category?.name}</Badge>
                {product.isBestSeller && (
                  <Badge className="bg-amber-500 text-white border-0 text-xs">
                    <Star className="h-3 w-3 mr-0.5" /> Best Seller
                  </Badge>
                )}
                {product.isNewArrival && (
                  <Badge className="bg-emerald-500 text-white border-0 text-xs">
                    <Zap className="h-3 w-3 mr-0.5" /> New
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{product.description}</p>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-2">
              {product.duration && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
                  <Timer className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{product.duration}</p>
                  </div>
                </div>
              )}
              {product.accountType && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
                  <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Account Type</p>
                    <p className="text-sm font-medium">{product.accountType}</p>
                  </div>
                </div>
              )}
              {product.warranty && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
                  <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Warranty</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{product.warranty}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Delivery</p>
                  <p className="text-sm font-medium">{product.deliveryTime}</p>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Starting from</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPriceBDT(product.basePriceBDT)}
                </span>
              </div>
            </div>

            {/* Price Options */}
            {priceOptions.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Choose Your Plan</h3>
                <div className="grid gap-2">
                  {priceOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePlanClick(opt)}
                      className="flex items-center justify-between bg-background border rounded-xl px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium">{opt.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPriceBDT(opt.priceBDT)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order Button — Prominent */}
            <Button
              size="lg"
              onClick={handleOrderNow}
              className="w-full bg-green-600 hover:bg-green-700 font-semibold rounded-xl h-12 text-base shadow-lg shadow-green-600/20"
            >
              <MessageCircle className="h-5 w-5 mr-2" /> Order Now
            </Button>

            {/* Features — compact */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {features.map((feature, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted/70 rounded-full px-2.5 py-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How to Order — Simple 3 Steps */}
        <div className="mt-8 bg-muted/40 rounded-2xl p-5">
          <h2 className="font-bold text-base mb-4">How to Order</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 font-bold text-sm">1</div>
              <div>
                <p className="text-sm font-medium">Pay</p>
                <p className="text-[11px] text-muted-foreground">bKash / Nagad</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 font-bold text-sm">2</div>
              <div>
                <p className="text-sm font-medium">Message</p>
                <p className="text-[11px] text-muted-foreground">WhatsApp us</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
              <div>
                <p className="text-sm font-medium">Receive</p>
                <p className="text-[11px] text-muted-foreground">5-20 min delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="font-bold text-base mb-4">You may also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-start">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Dialog */}
      <OrderDialog
        open={orderOpen}
        onOpenChange={setOrderOpen}
        product={product}
        selectedPlan={selectedPlan}
      />
    </section>
  )
}

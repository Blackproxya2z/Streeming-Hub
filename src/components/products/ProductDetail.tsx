'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useProduct, useProducts } from '@/lib/hooks'
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
  Lock,
  Share2,
} from 'lucide-react'
import { ProductCard } from './ProductCard'
import { OrderDialog } from '@/components/order/OrderDialog'
import { SEOHead } from '@/components/shared/SEOHead'

const gradients = [
  'from-blue-600 to-sky-600',
  'from-amber-400 to-orange-500',
  'from-purple-400 to-violet-500',
  'from-pink-400 to-rose-500',
  'from-blue-400 to-sky-500',
  'from-red-400 to-rose-500',
  'from-emerald-400 to-teal-500',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

export function ProductDetail() {
  const { pageParams, navigate, ageVerified, setAgeGateOpen } = useAppStore()
  const { data: product, isLoading } = useProduct(pageParams.productId)
  const relatedParams: Record<string, string> = {}
  if (product?.category?.slug) relatedParams.categorySlug = product.category.slug
  if (product?.category?.isAdult) relatedParams.isAdult = 'true'
  const { data: relatedData } = useProducts(
    Object.keys(relatedParams).length > 0 ? relatedParams : undefined
  )
  const [orderOpen, setOrderOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>()

  // Age gate guard: if viewing an adult product without verification, trigger age gate
  const isAdultProduct = product?.category?.isAdult === true
  const needsAgeGate = isAdultProduct && !ageVerified && !isLoading

  useEffect(() => {
    if (needsAgeGate) {
      setAgeGateOpen(true)
    }
  }, [needsAgeGate, setAgeGateOpen])

  // If adult product and not verified, show a locked placeholder until age gate completes
  if (needsAgeGate) {
    return (
      <section className="py-12 sm:py-16 px-4 text-center">
        <div className="mx-auto mb-4 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
          <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-orange-500" />
        </div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">🔒 Age Verification Required</h1>
        <p className="text-muted-foreground text-sm mb-4">এই প্রোডাক্ট দেখতে বয়স ভেরিফিকেশন প্রয়োজন।</p>
        <p className="text-muted-foreground text-xs mb-4">Please complete the age verification to view this product.</p>
        <div className="flex items-center justify-center gap-3">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white h-11 sm:h-auto"
            onClick={() => {
              setAgeGateOpen(true)
            }}
          >
            ভেরিফাই করুন
          </Button>
          <Button variant="outline" className="h-11 sm:h-auto" onClick={() => navigate('home')}>ফিরে যান</Button>
        </div>
      </section>
    )
  }

  const relatedProducts = (relatedData?.products || [])
    .filter(p => p.id !== product?.id)
    .slice(0, 4)

  if (isLoading) {
    return (
      <section className="py-4 sm:py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="h-8 w-24 sm:w-28 bg-muted rounded-lg mb-6 animate-pulse" />
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="h-44 sm:h-56 bg-muted rounded-2xl animate-pulse" />
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
      <section className="py-12 sm:py-16 px-4 text-center">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">Product not found</h1>
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
    <section className="py-3 sm:py-6 px-3 sm:px-4">
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
          className="mb-3 sm:mb-4 -ml-2 text-muted-foreground h-9"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6">
          {/* Image — 2 cols */}
          <div className="md:col-span-2">
            <div className={`relative rounded-2xl overflow-hidden h-48 sm:h-56 md:h-72 lg:h-80 ${!hasImage || isCategoryImage ? `bg-gradient-to-br ${gradient}` : ''} flex items-center justify-center md:sticky md:top-20`}>
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
                      <span className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">{initials}</span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-5xl sm:text-6xl font-bold text-white/60">{initials}</span>
              )}
            </div>
          </div>

          {/* Details — 3 cols */}
          <div className="md:col-span-3 space-y-3 sm:space-y-4">
            {/* Title + Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Badge variant="secondary" className="text-[11px] sm:text-xs">{product.category?.name}</Badge>
                {product.isBestSeller && (
                  <Badge className="bg-amber-500 text-white border-0 text-[11px] sm:text-xs">
                    <Star className="h-3 w-3 mr-0.5" /> Best Seller
                  </Badge>
                )}
                {product.isNewArrival && (
                  <Badge className="bg-blue-600 text-white border-0 text-[11px] sm:text-xs">
                    <Zap className="h-3 w-3 mr-0.5" /> New
                  </Badge>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{product.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{product.description}</p>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {product.duration && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-2.5 sm:px-3 py-2">
                  <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground">Duration</p>
                    <p className="text-xs sm:text-sm font-medium truncate">{product.duration}</p>
                  </div>
                </div>
              )}
              {product.accountType && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-2.5 sm:px-3 py-2">
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground">Account Type</p>
                    <p className="text-xs sm:text-sm font-medium truncate">{product.accountType}</p>
                  </div>
                </div>
              )}
              {product.warranty && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-2.5 sm:px-3 py-2">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground">Warranty</p>
                    <p className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-500 truncate">{product.warranty}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-2.5 sm:px-3 py-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Delivery</p>
                  <p className="text-xs sm:text-sm font-medium">{product.deliveryTime}</p>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 sm:p-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground mb-1">Starting from</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-500">
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
                      className="flex items-center justify-between bg-background border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                          {i + 1}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{opt.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-blue-700 dark:text-blue-500">
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
              className="w-full bg-green-600 hover:bg-green-700 font-semibold rounded-xl h-11 sm:h-12 text-sm sm:text-base shadow-lg shadow-green-600/20 min-h-[44px]"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Order Now
            </Button>

            {/* Features — compact */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {features.map((feature, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] sm:text-xs bg-muted/70 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1">
                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How to Order — Simple 3 Steps */}
        <div className="mt-6 sm:mt-8 bg-muted/40 rounded-2xl p-4 sm:p-5">
          <h2 className="font-bold text-sm sm:text-base mb-3 sm:mb-4">অর্ডার করার নিয়ম / How to Order</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 font-bold text-xs sm:text-sm">1</div>
              <div>
                <p className="text-xs sm:text-sm font-medium">Send Money</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">bKash / Nagad দিয়ে</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 font-bold text-xs sm:text-sm">2</div>
              <div>
                <p className="text-xs sm:text-sm font-medium">WhatsApp মেসেজ</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">অর্ডার কনফার্ম করুন</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 font-bold text-xs sm:text-sm">3</div>
              <div>
                <p className="text-xs sm:text-sm font-medium">ডেলিভারি নিন</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">৫-২০ মিনিটে</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h2 className="font-bold text-sm sm:text-base mb-3 sm:mb-4">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 items-start">
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

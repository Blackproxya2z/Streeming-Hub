'use client'

import Image from 'next/image'
import { useProduct, useProducts, useSettings } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { formatPriceBDT, formatPriceRMB, getWhatsAppOrderURL } from '@/lib/price'
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
  CreditCard,
  Phone,
  Truck,
} from 'lucide-react'
import { ProductCard } from './ProductCard'

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

export function ProductDetail() {
  const { pageParams, navigate } = useAppStore()
  const { data: product, isLoading } = useProduct(pageParams.productId)
  const { data: settings } = useSettings()
  const whatsappNumber = settings?.whatsappNumber || '+8801647236359'

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
  const priceOptions: { label: string; priceBDT: string; priceRMB?: string }[] =
    product.priceOptions ? JSON.parse(product.priceOptions) : []
  const hasImage = !!product.image
  const isExternalImage = hasImage && product.image!.startsWith('http')
  const categoryImage = product.category?.slug ? categoryImages[product.category.slug] : null
  const showCategoryImage = !hasImage && categoryImage

  return (
    <section className="py-4 sm:py-6 px-4">
      <div className="container mx-auto max-w-4xl">
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
            <div className={`relative rounded-2xl overflow-hidden h-52 sm:h-64 md:h-80 ${hasImage || showCategoryImage ? '' : `bg-gradient-to-br ${gradient}`} flex items-center justify-center sticky top-20`}>
              {hasImage ? (
                <Image
                  src={product.image!}
                  alt={product.name}
                  fill
                  unoptimized={isExternalImage}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
              ) : showCategoryImage ? (
                <Image src={categoryImage!} alt={product.category?.name || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" priority />
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
                    <p className="text-[10px] text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{product.duration}</p>
                  </div>
                </div>
              )}
              {product.accountType && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
                  <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Account Type</p>
                    <p className="text-sm font-medium">{product.accountType}</p>
                  </div>
                </div>
              )}
              {product.warranty && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
                  <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Warranty</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{product.warranty}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Delivery</p>
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
                <span className="text-sm text-muted-foreground">
                  {formatPriceRMB(product.basePriceBDT)}
                </span>
              </div>
            </div>

            {/* Price Options */}
            {priceOptions.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Choose Your Plan</h3>
                <div className="grid gap-2">
                  {priceOptions.map((opt, i) => (
                    <a
                      key={i}
                      href={getWhatsAppOrderURL(`${product.name} (${opt.label})`, opt.priceBDT, whatsappNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-background border rounded-xl px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors group"
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
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          {formatPriceRMB(opt.priceBDT)}
                        </span>
                        <MessageCircle className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Order Button — Prominent */}
            <a
              href={getWhatsAppOrderURL(product.name, product.basePriceBDT, whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 font-semibold rounded-xl h-12 text-base shadow-lg shadow-green-600/20">
                <MessageCircle className="h-5 w-5 mr-2" /> Order on WhatsApp
              </Button>
            </a>

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
          <div className="grid grid-cols-3 gap-4">
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
    </section>
  )
}

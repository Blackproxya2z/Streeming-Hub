'use client'

import Image from 'next/image'
import { useProduct, useProducts, useSettings } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { formatPriceBDT, formatPriceRMB, getWhatsAppOrderURL, isNumericPrice } from '@/lib/price'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
  ShoppingCart,
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
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="h-8 w-24 bg-muted rounded mb-6 animate-pulse" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-64 bg-muted rounded-xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
              <div className="h-10 bg-muted rounded w-1/3 animate-pulse" />
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
  const stockClass = stockColors[product.stockStatus] || stockColors['Available']
  const features: string[] = product.features ? JSON.parse(product.features) : []
  const priceOptions: { label: string; priceBDT: string; priceRMB?: string }[] =
    product.priceOptions ? JSON.parse(product.priceOptions) : []
  const hasImage = !!product.image
  const isExternalImage = hasImage && product.image!.startsWith('http')
  const categoryImage = product.category?.slug ? categoryImages[product.category.slug] : null
  const showCategoryImage = !hasImage && categoryImage

  return (
    <section className="py-6 sm:py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('products')}
          className="mb-4 sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Image */}
          <div className={`relative rounded-2xl overflow-hidden h-64 sm:h-80 md:h-96 ${hasImage || showCategoryImage ? '' : `bg-gradient-to-br ${gradient}`} flex items-center justify-center`}>
            {hasImage ? (
              <Image
                src={product.image!}
                alt={product.name}
                fill
                unoptimized={isExternalImage}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : showCategoryImage ? (
              <>
                <Image src={categoryImage} alt={product.category?.name || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                <span className="absolute bottom-4 left-4 text-white font-bold text-xl drop-shadow-lg">{product.name}</span>
              </>
            ) : (
              <span className="text-7xl font-bold text-white/60">{initials}</span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{product.category?.name}</Badge>
              {product.isBestSeller && (
                <Badge className="bg-amber-500 text-white border-0">
                  <Star className="h-3 w-3 mr-0.5" /> Best Seller
                </Badge>
              )}
              {product.isNewArrival && (
                <Badge className="bg-emerald-500 text-white border-0">
                  <Zap className="h-3 w-3 mr-0.5" /> New
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

            <Badge className={stockClass}>{product.stockStatus}</Badge>

            {/* Price */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPriceBDT(product.basePriceBDT)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPriceRMB(product.basePriceBDT)}
                </span>
              </div>
            </div>

            {/* Price Options */}
            {priceOptions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Price Options</h3>
                <div className="grid gap-2">
                  {priceOptions.map((opt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">{opt.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatPriceBDT(opt.priceBDT)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatPriceRMB(opt.priceBDT)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
              {product.duration && (
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Duration: <strong>{product.duration}</strong></span>
                </div>
              )}
              {product.accountType && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Type: <strong>{product.accountType}</strong></span>
                </div>
              )}
              {product.region && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Region: <strong>{product.region}</strong></span>
                </div>
              )}
              {product.warranty && (
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Warranty: <strong>{product.warranty}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Delivery: <strong>{product.deliveryTime}</strong></span>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={getWhatsAppOrderURL(product.name, product.basePriceBDT, whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 font-semibold rounded-xl">
                  <MessageCircle className="h-5 w-5 mr-2" /> Order on WhatsApp
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 font-semibold rounded-xl"
                onClick={() => navigate('order', { productId: product.id, productName: product.name })}
              >
                <ShoppingCart className="h-5 w-5 mr-2" /> Order Form
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="mt-8 sm:mt-10">
            <h2 className="text-xl font-bold mb-4">Features</h2>
            <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Order */}
        <div className="mt-8 sm:mt-10">
          <h2 className="text-xl font-bold mb-4">How to Order</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center space-y-1.5 sm:space-y-2">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto">
                    <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm">1. Make Payment</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Pay via bKash/Nagad</p>
                </div>
                <div className="text-center space-y-1.5 sm:space-y-2">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm">2. Send Details</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">WhatsApp with ID</p>
                </div>
                <div className="text-center space-y-1.5 sm:space-y-2">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto">
                    <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm">3. Get Delivered</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">5-20 min delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-8 sm:mt-10">
          <h2 className="text-xl font-bold mb-4">FAQ</h2>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="faq-1" className="bg-background border rounded-xl px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                How do I get my subscription after payment?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                After confirming your payment, we will send your account details via WhatsApp within 5-20 minutes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2" className="bg-background border rounded-xl px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Is there a warranty?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes! All our subscriptions come with warranty. If any issue occurs during the warranty period, we will fix or replace your account for free.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3" className="bg-background border rounded-xl px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Can I use my own email?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes, for products with &quot;Own Mail&quot; option, you can use your personal email address for full control.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 sm:mt-10">
            <h2 className="text-xl font-bold mb-4">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-start">
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

'use client'

import Image from 'next/image'
import { useAppStore } from '@/lib/store'
import { useCategories } from '@/lib/hooks'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tv, Brain, GraduationCap, Palette, Briefcase, Cloud,
  Shield, Gift, Gamepad2, Layers, AlertTriangle, ShoppingBag, Lock
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { Category } from '@/lib/hooks'

const categoryIconMap: Record<string, React.ElementType> = {
  'streaming': Tv,
  'ai-tools': Brain,
  'educational': GraduationCap,
  'design-creative': Palette,
  'productivity': Briefcase,
  'cloud-storage': Cloud,
  'vpn': Shield,
  'gift-cards': Gift,
  'gaming-topup': Gamepad2,
  'multi-collection': Layers,
  'adult': AlertTriangle,
}

const categoryGradients: Record<string, string> = {
  'streaming': 'from-red-500 to-rose-600',
  'ai-tools': 'from-purple-500 to-violet-600',
  'educational': 'from-blue-500 to-sky-600',
  'design-creative': 'from-pink-500 to-fuchsia-600',
  'productivity': 'from-amber-500 to-orange-600',
  'cloud-storage': 'from-sky-500 to-blue-600',
  'vpn': 'from-teal-500 to-emerald-600',
  'gift-cards': 'from-amber-400 to-yellow-500',
  'gaming-topup': 'from-violet-500 to-purple-600',
  'multi-collection': 'from-slate-500 to-gray-600',
  'adult': 'from-orange-500 to-red-600',
}

// Map category slugs to their image paths
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

function getCategoryIcon(category: Category) {
  if (category.icon && categoryIconMap[category.icon]) {
    return categoryIconMap[category.icon]
  }
  if (category.slug && categoryIconMap[category.slug]) {
    return categoryIconMap[category.slug]
  }
  if (category.isAdult) return AlertTriangle
  return ShoppingBag
}

function getCategoryGradient(category: Category) {
  if (category.slug && categoryGradients[category.slug]) {
    return categoryGradients[category.slug]
  }
  if (category.icon && categoryGradients[category.icon]) {
    return categoryGradients[category.icon]
  }
  return 'from-teal-600 to-emerald-700'
}

export function CategoryCards() {
  const { navigate, setAgeGateOpen, ageVerified } = useAppStore()
  const { data: categories, isLoading } = useCategories()

  const handleClick = (cat: Category) => {
    navigate('category', { categorySlug: cat.slug })
    // If adult and not verified, open age gate dialog after navigating
    if (cat.isAdult && !ageVerified) {
      setAgeGateOpen(true)
    }
  }

  if (isLoading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-32 sm:h-36 md:h-40 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4" id="categories" aria-labelledby="categories-heading">
      <div className="container mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <h2 id="categories-heading" className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Browse by Category</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Find the perfect subscription for your needs from our wide range of categories
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {(categories || []).map((cat, index) => {
            const Icon = getCategoryIcon(cat)
            const gradient = getCategoryGradient(cat)
            const imagePath = categoryImages[cat.slug]
            const hasImage = !!imagePath

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden rounded-2xl shadow-sm"
                  onClick={() => handleClick(cat)}
                >
                  <CardContent className="p-0 relative">
                    {/* Background image */}
                    <div className="relative h-28 sm:h-32 md:h-36 lg:h-40 overflow-hidden">
                      {hasImage ? (
                        <>
                          <Image
                            src={imagePath}
                            alt={cat.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 480px) 50vw, (max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                        </>
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 sm:p-3">
                        <div className={`h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2 flex items-center gap-1 text-center drop-shadow-md line-clamp-1">
                          {cat.name}
                          {cat.isAdult && <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-300" />}
                        </h3>
                        {cat._count && (
                          <p className="text-[10px] sm:text-[11px] md:text-xs text-white/80 mt-0.5">
                            {cat._count.products} products
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

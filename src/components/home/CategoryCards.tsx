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
  'adult-18': AlertTriangle,
}

const categoryGradients: Record<string, string> = {
  'streaming': 'from-red-500 to-rose-600',
  'ai-tools': 'from-purple-500 to-violet-600',
  'educational': 'from-blue-500 to-cyan-600',
  'design-creative': 'from-pink-500 to-fuchsia-600',
  'productivity': 'from-amber-500 to-orange-600',
  'cloud-storage': 'from-sky-500 to-blue-600',
  'vpn': 'from-emerald-500 to-teal-600',
  'gift-cards': 'from-amber-400 to-yellow-500',
  'gaming-topup': 'from-indigo-500 to-purple-600',
  'multi-collection': 'from-slate-500 to-gray-600',
  'adult-18': 'from-orange-500 to-red-600',
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
  return 'from-emerald-500 to-teal-600'
}

export function CategoryCards() {
  const { navigate, setAgeGateOpen, ageVerified } = useAppStore()
  const { data: categories, isLoading } = useCategories()

  const handleClick = (cat: Category) => {
    if (cat.isAdult && !ageVerified) {
      setAgeGateOpen(true)
      return
    }
    navigate('category', { categorySlug: cat.slug })
  }

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Browse by Category</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Find the perfect subscription for your needs from our wide range of categories
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
                    <div className="relative h-28 sm:h-32 overflow-hidden">
                      {hasImage ? (
                        <>
                          <Image
                            src={imagePath}
                            alt={cat.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                        </>
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-xs sm:text-sm mt-2 flex items-center gap-1 text-center drop-shadow-md">
                          {cat.name}
                          {cat.isAdult && <Lock className="h-3 w-3 text-amber-300" />}
                        </h3>
                        {cat._count && (
                          <p className="text-[10px] text-white/80 mt-0.5">
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

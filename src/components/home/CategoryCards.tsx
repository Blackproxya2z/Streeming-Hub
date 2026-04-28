'use client'

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
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Browse by Category</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find the perfect subscription for your needs from our wide range of categories
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(categories || []).map((cat, index) => {
            const Icon = getCategoryIcon(cat)
            const gradient = getCategoryGradient(cat)
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden"
                  onClick={() => handleClick(cat)}
                >
                  <CardContent className="p-4 text-center space-y-3">
                    <div className={`mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm flex items-center justify-center gap-1">
                        {cat.name}
                        {cat.isAdult && <Lock className="h-3 w-3 text-orange-500" />}
                      </h3>
                      {cat._count && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {cat._count.products} products
                        </p>
                      )}
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

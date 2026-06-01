'use client'

import { useProducts } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { ProductCard } from '@/components/products/ProductCard'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export function FeaturedProducts() {
  const { ageVerified } = useAppStore()
  const { data, isLoading, isError, refetch } = useProducts(ageVerified ? { isFeatured: 'true' } : { isFeatured: 'true', isAdult: 'false' })

  if (isLoading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Featured Products</h2>
            <p className="text-muted-foreground text-sm">Loading products...</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 items-start">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse h-64 sm:h-80 md:h-96" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Featured Products</h2>
          <p className="text-muted-foreground text-sm mb-4">Products are loading, please wait...</p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <Clock className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </section>
    )
  }

  const products = data?.products || []
  if (products.length === 0) return null

  return (
    <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 bg-muted/30" id="featured" aria-labelledby="featured-heading">
      <div className="container mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <h2 id="featured-heading" className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Featured Products</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Our most popular and recommended subscriptions at unbeatable prices
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 items-start">
          {products.slice(0, 12).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <ProductCard product={product} showDetails={true} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

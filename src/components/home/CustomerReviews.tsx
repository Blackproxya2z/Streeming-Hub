'use client'

import { useReviews } from '@/lib/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Quote } from 'lucide-react'
import { motion } from 'framer-motion'

export function CustomerReviews() {
  const { data: reviews, isLoading } = useReviews()

  if (isLoading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 sm:h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  const allReviews = reviews || []

  return (
    <section className="py-8 sm:py-12 md:py-16 px-3 sm:px-4">
      <div className="container mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Customer Reviews</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            See what our customers say about our service
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {allReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200 dark:text-blue-900 mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-4">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-1 mb-2 sm:mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          i < review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-xs sm:text-sm">{review.name}</p>
                      {review.product && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{review.product}</p>
                      )}
                    </div>
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-blue-600 to-sky-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                      {review.name.charAt(0)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

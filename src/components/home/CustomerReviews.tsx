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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 sm:h-52 rounded-xl bg-muted animate-pulse" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {allReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  <Quote className="h-7 w-7 sm:h-8 sm:w-8 text-primary/20 dark:text-primary/30 mb-3" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 line-clamp-4">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${
                          i < review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm sm:text-base">{review.name}</p>
                      {review.product && (
                        <p className="text-xs sm:text-sm text-muted-foreground">{review.product}</p>
                      )}
                    </div>
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-emerald-600 dark:bg-gradient-to-br dark:from-[#0f172a] dark:to-[#10b981] flex items-center justify-center text-white text-xs sm:text-sm font-bold">
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

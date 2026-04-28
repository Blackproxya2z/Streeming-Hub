'use client'

import { useProducts, useCategories } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { ProductCard } from './ProductCard'
import { ProductFilters } from './ProductFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ShoppingBag, X } from 'lucide-react'

export function ProductCatalog() {
  const { filters, searchQuery, setSearchQuery, pageParams, setFilter } = useAppStore()
  const categorySlug = pageParams.categorySlug || filters.categorySlug || ''

  const { data: categories } = useCategories()
  const currentCategory = (categories || []).find(c => c.slug === categorySlug)

  const queryParams: Record<string, string> = {}
  if (searchQuery) queryParams.search = searchQuery
  if (categorySlug) queryParams.categorySlug = categorySlug
  if (filters.minPrice) queryParams.minPrice = filters.minPrice
  if (filters.maxPrice) queryParams.maxPrice = filters.maxPrice
  if (filters.duration) queryParams.duration = filters.duration
  if (filters.accountType) queryParams.accountType = filters.accountType
  if (filters.sort) queryParams.sort = filters.sort
  if (currentCategory?.isAdult) queryParams.isAdult = 'true'

  const { data, isLoading } = useProducts(queryParams)
  const products = data?.products || []

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {currentCategory ? currentCategory.name : 'All Products'}
          </h1>
          {currentCategory?.description && (
            <p className="text-muted-foreground text-sm">{currentCategory.description}</p>
          )}
          {!currentCategory && (
            <p className="text-muted-foreground text-sm">
              Browse our complete collection of digital subscriptions
            </p>
          )}
        </div>

        {/* Search bar - mobile inline */}
        <div className="flex gap-3 mb-6 lg:hidden">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <ProductFilters />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          <Badge
            variant={!categorySlug ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap shrink-0"
            onClick={() => setFilter('categorySlug', '')}
          >
            All
          </Badge>
          {(categories || []).filter(c => !c.isAdult).map(cat => (
            <Badge
              key={cat.id}
              variant={categorySlug === cat.slug ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap shrink-0"
              onClick={() => setFilter('categorySlug', cat.slug)}
            >
              {cat.name}
            </Badge>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Desktop Filters */}
          <ProductFilters />

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('')
                  setFilter('categorySlug', '')
                  setFilter('minPrice', '')
                  setFilter('maxPrice', '')
                  setFilter('duration', '')
                  setFilter('accountType', '')
                }}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-8">
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

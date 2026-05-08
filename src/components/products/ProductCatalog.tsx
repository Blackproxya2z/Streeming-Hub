'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useProducts, useCategories } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { ProductCard } from './ProductCard'
import { ProductFiltersMobile } from './ProductFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ShoppingBag, X, SlidersHorizontal } from 'lucide-react'
import { SEOHead } from '@/components/shared/SEOHead'

export function ProductCatalog() {
  const { filters, searchQuery, setSearchQuery, pageParams, setFilter, navigate } = useAppStore()
  const categorySlug = pageParams.categorySlug || filters.categorySlug || ''

  const { data: categories } = useCategories()
  const currentCategory = (categories || []).find(c => c.slug === categorySlug)

  const queryParams: Record<string, string> = {}
  if (searchQuery) queryParams.search = searchQuery
  if (categorySlug) queryParams.categorySlug = categorySlug
  if (filters.sort) queryParams.sort = filters.sort
  if (currentCategory?.isAdult) queryParams.isAdult = 'true'

  const { data, isLoading } = useProducts(queryParams)
  const products = data?.products || []

  const handleCategoryClick = useCallback((slug: string) => {
    setFilter('categorySlug', slug)
    if (slug) {
      navigate('category', { categorySlug: slug })
    } else {
      navigate('products')
    }
  }, [setFilter, navigate])

  // Debounced search
  const [localSearch, setLocalSearch] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, setSearchQuery])

  // Memoize category chips
  const categoryChips = useMemo(() => {
    if (!categories) return null
    return (
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        <Badge
          variant={!categorySlug ? 'default' : 'outline'}
          className="cursor-pointer whitespace-nowrap shrink-0 h-9"
          onClick={() => handleCategoryClick('')}
        >
          All
        </Badge>
        {categories.map(cat => {
          if (cat.isAdult && categorySlug !== cat.slug) return null
          return (
            <Badge
              key={cat.id}
              variant={categorySlug === cat.slug ? 'default' : 'outline'}
              className={`cursor-pointer whitespace-nowrap shrink-0 h-9 ${cat.isAdult ? 'border-orange-400 text-orange-600 dark:text-orange-400' : ''}`}
              onClick={() => handleCategoryClick(cat.slug)}
            >
              {cat.name}
            </Badge>
          )
        })}
      </div>
    )
  }, [categories, categorySlug, handleCategoryClick])

  return (
    <section className="py-4 sm:py-6 px-4">
      <div className="container mx-auto">
        {/* SEO for catalog/category page */}
        <SEOHead
          title={currentCategory ? `${currentCategory.name} — Buy Online in Bangladesh` : 'All Products — 120+ Digital Subscriptions'}
          description={currentCategory ? `Buy ${currentCategory.name} at best prices in Bangladesh. bKash/Nagad payment, 5-20 min delivery, full warranty.` : 'Browse 120+ premium digital subscriptions: Netflix, Spotify, YouTube Premium, ChatGPT, VPN & more at best prices in Bangladesh.'}
          keywords={currentCategory ? [currentCategory.name, `${currentCategory.name} Bangladesh`, `buy ${currentCategory.name} BD`] : ['buy subscription online', 'digital subscription catalog', 'Netflix price Bangladesh', 'Spotify premium BD']}
        />
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {currentCategory ? currentCategory.name : 'All Products'}
          </h1>
          {!currentCategory && (
            <p className="text-muted-foreground text-sm mt-1">
              Browse our complete collection of digital subscriptions
            </p>
          )}
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="pl-9 h-10"
            />
            {localSearch && (
              <button
                onClick={() => { setLocalSearch(''); setSearchQuery('') }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <ProductFiltersMobile />
        </div>

        {/* Category chips */}
        {categoryChips}

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 items-start">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-32 sm:h-40 rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-14 w-14 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={() => {
              setLocalSearch('')
              setSearchQuery('')
              setFilter('categorySlug', '')
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 items-start">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </section>
  )
}

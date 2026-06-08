'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useProducts, useCategories } from '@/lib/hooks'
import { useAppStore } from '@/lib/store'
import { ProductCard } from './ProductCard'
import { ProductFiltersMobile, ProductFiltersDesktop } from './ProductFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ShoppingBag, X, Lock, AlertTriangle, SlidersHorizontal } from 'lucide-react'
import { SEOHead } from '@/components/shared/SEOHead'

export function ProductCatalog() {
  const { filters, searchQuery, setSearchQuery, pageParams, setFilter, navigate, ageVerified, setAgeGateOpen } = useAppStore()
  const categorySlug = pageParams.categorySlug || filters.categorySlug || ''

  const { data: categories } = useCategories()
  const currentCategory = (categories || []).find(c => c.slug === categorySlug)

  // Check if current category is adult and user is not verified (5-min expiry)
  const isAdultCategory = currentCategory?.isAdult === true
  const verifiedAt = typeof window !== 'undefined' ? localStorage.getItem('restrictedVerifiedAt') : null
  const isVerificationExpired = !verifiedAt || Date.now() - parseInt(verifiedAt, 10) > 300_000
  const needsVerification = isAdultCategory && (!ageVerified || isVerificationExpired)

  const queryParams: Record<string, string> = {}
  if (searchQuery) queryParams.search = searchQuery
  if (categorySlug) queryParams.categorySlug = categorySlug
  if (filters.sort) queryParams.sort = filters.sort
  // If viewing an adult category and verified, pass isAdult=true
  if (isAdultCategory && ageVerified) queryParams.isAdult = 'true'
  // If viewing "All Products" and age is verified, include adult products too
  if (!categorySlug && ageVerified) queryParams.isAdult = 'true'

  // Don't fetch if we need verification - show verify prompt instead
  const shouldFetch = !needsVerification
  const { data, isLoading } = useProducts(shouldFetch ? queryParams : {})
  const products = shouldFetch ? (data?.products || []) : []

  const handleCategoryClick = useCallback((slug: string, isAdult?: boolean) => {
    setFilter('categorySlug', slug)
    if (slug) {
      navigate('category', { categorySlug: slug })
      // If adult, check 5-minute expiry
      if (isAdult) {
        const vAt = localStorage.getItem('restrictedVerifiedAt')
        const expired = !vAt || Date.now() - parseInt(vAt, 10) > 300_000
        if (!ageVerified || expired) {
          setAgeGateOpen(true)
        }
      }
    } else {
      navigate('products')
    }
  }, [setFilter, navigate, ageVerified, setAgeGateOpen])

  // Handle verify button click for adult category inline prompt
  const handleVerifyClick = useCallback(() => {
    setAgeGateOpen(true)
  }, [setAgeGateOpen])

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
          className="cursor-pointer whitespace-nowrap shrink-0 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
          onClick={() => handleCategoryClick('')}
        >
          All Products
        </Badge>
        {categories.map(cat => (
          <Badge
            key={cat.id}
            variant={categorySlug === cat.slug ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap shrink-0 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 ${cat.isAdult ? 'border-orange-400 text-orange-600 dark:text-orange-400' : ''}`}
            onClick={() => handleCategoryClick(cat.slug, cat.isAdult)}
          >
            {cat.name} {cat.isAdult && !ageVerified ? '🔒' : cat.isAdult ? '🔓' : ''}
          </Badge>
        ))}
      </div>
    )
  }, [categories, categorySlug, handleCategoryClick, ageVerified])

  return (
    <section className="py-4 sm:py-6 px-3 sm:px-4">
      <div className="container mx-auto">
        {/* SEO for catalog/category page */}
        <SEOHead
          title={currentCategory ? `${currentCategory.name} — Buy Online in Bangladesh` : 'All Products — 120+ Digital Subscriptions'}
          description={currentCategory ? `Buy ${currentCategory.name} at best prices in Bangladesh. bKash/Nagad payment, 5-20 min delivery, full warranty.` : 'Browse 120+ premium digital subscriptions: Netflix, Spotify, YouTube Premium, ChatGPT, VPN & more at best prices in Bangladesh.'}
          keywords={currentCategory ? [currentCategory.name, `${currentCategory.name} Bangladesh`, `buy ${currentCategory.name} BD`] : ['buy subscription online', 'digital subscription catalog', 'Netflix price Bangladesh', 'Spotify premium BD']}
        />
        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {currentCategory ? currentCategory.name : 'All Products'}
          </h1>
          {!currentCategory && (
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Browse our complete collection of digital subscriptions
            </p>
          )}
          {currentCategory && (
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {currentCategory.name} — best prices in Bangladesh with full warranty
            </p>
          )}
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-2 mb-4 sm:mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
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
          <ProductFiltersDesktop />
        </div>

        {/* Category chips */}
        {categoryChips}

        {/* Adult Category — Age Verification Required (inline fallback) */}
        {needsVerification && (
          <div className="text-center py-12 sm:py-16">
            <div className="mx-auto mb-4 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">🔒 Age Verification Required</h3>
            <p className="text-muted-foreground text-sm mb-1">
              এই সেকশনে শুধুমাত্র প্রাপ্তবয়স্কদের জন্য কন্টেন্ট রয়েছে।
            </p>
            <p className="text-muted-foreground text-xs mb-6">
              This section contains content intended for adults only.
            </p>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl h-12 shadow-lg"
              onClick={handleVerifyClick}
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              আমি ১৮+ — ভেরিফাই করুন
            </Button>
            <p className="text-[11px] text-muted-foreground mt-4">
              PIN জানা না থাকলে WhatsApp-এ যোগাযোগ করুন
            </p>
          </div>
        )}

        {/* Normal Product Grid (shown when verified or not adult) */}
        {!needsVerification && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 items-start">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-36 sm:h-44 md:h-48 rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <ShoppingBag className="h-12 w-12 sm:h-14 sm:w-14 text-muted mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No Products Found</h3>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 items-start">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} showDetails={true} />
                ))}
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8">
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}

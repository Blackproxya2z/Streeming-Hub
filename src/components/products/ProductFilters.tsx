'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useCategories } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
// lockScroll/unlockScroll REMOVED — was causing scroll to get permanently stuck on mobile
import { SlidersHorizontal, X } from 'lucide-react'

const sortOptions = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A-Z' },
]

export function ProductFiltersMobile() {
  const { filters, setFilter, resetFilters } = useAppStore()
  const { data: categories } = useCategories()
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeFilterCount = (filters.categorySlug ? 1 : 0) + (filters.sort && filters.sort !== 'popular' ? 1 : 0)

  // NOTE: No manual scroll lock. CSS :has() selector handles scroll lock when Sheet is open.

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 relative">
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Filters & Sort</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 pb-6">
          {/* Sort */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Sort By</Label>
            <Select
              value={filters.sort || 'popular'}
              onValueChange={v => setFilter('sort', v === 'popular' ? '' : v)}
            >
              <SelectTrigger className="h-10 sm:h-11">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              resetFilters()
            }}
          >
            Reset All Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Desktop sort dropdown - visible on md+ screens
export function ProductFiltersDesktop() {
  const { filters, setFilter, resetFilters } = useAppStore()
  const activeFilterCount = filters.sort && filters.sort !== 'popular' ? 1 : 0

  return (
    <div className="hidden md:flex items-center gap-2">
      <Select
        value={filters.sort || 'popular'}
        onValueChange={v => setFilter('sort', v === 'popular' ? '' : v)}
      >
        <SelectTrigger className="h-10 sm:h-11 w-[160px] text-sm">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={resetFilters}
        >
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      )}
    </div>
  )
}

export function ProductFilters() {
  return <ProductFiltersMobile />
}

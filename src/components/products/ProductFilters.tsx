'use client'

import { useAppStore } from '@/lib/store'
import { useCategories } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'

const sortOptions = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A-Z' },
]

export function ProductFiltersMobile() {
  const { filters, setFilter, resetFilters } = useAppStore()
  const { data: categories } = useCategories()

  const activeFilterCount = (filters.categorySlug ? 1 : 0) + (filters.sort && filters.sort !== 'popular' ? 1 : 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
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
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 pb-6">
          {/* Sort */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Sort By</Label>
            <Select
              value={filters.sort || 'popular'}
              onValueChange={v => setFilter('sort', v === 'popular' ? '' : v)}
            >
              <SelectTrigger className="h-10">
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

// Keep desktop export for compatibility but return null
export function ProductFiltersDesktop() {
  return null
}

export function ProductFilters() {
  return <ProductFiltersMobile />
}

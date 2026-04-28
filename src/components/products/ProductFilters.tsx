'use client'

import { useAppStore } from '@/lib/store'
import { useCategories } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'

const durations = ['1 month', '3 months', '6 months', '1 year']
const accountTypes = ['Personal', 'Shared', 'Own Mail', 'Mail Access', 'Gift Card', 'TopUp']
const sortOptions = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A-Z' },
]

interface FilterContentProps {
  filters: {
    categoryId: string
    categorySlug: string
    minPrice: string
    maxPrice: string
    duration: string
    accountType: string
    sort: string
  }
  searchQuery: string
  setFilter: (key: string, value: string) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
  cats: any[]
}

function FilterContent({ filters, setFilter, resetFilters, searchQuery, setSearchQuery, cats }: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Search</Label>
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="h-9"
        />
      </div>

      <Separator />

      {/* Category */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Category</Label>
        <Select
          value={filters.categorySlug}
          onValueChange={v => setFilter('categorySlug', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {(cats || []).filter(c => !c.isAdult).map(cat => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name} ({cat._count?.products || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Price Range (BDT)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={e => setFilter('minPrice', e.target.value)}
            className="h-9"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={e => setFilter('maxPrice', e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <Separator />

      {/* Duration */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Duration</Label>
        <div className="flex flex-wrap gap-2">
          {durations.map(d => (
            <Badge
              key={d}
              variant={filters.duration === d ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setFilter('duration', filters.duration === d ? '' : d)}
            >
              {d}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Account Type */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Account Type</Label>
        <div className="flex flex-wrap gap-2">
          {accountTypes.map(t => (
            <Badge
              key={t}
              variant={filters.accountType === t ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setFilter('accountType', filters.accountType === t ? '' : t)}
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sort */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Sort By</Label>
        <Select value={filters.sort} onValueChange={v => setFilter('sort', v)}>
          <SelectTrigger className="h-9">
            <SelectValue />
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
        onClick={resetFilters}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset All Filters
      </Button>
    </div>
  )
}

export function ProductFiltersDesktop() {
  const { filters, setFilter, resetFilters, searchQuery, setSearchQuery } = useAppStore()
  const { data: cats } = useCategories()

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'popular').length +
    (searchQuery ? 1 : 0)

  const filterProps = { filters, setFilter, resetFilters, searchQuery, setSearchQuery, cats: cats || [] }

  return (
    <div className="w-64 shrink-0">
      <div className="sticky top-20 bg-background border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <FilterContent {...filterProps} />
      </div>
    </div>
  )
}

export function ProductFiltersMobile() {
  const { filters, setFilter, resetFilters, searchQuery, setSearchQuery } = useAppStore()
  const { data: cats } = useCategories()

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'popular').length +
    (searchQuery ? 1 : 0)

  const filterProps = { filters, setFilter, resetFilters, searchQuery, setSearchQuery, cats: cats || [] }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="h-5 w-5 p-0 text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6 overflow-y-auto max-h-[calc(100vh-100px)]">
          <FilterContent {...filterProps} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ProductFilters() {
  return (
    <>
      <div className="hidden lg:block">
        <ProductFiltersDesktop />
      </div>
      <div className="lg:hidden">
        <ProductFiltersMobile />
      </div>
    </>
  )
}

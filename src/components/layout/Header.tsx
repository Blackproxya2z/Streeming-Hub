'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'
import { useCategories } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Tv,
  Brain,
  GraduationCap,
  Palette,
  Briefcase,
  Cloud,
  Shield,
  Gift,
  Gamepad2,
  Layers,
  AlertTriangle,
  Lock,
  ShoppingBag,
  Home,
} from 'lucide-react'
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

export function Header() {
  const { theme, setTheme } = useTheme()
  const { navigate, setSearchQuery, searchQuery, setAgeGateOpen, ageVerified, setMobileMenuOpen, isMobileMenuOpen } = useAppStore()
  const { data: categories } = useCategories()
  const [searchOpen, setSearchOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState('')

  const nonAdultCategories = (categories || []).filter(c => !c.isAdult)
  const adultCategory = (categories || []).find(c => c.isAdult)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(localSearch)
    navigate('products')
    setSearchOpen(false)
  }

  const handleCategoryClick = (slug: string, isAdult: boolean) => {
    if (isAdult && !ageVerified) {
      setAgeGateOpen(true)
      return
    }
    navigate('category', { categorySlug: slug })
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hidden sm:block">
              Subscription Lagbe
            </span>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent sm:hidden">
              SL
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('home')}
              className="text-sm"
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('products')}
              className="text-sm"
            >
              All Products
            </Button>
            {nonAdultCategories.slice(0, 6).map(cat => {
              const Icon = getCategoryIcon(cat)
              return (
                <Button
                  key={cat.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCategoryClick(cat.slug, cat.isAdult)}
                  className="text-sm"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {cat.name}
                </Button>
              )
            })}
            {adultCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCategoryClick(adultCategory.slug, adultCategory.isAdult)}
                className="text-sm text-orange-500"
              >
                <Lock className="h-4 w-4 mr-1" />
                {adultCategory.name}
              </Button>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-40 sm:w-64 h-9"
                />
                <Button type="submit" size="sm" variant="ghost">
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setSearchOpen(false); setLocalSearch('') }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="h-9 w-9"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Subscription Lagbe
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <nav className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => { navigate('home'); setMobileMenuOpen(false) }}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Home
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => { navigate('products'); setMobileMenuOpen(false) }}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        All Products
                      </Button>
                      <div className="h-px bg-border my-2" />
                      <p className="text-xs font-medium text-muted-foreground px-4 mb-1">Categories</p>
                      {(categories || []).map(cat => {
                        const Icon = getCategoryIcon(cat)
                        return (
                          <Button
                            key={cat.id}
                            variant="ghost"
                            className={`justify-start ${cat.isAdult ? 'text-orange-500' : ''}`}
                            onClick={() => handleCategoryClick(cat.slug, cat.isAdult)}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {cat.name}
                            {cat.isAdult && <Lock className="h-3 w-3 ml-auto" />}
                            {cat._count && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {cat._count.products}
                              </span>
                            )}
                          </Button>
                        )
                      })}
                      <div className="h-px bg-border my-2" />
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => { navigate('payment'); setMobileMenuOpen(false) }}
                      >
                        Payment Info
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => { navigate('reviews'); setMobileMenuOpen(false) }}
                      >
                        Customer Reviews
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => { navigate('terms'); setMobileMenuOpen(false) }}
                      >
                        Terms & Conditions
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => { navigate('privacy'); setMobileMenuOpen(false) }}
                      >
                        Privacy Policy
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => { navigate('contact'); setMobileMenuOpen(false) }}
                      >
                        Contact Us
                      </Button>
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

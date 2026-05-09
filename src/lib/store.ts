import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PageType = 
  | 'home' 
  | 'products' 
  | 'category' 
  | 'product' 
  | 'payment' 
  | 'reviews' 
  | 'terms' 
  | 'privacy' 
  | 'contact' 
  | 'admin' 
  | 'order'

interface PendingNavigation {
  page: PageType
  params: Record<string, string>
}

interface AppState {
  currentPage: PageType
  pageParams: Record<string, string>
  searchQuery: string
  filters: {
    categoryId: string
    categorySlug: string
    minPrice: string
    maxPrice: string
    duration: string
    accountType: string
    sort: string
  }
  ageVerified: boolean
  ageGateOpen: boolean
  pendingAdultNavigate: PendingNavigation | null
  isMobileMenuOpen: boolean
  
  navigate: (page: PageType, params?: Record<string, string>) => void
  setSearchQuery: (query: string) => void
  setFilter: (key: string, value: string) => void
  resetFilters: () => void
  setAgeVerified: (verified: boolean) => void
  setAgeGateOpen: (open: boolean) => void
  setPendingAdultNavigate: (nav: PendingNavigation | null) => void
  setMobileMenuOpen: (open: boolean) => void
}

const defaultFilters = {
  categoryId: '',
  categorySlug: '',
  minPrice: '',
  maxPrice: '',
  duration: '',
  accountType: '',
  sort: 'popular',
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'home',
      pageParams: {},
      searchQuery: '',
      filters: { ...defaultFilters },
      ageVerified: false,
      ageGateOpen: false,
      pendingAdultNavigate: null,
      isMobileMenuOpen: false,

      navigate: (page, params = {}) => {
        set({ currentPage: page, pageParams: params, isMobileMenuOpen: false })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
      })),

      resetFilters: () => set({ filters: { ...defaultFilters }, searchQuery: '' }),

      setAgeVerified: (verified) => set({ ageVerified: verified, ageGateOpen: false }),
      setAgeGateOpen: (open) => set({ ageGateOpen: open }),
      setPendingAdultNavigate: (nav) => set({ pendingAdultNavigate: nav }),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
    }),
    {
      name: 'streaming-hub-age',
      partialize: (state) => ({ ageVerified: state.ageVerified }),
    }
  )
)

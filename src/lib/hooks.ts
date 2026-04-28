'use client'

import { useQuery } from '@tanstack/react-query'

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  isAdult: boolean
  order: number
  _count?: { products: number }
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  categoryId: string
  image: string | null
  basePriceBDT: string
  priceOptions: string
  duration: string | null
  accountType: string | null
  region: string | null
  warranty: string | null
  deliveryTime: string
  stockStatus: string
  isFeatured: boolean
  isBestSeller: boolean
  isNewArrival: boolean
  features: string
  order: number
  category: Category
}

export interface Review {
  id: string
  name: string
  rating: number
  text: string
  product: string | null
  isApproved: boolean
  createdAt: string
}

export interface Settings {
  [key: string]: string
}

async function fetchAPI<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function useProducts(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) searchParams.set(k, v) })
  const url = `/api/products?${searchParams.toString()}`
  
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchAPI<{ products: Product[]; total: number; page: number; totalPages: number }>(url),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchAPI<Product>(`/api/products/${id}`),
    enabled: !!id,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchAPI<Category[]>('/api/categories'),
  })
}

export function useReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: () => fetchAPI<Review[]>('/api/reviews'),
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => fetchAPI<Settings>('/api/settings'),
  })
}

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: () => fetchAPI<{ id: string; text: string; isActive: boolean }[]>('/api/banners'),
  })
}

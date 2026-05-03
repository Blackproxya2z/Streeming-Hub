'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Adds BreadcrumbList structured data to the page for Google SERP breadcrumb display.
 * Automatically generates breadcrumbs based on the current page state.
 */
export function BreadcrumbSchema() {
  const { currentPage, pageParams } = useAppStore()

  useEffect(() => {
    const SITE_URL = 'https://streaminghub.com.bd'
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', url: SITE_URL },
    ]

    switch (currentPage) {
      case 'products':
        breadcrumbs.push({ name: 'All Products', url: `${SITE_URL}/?page=products` })
        break
      case 'category':
        if (pageParams.categorySlug) {
          const name = pageParams.categorySlug
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
          breadcrumbs.push({ name: 'Products', url: `${SITE_URL}/?page=products` })
          breadcrumbs.push({ name, url: `${SITE_URL}/?page=category&slug=${pageParams.categorySlug}` })
        }
        break
      case 'product':
        breadcrumbs.push({ name: 'Products', url: `${SITE_URL}/?page=products` })
        breadcrumbs.push({ name: 'Product Details', url: `${SITE_URL}/?page=product&id=${pageParams.productId || ''}` })
        break
      case 'order':
        breadcrumbs.push({ name: 'Place Order', url: `${SITE_URL}/?page=order` })
        break
      case 'payment':
        breadcrumbs.push({ name: 'Payment Info', url: `${SITE_URL}/?page=payment` })
        break
      case 'terms':
        breadcrumbs.push({ name: 'Terms & Conditions', url: `${SITE_URL}/?page=terms` })
        break
      case 'privacy':
        breadcrumbs.push({ name: 'Privacy Policy', url: `${SITE_URL}/?page=privacy` })
        break
      case 'reviews':
        breadcrumbs.push({ name: 'Customer Reviews', url: `${SITE_URL}/?page=reviews` })
        break
    }

    if (breadcrumbs.length > 1) {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }

      const existing = document.getElementById('breadcrumb-schema')
      if (existing) existing.remove()

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'breadcrumb-schema'
      script.textContent = JSON.stringify(schema)
      document.head.appendChild(script)

      return () => {
        const el = document.getElementById('breadcrumb-schema')
        if (el) el.remove()
      }
    }
  }, [currentPage, pageParams])

  return null
}

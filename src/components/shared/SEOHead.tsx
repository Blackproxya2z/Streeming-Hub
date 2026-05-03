'use client'

import { useEffect } from 'react'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  canonicalUrl?: string
  ogType?: 'website' | 'product'
  ogImage?: string
  productSchema?: Record<string, unknown>
}

/**
 * Client-side SEO component that updates document head dynamically.
 * For static pages, metadata in layout.tsx / page.tsx is preferred.
 * This is for SPA-style client-side navigation where metadata needs updating.
 */
export function SEOHead({
  title,
  description,
  keywords,
  ogImage,
  productSchema,
}: SEOHeadProps) {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = `${title} | Streaming Hub`
    }

    // Update or create meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.content = content
    }

    if (description) {
      updateMeta('description', description)
      updateMeta('og:description', description, true)
      updateMeta('twitter:description', description)
    }

    if (title) {
      updateMeta('og:title', `${title} | Streaming Hub`, true)
      updateMeta('twitter:title', `${title} | Streaming Hub`)
    }

    if (keywords && keywords.length > 0) {
      updateMeta('keywords', keywords.join(', '))
    }

    if (ogImage) {
      updateMeta('og:image', ogImage, true)
      updateMeta('twitter:image', ogImage)
    }

    // Add product schema if provided
    if (productSchema) {
      const existingSchema = document.getElementById('product-schema')
      if (existingSchema) existingSchema.remove()

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'product-schema'
      script.textContent = JSON.stringify(productSchema)
      document.head.appendChild(script)

      return () => {
        const el = document.getElementById('product-schema')
        if (el) el.remove()
      }
    }
  }, [title, description, keywords, ogImage, productSchema])

  return null
}

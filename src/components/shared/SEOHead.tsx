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
  articlePublishedTime?: string
  articleModifiedTime?: string
}

const SITE_URL = 'https://streaminghub.com.bd'
const SITE_NAME = 'Streaming Hub'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

/**
 * Client-side SEO component that updates document head dynamically.
 * For static pages, metadata in layout.tsx / page.tsx is preferred.
 * This is for SPA-style client-side navigation where metadata needs updating.
 */
export function SEOHead({
  title,
  description,
  keywords,
  ogType = 'website',
  ogImage,
  productSchema,
}: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Bangladesh's #1 Digital Subscription Store`
    const ogImg = ogImage || DEFAULT_OG_IMAGE

    // Update title
    document.title = fullTitle

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

    // Remove existing meta by name/property
    const removeMeta = (name: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name'
      const el = document.querySelector(`meta[${attr}="${name}"]`)
      if (el) el.remove()
    }

    // Standard SEO meta tags
    if (description) {
      updateMeta('description', description)
    }

    if (keywords && keywords.length > 0) {
      updateMeta('keywords', keywords.join(', '))
    }

    // Open Graph (Facebook) meta tags
    updateMeta('og:title', fullTitle, true)
    if (description) {
      updateMeta('og:description', description, true)
    }
    updateMeta('og:type', ogType, true)
    updateMeta('og:url', SITE_URL, true)
    updateMeta('og:site_name', SITE_NAME, true)
    updateMeta('og:locale', 'en_BD', true)
    updateMeta('og:image', ogImg, true)
    updateMeta('og:image:width', '1200', true)
    updateMeta('og:image:height', '630', true)
    updateMeta('og:image:alt', fullTitle, true)
    updateMeta('og:image:type', 'image/png', true)

    // Twitter Card meta tags
    updateMeta('twitter:card', 'summary_large_image')
    updateMeta('twitter:title', fullTitle)
    if (description) {
      updateMeta('twitter:description', description)
    }
    updateMeta('twitter:image', ogImg)
    updateMeta('twitter:site', '@streaminghub_bd')
    updateMeta('twitter:creator', '@streaminghub_bd')

    // Additional SEO meta tags
    updateMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    updateMeta('googlebot', 'index, follow')
    updateMeta('language', 'en-BD')
    updateMeta('geo.region', 'BD')
    updateMeta('geo.country', 'BD')
    updateMeta('geo.placename', 'Dhaka')
    updateMeta('author', SITE_NAME)

    // Product-specific structured data
    if (productSchema) {
      const existingSchema = document.getElementById('product-schema')
      if (existingSchema) existingSchema.remove()

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'product-schema'
      script.textContent = JSON.stringify({
        ...productSchema,
        '@context': 'https://schema.org',
      })
      document.head.appendChild(script)

      return () => {
        const el = document.getElementById('product-schema')
        if (el) el.remove()
      }
    } else {
      // Remove product schema if not on product page
      const existingSchema = document.getElementById('product-schema')
      if (existingSchema) existingSchema.remove()
    }
  }, [title, description, keywords, ogType, ogImage, productSchema])

  return null
}

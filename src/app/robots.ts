import { MetadataRoute } from 'next'

const SITE_URL = 'https://streaminghub.com.bd'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/products/', '/images/'],
      },
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

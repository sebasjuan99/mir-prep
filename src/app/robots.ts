import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.proximoresidente.com'

// Genera /robots.txt automáticamente. Permite rastrear todo el sitio público
// y bloquea las áreas privadas/transaccionales (que además requieren login).
// Declara la ubicación del sitemap para que Google lo descubra.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin', '/dashboard', '/cuenta'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

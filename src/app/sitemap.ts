import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.proximoresidente.com'

// Genera /sitemap.xml automáticamente. Por ahora solo la home es contenido
// público indexable (el resto del producto está tras login). A medida que se
// publiquen páginas públicas (blog, guías, landings por examen: /mir, /enarm,
// /examen-residencia-colombia...), añádelas a esta lista.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}

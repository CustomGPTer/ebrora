import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/auth/', '/account/', '/unsubscribe/', '/visualise', '/visualise/']
    },
    sitemap: 'https://www.ebrora.com/sitemap.xml'
  };
}

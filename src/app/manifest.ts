import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ebrora — AI Construction Document Generators & Templates',
    short_name: 'Ebrora',
    description:
      'AI-powered construction document generators, professional Excel templates, and 1,500+ free toolbox talks for UK site teams. 35+ AI tools including RAMS, COSHH, and ITP builders.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#1B5B50',
    categories: ['productivity', 'business'],
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'RAMS Builder',
        short_name: 'RAMS',
        description: 'Generate RAMS documents',
        url: '/rams-builder',
      },
      {
        name: 'Free Templates',
        short_name: 'Templates',
        description: 'Browse free construction templates',
        url: '/free-templates',
      },
      {
        name: 'Toolbox Talks',
        short_name: 'TBTs',
        description: 'Browse 1,500+ free toolbox talks',
        url: '/toolbox-talks',
      },
      {
        name: 'Products',
        short_name: 'Products',
        description: 'Browse our premium templates',
        url: '/products',
      },
    ],
  };
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ebrora — Professional Excel Templates & RAMS Builder',
    short_name: 'Ebrora',
    description:
      'Professional Excel templates for UK construction. Generate RAMS documents instantly with our AI-powered builder.',
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
        name: 'Products',
        short_name: 'Products',
        description: 'Browse our templates',
        url: '/products',
      },
    ],
  };
}

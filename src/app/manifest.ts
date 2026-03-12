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
    screenshots: [
      {
        src: '/screenshot-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/screenshot-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    icons: [
      {
        src: '/favicon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'RAMS Builder',
        short_name: 'RAMS',
        description: 'Generate RAMS documents',
        url: '/rams-builder',
        icons: [{ src: '/shortcut-192.png', sizes: '192x192' }],
      },
      {
        name: 'Products',
        short_name: 'Products',
        description: 'Browse our templates',
        url: '/products',
        icons: [{ src: '/shortcut-products-192.png', sizes: '192x192' }],
      },
    ],
    share_target: {
      action: '/api/share',
      method: 'post',
      enctype: 'multipart/form-data',
      params: {
        text: 'text',
        url: 'url',
      } as any,
    },
  };
}

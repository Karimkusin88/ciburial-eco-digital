import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ciburial Eco-Digital Village',
    short_name: 'Ciburial',
    description: 'Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Tepat Guna — Kp. Ciburial, Garut.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F3', // var(--cr)
    theme_color: '#1C3A2B', // var(--fo)
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}

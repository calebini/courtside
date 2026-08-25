import type {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Courtside',
    short_name: 'Courtside',
    description: 'League schedules, official results, and standings.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f3efe5',
    theme_color: '#17223b',
    categories: ['sports'],
    icons: [
      {
        src: '/icons/courtside-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/courtside-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  };
}

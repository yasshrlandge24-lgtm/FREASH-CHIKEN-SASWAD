import type { MetadataRoute } from 'next';

const BASE_URL = 'https://freash-chiken-saswad.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/cart',
        '/checkout',
        '/orders',
        '/profile/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/notifications/',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
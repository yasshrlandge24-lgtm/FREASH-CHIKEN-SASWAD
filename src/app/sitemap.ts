import type { MetadataRoute } from 'next';

const BASE_URL = 'https://freash-chiken-saswad.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/shop`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/quality`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
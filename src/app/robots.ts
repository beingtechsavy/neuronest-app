import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.neuronest.work';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/tasks', '/calendar', '/focus', '/settings', '/sessions', '/ai-breakdown', '/login', '/signup', '/reset-password', '/forgot-password'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

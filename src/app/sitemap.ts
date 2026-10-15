import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.neuronest.work';
  const pages = [
    { path: '', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/rescue', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/features', priority: .8, changeFrequency: 'monthly' as const },
    { path: '/pricing', priority: .8, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: .4, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: .2, changeFrequency: 'yearly' as const },
    { path: '/refund', priority: .2, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: .2, changeFrequency: 'yearly' as const },
  ];
  return pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

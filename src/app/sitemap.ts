import type { MetadataRoute } from 'next';
import { SEO_TASKS } from '@/data/seoTasks';

const BASE = 'https://www.neuronest.work';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: Array<{ path: string; priority: number }> = [
    { path: '', priority: 1 },
    { path: '/pricing', priority: 0.7 },
    { path: '/rescue', priority: 0.7 },
    { path: '/privacy', priority: 0.3 },
    { path: '/terms', priority: 0.3 },
  ];

  return [
    ...staticPages.map(({ path, priority }) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      priority,
    })),
    ...SEO_TASKS.map((task) => ({
      url: `${BASE}/start/${task.slug}`,
      lastModified: new Date(),
      priority: 0.8,
    })),
  ];
}

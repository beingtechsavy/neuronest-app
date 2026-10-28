import { SEO_TASKS } from '@/data/seoTasks';

export const dynamic = 'force-static';

const baseUrl = 'https://www.neuronest.work';
const corePages = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/rescue', priority: 1, changeFrequency: 'weekly' },
  { path: '/features', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/refund', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
];

export function GET() {
  const lastModified = new Date().toISOString();

  const seoPages = SEO_TASKS.map((task) => ({
    path: `/start/${task.slug}`,
    priority: 0.8,
    changeFrequency: 'weekly',
  }));

  const allPages = [...corePages, ...seoPages];

  const urls = allPages.map((page) => `
    <url>
      <loc>${baseUrl}${page.path}</loc>
      <lastmod>${lastModified}</lastmod>
      <changefreq>${page.changeFrequency}</changefreq>
      <priority>${page.priority}</priority>
    </url>`).join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

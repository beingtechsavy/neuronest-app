export const dynamic = 'force-static';

export function GET() {
  const baseUrl = 'https://www.neuronest.work';
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /dashboard',
    'Disallow: /tasks',
    'Disallow: /calendar',
    'Disallow: /focus',
    'Disallow: /settings',
    'Disallow: /sessions',
    'Disallow: /ai-breakdown',
    'Disallow: /login',
    'Disallow: /signup',
    'Disallow: /reset-password',
    'Disallow: /forgot-password',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Host: ${baseUrl}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

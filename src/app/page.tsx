import type { Metadata } from 'next';
import LandingPageClient from '@/components/LandingPageClient';

export const metadata: Metadata = {
  title: 'NeuroNest — One small next action to help you begin',
  description: 'When you know what to do but cannot begin, NeuroNest gives you one small, realistic next action. No account required.',
  alternates: { canonical: 'https://www.neuronest.work' },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'NeuroNest',
      alternateName: ['neuronest.work'],
      url: 'https://www.neuronest.work',
      logo: 'https://www.neuronest.work/neuronest-mark.svg',
      sameAs: [process.env.NEXT_PUBLIC_LINKEDIN_URL, process.env.NEXT_PUBLIC_INSTAGRAM_URL].filter(Boolean),
    },
    {
      '@type': 'WebSite',
      name: 'NeuroNest',
      url: 'https://www.neuronest.work',
      description: 'One small next action for the task you are resisting.',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'NeuroNest',
      url: 'https://www.neuronest.work/rescue',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web',
      description: 'A task-initiation tool that helps people move from stuck to started.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', url: 'https://www.neuronest.work/rescue' },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <LandingPageClient />
    </>
  );
}

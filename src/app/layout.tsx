import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react';
import RootLayoutInner from './RootLayoutInner'
import './globals.css'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0D9488' },
    { media: '(prefers-color-scheme: dark)', color: '#1E1F22' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.neuronest.work'),
  title: 'NeuroNest — Start the task you are resisting',
  description: 'NeuroNest gives you one small, realistic next action when you know what to do but cannot begin.',
  keywords: ['productivity', 'ADHD productivity', 'task breakdown', 'overcome procrastination', 'focus timer', 'neurodivergent tools'],
  authors: [{ name: 'NeuroNest Team' }],
  applicationName: 'NeuroNest',
  category: 'productivity',
  alternates: { canonical: 'https://www.neuronest.work' },
  openGraph: {
    title: 'NeuroNest — Start the task you are resisting',
    description: 'Get one small, realistic next action and begin without an account.',
    url: 'https://www.neuronest.work',
    siteName: 'NeuroNest',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'NeuroNest — One small next action. Then begin.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeuroNest — Start the task you are resisting',
    description: 'Get one small, realistic next action and begin without an account.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/neuronest-mark.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/neuronest-mark.svg',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap"
        />
      </head>
      <body className="font-sans antialiased bg-[#1E1F22] text-[#F2F3F5]">
        <RootLayoutInner>{children}</RootLayoutInner>
        <Analytics />
      </body>
    </html>
  );
}

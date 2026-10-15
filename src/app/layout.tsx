import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react';
import { Inter, Outfit } from 'next/font/google'
import RootLayoutInner from './RootLayoutInner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

export const viewport: Viewport = {
  themeColor: '#020617',
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
    icon: '/neuronest-mark.svg',
    shortcut: '/neuronest-mark.svg',
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
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased bg-slate-950 text-white">
        <RootLayoutInner>{children}</RootLayoutInner>
        <Analytics />
      </body>
    </html>
  )
}

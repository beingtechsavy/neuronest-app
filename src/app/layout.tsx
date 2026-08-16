import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
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
  title: 'NeuroNest — Overcome Procrastination & Break Down Heavy Work',
  description: 'AI-powered rescue engine and productivity system designed for neurodivergent professionals and students to overcome overwhelm, break down tasks, and start working.',
  keywords: ['productivity', 'ADHD productivity', 'task breakdown', 'overcome procrastination', 'focus timer', 'neurodivergent tools'],
  authors: [{ name: 'NeuroNest Team' }],
  openGraph: {
    title: 'NeuroNest — Overcome Procrastination & Break Down Heavy Work',
    description: 'Stop staring at a blank screen. Get instant, frictionless 2-minute first steps tailored to your exact mental block.',
    url: 'https://neuronest.app',
    siteName: 'NeuroNest',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeuroNest — Overcome Procrastination',
    description: 'Get instant, frictionless 2-minute first steps tailored to your exact mental block.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {/* Google AdSense Verification */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2334920508693800"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans antialiased bg-slate-950 text-white">
        <RootLayoutInner>{children}</RootLayoutInner>
        <Analytics />
      </body>
    </html>
  )
}

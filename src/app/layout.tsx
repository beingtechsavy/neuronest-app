import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'; // 1. Import Analytics
import RootLayoutInner from './RootLayoutInner'
import './globals.css'

export const metadata: Metadata = {
  title: 'NeuroNest',
  description: 'ADHD-friendly smart planner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
        <Analytics /> {/* 2. Add the component here */}
      </body>
    </html>
  )
}

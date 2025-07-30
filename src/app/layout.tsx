import type { Metadata } from 'next'
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
      <body className="font-sans antialiased bg-slate-950 text-white">
        <RootLayoutInner>{children}</RootLayoutInner>
      </body>
    </html>
  )
}

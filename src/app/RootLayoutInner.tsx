'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { SupabaseProvider } from '@/components/SupabaseProvider'
import TopBar from '@/components/TopBar'

export default function RootLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Don't show TopBar on landing, login, or signup pages
  const showTopBar = !['/', '/login', '/signup'].includes(pathname)
  
  // Don't apply padding to authentication pages to maintain clean, immersive design
  const authPages = ['/', '/login', '/signup']
  const mainClassName = authPages.includes(pathname) ? '' : 'px-4 py-6'

  return (
    <SupabaseProvider>
      {showTopBar && <TopBar />}
      <main className={mainClassName}>{children}</main>
    </SupabaseProvider>
  )
}

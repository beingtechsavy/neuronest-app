'use client'

import { SessionContextProvider, SupabaseClient } from '@supabase/auth-helpers-react'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // ***** FINAL FIX: Cast the created client to the type expected by the provider *****
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  return (
    <SessionContextProvider supabaseClient={supabase as SupabaseClient}>
      {children}
    </SessionContextProvider>
  )
}

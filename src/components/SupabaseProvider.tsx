'use client'

import { SessionContextProvider, SupabaseClient } from '@supabase/auth-helpers-react'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  return (
    // ***** FINAL FIX: Use a two-step cast as suggested by the error message *****
    <SessionContextProvider supabaseClient={supabase as unknown as SupabaseClient}>
      {children}
    </SessionContextProvider>
  )
}

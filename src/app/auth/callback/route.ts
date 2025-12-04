import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('🔥 OAuth Callback - Route Handler')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Code present:', !!code)
  console.log('Error:', error)

  // Handle OAuth errors from provider
  if (error) {
    console.error('❌ OAuth provider error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${error}&message=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    )
  }

  // No code means invalid callback
  if (!code) {
    console.error('❌ No authorization code in callback')
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=no_code&message=${encodeURIComponent('Invalid authentication callback')}`
    )
  }

  try {
    const cookieStore = await cookies()
    
    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle cookie setting errors
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Handle cookie removal errors
            }
          },
        },
      }
    )
    
    console.log('🔄 Exchanging code for session...')
    
    // Exchange the code for a session with timeout
    const exchangePromise = supabase.auth.exchangeCodeForSession(code)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Exchange timeout')), 10000)
    )
    
    const { data, error: exchangeError } = await Promise.race([
      exchangePromise,
      timeoutPromise
    ]).catch(err => {
      console.error('❌ Exchange timeout or error:', err)
      return { data: null, error: err }
    }) as any
    
    if (exchangeError) {
      console.error('❌ Code exchange failed:', exchangeError)
      
      // Check for specific PKCE errors
      if (exchangeError.message?.includes('code_verifier') || exchangeError.message?.includes('PKCE')) {
        console.error('🔴 PKCE verification failed - code verifier missing or invalid')
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=pkce_failed&message=${encodeURIComponent('Authentication failed. Please try again.')}`
        )
      }
      
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
      )
    }

    if (!data.session || !data.user) {
      console.error('❌ No session or user after exchange')
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=no_session&message=${encodeURIComponent('Failed to create session')}`
      )
    }

    console.log('✅ Session created for:', data.user.email)
    
    // Check for profile (quick check, don't wait)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single()
    
    if (profile) {
      console.log('✅ Profile exists')
    } else {
      console.log('⚠️  Profile not found yet - will be created by trigger')
      // Don't block - profile creation happens async via database trigger
    }
    
    // Redirect to dashboard
    console.log('✅ Redirecting to dashboard')
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    
  } catch (error) {
    console.error('💥 Callback exception:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=callback_exception&message=${encodeURIComponent('An unexpected error occurred')}`
    )
  }
}

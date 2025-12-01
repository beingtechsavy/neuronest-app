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
    console.log('🔍 Checking for code verifier in cookies...')
    
    // The code verifier should be in cookies - log if it's missing
    const allCookies = cookieStore.getAll()
    console.log('Total cookies:', allCookies.length)
    const codeVerifierCookie = allCookies.find(c => c.name.includes('code-verifier') || c.name.includes('pkce'))
    console.log('Code verifier cookie:', codeVerifierCookie ? 'FOUND' : 'MISSING')
    if (codeVerifierCookie) {
      console.log('Code verifier cookie name:', codeVerifierCookie.name)
    }
    
    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Code exchange failed:', exchangeError)
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
    
    // Wait for profile creation (with retries)
    let profileExists = false
    const maxRetries = 6 // 3 seconds total
    
    for (let i = 0; i < maxRetries; i++) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()
      
      if (profile) {
        console.log('✅ Profile found')
        profileExists = true
        break
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    if (!profileExists) {
      console.warn('⚠️  Profile not found after 3 seconds, but continuing...')
      // Don't block login - profile might be created by trigger eventually
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

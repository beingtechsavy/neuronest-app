"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface GoogleSignInButtonProps {
  mode: 'signin' | 'signup'
  className?: string
}

export default function GoogleSignInButton({ mode, className = '' }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Changed from 'consent' to allow account selection
          },
          skipBrowserRedirect: false,
        }
      })

      if (error) {
        console.error('❌ OAuth initiation error:', error)
        setError(error.message)
        setLoading(false)
      } else {
        // User will be redirected to Google
      }
    } catch (err) {
      console.error('💥 OAuth exception:', err)
      setError('Failed to connect with Google')
      setLoading(false)
    }
  }

  const buttonText = mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'

  return (
    <div className="w-full">
      {/* Google's brand guidelines require the white chip, so this is the one
          surface in the app that stays light. It still matches the kit's radius,
          height, and focus ring so it does not read as a foreign control. */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className={`flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-[#6E747B]/40 bg-[#F2F3F5] px-4 py-3 font-medium text-[#1E1F22] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-[#949BA4] border-t-[#1E1F22] rounded-full animate-spin" aria-hidden="true" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>{loading ? 'Connecting...' : buttonText}</span>
      </button>
      
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-[#FF6B6B]">{error}</p>
      )}
    </div>
  )
}
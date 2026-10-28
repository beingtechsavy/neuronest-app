"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'
import { useTimeouts } from '@/hooks/useTimeout'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { AuthDivider, AuthError, AuthHeading, AuthShell } from '@/components/AuthShell'
import { Button, fieldClass } from '@/components/ui'

export default function SignupPage() {
  const router = useRouter()
  const { addTimeout } = useTimeouts()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!email || !password) {
      setError('Email and password are required.')
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0] // Use email prefix as default name
          }
        },
      })

      if (signUpError) {
        console.error('Signup error:', signUpError)

        // Handle specific error cases
        if (signUpError.message.includes('Database error')) {
          setError('Account creation temporarily unavailable. Please try again in a moment.')
        } else if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Try logging in instead.')
        } else {
          setError(signUpError.message)
        }
      } else if (data.session && data.user) {
        // User signed up successfully - ensure profile is initialized

        // Initialize profile with retry logic
        try {
          const { initializeUserData } = await import('@/lib/profileInitializer');
          const result = await initializeUserData(supabase, data.user.id);

          if (!result.success) {
            console.warn('⚠️  Profile initialization incomplete');
          }
        } catch (initError) {
          console.error('Profile initialization error:', initError);
          // Continue anyway - dashboard will handle it
        }

        setMessage('Account created. Taking you to your first rescue…')
        addTimeout(() => router.push('/rescue?resume=pending'), 1000)
      } else if (data.user && !data.session) {
        // This shouldn't happen with email confirmation disabled, but handle it
        setMessage('Account created. Check your email to confirm, then log in.')
        addTimeout(() => router.push('/login'), 3000)
      }
    } catch (err) {
      console.error('Signup exception:', err)
      setError('An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <AuthShell width="md">
      <AuthHeading
        title="Create your account"
        description="One small next action is all we ask for. No credit card, no setup ritual."
      />

      <GoogleSignInButton mode="signup" />

      <AuthDivider label="or sign up with email" />

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-[#DBDEE1]">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            disabled={loading}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-[#DBDEE1]">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={loading}
              className={`${fieldClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:text-[#2DD4BF]"
            >
              {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {message && (
          <p role="status" className="text-sm text-[#2DD4BF]">{message}</p>
        )}
        {error && <AuthError>{error}</AuthError>}

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-[#949BA4]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[#2DD4BF] underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}

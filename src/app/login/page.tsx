"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import GoogleSignInButton from "@/components/GoogleSignInButton"
import { AuthDivider, AuthError, AuthHeading, AuthShell } from "@/components/AuthShell"
import { Button, fieldClass } from "@/components/ui"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Check for error parameters in URL
  useEffect(() => {
    const urlError = searchParams.get('error')
    const message = searchParams.get('message')

    if (urlError === 'database_error') {
      setError('Account creation failed due to a database error. Please try signing up again or contact support.')
    } else if (urlError === 'timeout') {
      setError('Sign up process timed out. Please try again.')
    } else if (urlError === 'signin_failed') {
      setError('Sign in failed. Please check your credentials.')
    } else if (message) {
      setError(decodeURIComponent(message))
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  /** Shared field styles so both inputs share one height, radius, and focus ring. */
  return (
    <AuthShell>
      <AuthHeading title="Log in to NeuroNest" />

      <GoogleSignInButton mode="signin" />

      <AuthDivider label="or continue with email" />

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#DBDEE1]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#DBDEE1]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${fieldClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:text-[#2DD4BF]"
            >
              {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {error && <AuthError>{error}</AuthError>}

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-3 text-sm">
        <Link href="/forgot-password" className="text-[#2DD4BF] underline-offset-4 hover:underline">
          Forgot password?
        </Link>
        <p className="text-[#949BA4]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-[#2DD4BF] underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

// Loading component for Suspense fallback
function LoginLoading() {
  return (
    <AuthShell>
      <div aria-hidden="true" className="space-y-4">
        <div className="h-7 w-2/3 rounded-lg bg-[#383A40]" />
        <div className="h-12 rounded-xl bg-[#383A40]" />
        <div className="h-12 rounded-xl bg-[#383A40]" />
        <div className="h-12 rounded-xl bg-[#0D9488]/40" />
      </div>
      <span className="sr-only">Loading sign-in form…</span>
    </AuthShell>
  )
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}

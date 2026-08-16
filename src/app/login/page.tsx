"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import GoogleSignInButton from "@/components/GoogleSignInButton"

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
      setError('❌ Account creation failed due to a database error. Please try signing up again or contact support.')
    } else if (urlError === 'timeout') {
      setError('⏰ Sign up process timed out. Please try again.')
    } else if (urlError === 'signin_failed') {
      setError('❌ Sign in failed. Please check your credentials.')
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

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#071020] to-[#0d1125] p-4">
      {/* Decorative blobs */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-purple-700 opacity-20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -right-12 w-72 h-72 bg-indigo-600 opacity-20 rounded-full filter blur-3xl"></div>

      <div className="relative z-10 text-center space-y-6 max-w-sm w-full">
        <div className="text-8xl select-none">🧠</div>
        <div className="bg-[#0A111E] p-8 rounded-3xl shadow-2xl ring-1 ring-purple-700">
          <h2 className="mb-5 text-2xl font-bold text-purple-300">
            Log in to your NeuroNest account
          </h2>

          {/* Google Sign In */}
          <div className="mb-6">
            <GoogleSignInButton mode="signin" />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0A111E] text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 text-xs font-medium text-gray-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2 bg-[#071020] border border-gray-700 rounded-lg text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* CORRECTED PASSWORD INPUT SECTION */}
            <div>
              <label htmlFor="password" className="block mb-1 text-xs font-medium text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-[#071020] border border-gray-700 rounded-lg text-white pr-10 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  // These classes now correctly center the button relative to the new parent div
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-purple-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {/* END OF CORRECTION */}

            {error && <p className="text-center text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link 
              href="/forgot-password" 
              className="text-sm text-purple-300 hover:text-purple-200 underline"
            >
              Forgot password?
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don’t have an account?{' '}
            <Link href="/signup" className="underline text-purple-300 hover:text-purple-200">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function LoginLoading() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#071020] to-[#0d1125] p-4">
      <div className="relative z-10 text-center space-y-6 max-w-sm w-full">
        <div className="text-8xl select-none">🧠</div>
        <div className="bg-[#0A111E] p-8 rounded-3xl shadow-2xl ring-1 ring-purple-700">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="h-12 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-12 bg-gray-700 rounded mb-4"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
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
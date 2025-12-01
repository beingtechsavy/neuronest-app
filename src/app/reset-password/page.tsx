"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState(false)

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setValidToken(true)
      } else {
        // Check for error in URL params
        const errorParam = searchParams.get('error')
        if (errorParam) {
          setError('Invalid or expired reset link. Please request a new one.')
        }
      }
    }
    checkSession()
  }, [searchParams])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      console.error('Password reset exception:', err)
      setError('An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  if (!validToken && !error) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#071020] to-[#0d1125] p-4">
        <div className="relative z-10 text-center space-y-6 max-w-md w-full">
          <div className="text-8xl select-none">🧠</div>
          <div className="bg-[#0A111E] p-8 rounded-3xl shadow-2xl ring-1 ring-purple-700">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded mb-4"></div>
              <div className="h-12 bg-gray-700 rounded mb-4"></div>
              <div className="h-12 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#071020] to-[#0d1125] p-4">
      {/* Decorative blobs */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-purple-700 opacity-20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -right-12 w-72 h-72 bg-indigo-600 opacity-20 rounded-full filter blur-3xl"></div>

      <div className="relative z-10 text-center space-y-6 max-w-md w-full">
        <div className="text-8xl select-none">🧠</div>
        <div className="bg-[#0A111E] p-8 rounded-3xl shadow-2xl ring-1 ring-purple-700">
          {success ? (
            <>
              <div className="text-6xl mb-4">
                <CheckCircle className="inline-block text-green-500" size={64} />
              </div>
              <h1 className="mb-3 text-2xl font-bold text-green-400">
                Password Reset Successful!
              </h1>
              <p className="mb-6 text-sm text-gray-400">
                Your password has been updated. Redirecting you to login...
              </p>
              <div className="animate-pulse">
                <div className="h-2 bg-purple-600 rounded-full"></div>
              </div>
            </>
          ) : error && !validToken ? (
            <>
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="mb-3 text-2xl font-bold text-red-400">
                Invalid Reset Link
              </h1>
              <p className="mb-6 text-sm text-gray-400">
                {error}
              </p>
              <Link
                href="/forgot-password"
                className="inline-block w-full py-3 font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 transition"
              >
                Request New Reset Link
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-3 text-3xl font-extrabold text-purple-300">
                Reset Your Password
              </h1>
              <p className="mb-6 text-sm text-gray-400">
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <label className="block text-left">
                  <span className="text-xs font-medium text-gray-400">New Password</span>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 bg-[#071020] border border-gray-700 rounded-lg text-white pr-10 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-purple-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </label>

                <label className="block text-left">
                  <span className="text-xs font-medium text-gray-400">Confirm Password</span>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 bg-[#071020] border border-gray-700 rounded-lg text-white pr-10 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-purple-300"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </label>

                <div className="p-3 bg-gray-800/50 rounded-lg text-left">
                  <p className="text-xs text-gray-400 mb-2">Password must contain:</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li className={password.length >= 8 ? 'text-green-400' : ''}>
                      • At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-400' : ''}>
                      • One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-400' : ''}>
                      • One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-400' : ''}>
                      • One number
                    </li>
                  </ul>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <Link 
                href="/login"
                className="mt-6 inline-block text-sm text-purple-300 hover:text-purple-200"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function ResetPasswordLoading() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#071020] to-[#0d1125] p-4">
      <div className="relative z-10 text-center space-y-6 max-w-md w-full">
        <div className="text-8xl select-none">🧠</div>
        <div className="bg-[#0A111E] p-8 rounded-3xl shadow-2xl ring-1 ring-purple-700">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="h-12 bg-gray-700 rounded mb-4"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

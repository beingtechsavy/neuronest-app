"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'
import { useTimeouts } from '@/hooks/useTimeout'
import GoogleSignInButton from '@/components/GoogleSignInButton'

export default function SignupPage() {
  const router = useRouter()
  const { addTimeout } = useTimeouts()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async () => {
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
        // User signed up successfully - database trigger should handle profile creation
        console.log('✅ User created:', data.user.email)
        
        // Send welcome email
        try {
          await fetch('/api/email/send-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.user.email,
              username: email.split('@')[0],
            }),
          })
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError)
          // Don't block signup if email fails
        }
        
        setMessage('🎉 Account created! Redirecting...')
        addTimeout(() => router.push('/dashboard'), 1000)
      } else if (data.user && !data.session) {
        // This shouldn't happen with email confirmation disabled, but handle it
        setMessage('🎉 Account created! Please check your email to confirm.')
        addTimeout(() => router.push('/login'), 3000)
      }
    } catch (err) {
      console.error('Signup exception:', err)
      setError('An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#071020] to-[#0d1125] p-4">
      {/* Decorative blobs */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-purple-700 opacity-20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -right-12 w-72 h-72 bg-indigo-600 opacity-20 rounded-full filter blur-3xl"></div>

      <div className="relative z-10 text-center space-y-6 max-w-md w-full">
        <div className="text-8xl select-none">🧠</div>
        <div className="bg-[#0A111E] p-8 rounded-3xl shadow-2xl ring-1 ring-purple-700">
          <h1 className="mb-5 text-3xl font-extrabold text-purple-300">
            Create your NeuroNest account
          </h1>

          {/* Google Sign Up */}
          <div className="mb-6">
            <GoogleSignInButton mode="signup" />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0A111E] text-gray-400">Or sign up with email</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-left">
              <span className="text-xs font-medium text-gray-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full px-4 py-2 bg-[#071020] border border-gray-700 rounded-lg text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </label>

            <label className="block relative text-left">
              <span className="text-xs font-medium text-gray-400">Password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full px-4 py-2 bg-[#071020] border border-gray-700 rounded-lg text-white pr-10 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-9 text-gray-400 hover:text-purple-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </label>

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full py-3 font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {loading ? 'Signing up…' : 'Sign Up'}
            </button>

            {message && <p className="text-center text-sm text-green-400">{message}</p>}
            {error && <p className="text-center text-sm text-red-500">{error}</p>}
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="underline text-purple-300 hover:text-purple-200">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
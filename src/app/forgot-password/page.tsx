"use client"

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!email) {
      setError('Please enter your email address.')
      setLoading(false)
      return
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
      } else {
        setEmailSent(true)
        setMessage('Check your email! We sent you a password reset link.')
        
        // Also send custom email via our API
        try {
          await fetch('/api/email/send-password-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              username: email.split('@')[0],
              resetLink: `${window.location.origin}/reset-password`,
            }),
          })
        } catch (emailError) {
          console.error('Failed to send custom reset email:', emailError)
          // Don't show error to user - Supabase email was sent
        }
      }
    } catch (err) {
      console.error('Password reset exception:', err)
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
          {!emailSent ? (
            <>
              <h1 className="mb-3 text-3xl font-extrabold text-purple-300">
                Forgot Password?
              </h1>
              <p className="mb-6 text-sm text-gray-400">
                No worries! Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleResetRequest} className="space-y-4">
                <label className="block text-left">
                  <span className="text-xs font-medium text-gray-400">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1 w-full px-4 py-2 bg-[#071020] border border-gray-700 rounded-lg text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    disabled={loading}
                  />
                </label>

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
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <Link 
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">✉️</div>
              <h1 className="mb-3 text-2xl font-bold text-purple-300">
                Check your email!
              </h1>
              <p className="mb-6 text-sm text-gray-400">
                We sent a password reset link to <strong className="text-white">{email}</strong>
              </p>

              <div className="p-4 bg-purple-500/10 border border-purple-500/50 rounded-lg mb-6">
                <p className="text-sm text-purple-200">
                  <strong>⏰ Link expires in 1 hour</strong>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Didn&apos;t receive it? Check your spam folder or try again.
                </p>
              </div>

              <button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                  setMessage(null)
                }}
                className="w-full py-3 font-semibold rounded-lg bg-gray-700 hover:bg-gray-600 transition mb-3"
              >
                Send Another Link
              </button>

              <Link 
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

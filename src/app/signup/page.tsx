"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { getRedirectUrl } from '@/lib/redirectUrl'
import { Eye, EyeOff } from 'lucide-react'
import { 
  AuthErrorHandler, 
  ValidationUtils, 
  validateForm,
  ValidationError 
} from '@/lib/errorHandling'
import ValidationErrorDisplay, { useValidationErrors } from '@/components/ValidationErrorDisplay'
import { trackAuthAction } from '@/lib/analytics'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Enhanced validation error handling
  const { 
    errors: validationErrors, 
    addErrors, 
    clearErrors, 
    hasErrors,
    getFieldError 
  } = useValidationErrors()

  const handleSignup = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    clearErrors()

    try {
      // Comprehensive form validation
      const validationResult = validateForm(
        { email, password },
        {
          email: ValidationUtils.validateEmail,
          password: ValidationUtils.validatePassword
        }
      )

      if (!validationResult.isValid) {
        addErrors(validationResult.errors)
        setLoading(false)
        return
      }

      // Validate redirect URL configuration
      let redirectUrl: string
      try {
        redirectUrl = getRedirectUrl()
        
        // Additional validation for production environment
        if (process.env.NODE_ENV === 'production' && redirectUrl.includes('localhost')) {
          throw new Error('localhost redirect in production')
        }
      } catch (redirectError) {
        const errorResult = AuthErrorHandler.handleRedirectUrlError(
          redirectError as Error, 
          redirectUrl!
        )
        setError(errorResult.userMessage)
        setLoading(false)
        return
      }

      // Attempt signup with enhanced error handling
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { 
          emailRedirectTo: `${redirectUrl}/login`,
          data: {
            // Add any additional user metadata here
            signup_timestamp: new Date().toISOString()
          }
        },
      })

      if (signUpError) {
        // Handle specific Supabase auth errors
        const errorResult = AuthErrorHandler.handleSignupConfirmationError(signUpError)
        
        if (signUpError.message.includes('already_registered')) {
          setError('An account with this email already exists. Please try logging in instead.')
        } else if (signUpError.message.includes('invalid_email')) {
          addErrors([{
            field: 'email',
            message: 'Please enter a valid email address',
            code: 'INVALID_EMAIL'
          }])
        } else if (signUpError.message.includes('weak_password')) {
          addErrors([{
            field: 'password',
            message: 'Password is too weak. Please choose a stronger password',
            code: 'WEAK_PASSWORD'
          }])
        } else {
          setError(errorResult.userMessage)
        }
      } else {
        // Success - track signup event
        trackAuthAction('signup')
        setMessage('🎉 Signup successful! Check your email to confirm your account.')
        
        // Clear form data on success
        setEmail('')
        setPassword('')
        
        // Redirect after delay
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (unexpectedError) {
      console.error('Unexpected error during signup:', unexpectedError)
      
      // Handle unexpected errors
      if (unexpectedError instanceof Error) {
        if (unexpectedError.message.includes('network') || 
            unexpectedError.message.includes('fetch')) {
          setError('Network error. Please check your internet connection and try again.')
        } else {
          setError('An unexpected error occurred. Please try again.')
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Real-time validation as user types
  const handleEmailChange = (value: string) => {
    setEmail(value)
    
    // Clear email-related errors when user starts typing
    if (getFieldError('email')) {
      clearErrors()
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    
    // Clear password-related errors when user starts typing
    if (getFieldError('password')) {
      clearErrors()
    }
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

          <div className="space-y-4">
            <label className="block text-left">
              <span className="text-xs font-medium text-gray-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={e => handleEmailChange(e.target.value)}
                placeholder="you@example.com"
                className={`mt-1 w-full px-4 py-2 bg-[#071020] border rounded-lg text-white outline-none focus:ring-1 ${
                  getFieldError('email') 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-700 focus:border-purple-500 focus:ring-purple-500'
                }`}
                disabled={loading}
                autoComplete="email"
              />
              {getFieldError('email') && (
                <p className="mt-1 text-xs text-red-400">
                  {getFieldError('email')?.message}
                </p>
              )}
            </label>

            <label className="block relative text-left">
              <span className="text-xs font-medium text-gray-400">Password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className={`mt-1 w-full px-4 py-2 bg-[#071020] border rounded-lg text-white pr-10 outline-none focus:ring-1 ${
                  getFieldError('password') 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-700 focus:border-purple-500 focus:ring-purple-500'
                }`}
                disabled={loading}
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-9 text-gray-400 hover:text-purple-300 disabled:opacity-50"
                disabled={loading}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {getFieldError('password') && (
                <p className="mt-1 text-xs text-red-400">
                  {getFieldError('password')?.message}
                </p>
              )}
            </label>

            <button
              onClick={handleSignup}
              disabled={loading || hasErrors}
              className="w-full py-3 font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing up…' : 'Sign Up'}
            </button>

            {/* Validation errors */}
            {hasErrors && (
              <ValidationErrorDisplay 
                errors={validationErrors}
                onDismiss={clearErrors}
                className="mt-4"
              />
            )}

            {/* Success message */}
            {message && (
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 mt-4">
                <p className="text-center text-sm text-green-400">{message}</p>
              </div>
            )}

            {/* General error message */}
            {error && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mt-4">
                <p className="text-center text-sm text-red-400">{error}</p>
              </div>
            )}
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
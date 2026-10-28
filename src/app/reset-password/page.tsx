"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { AuthError, AuthHeading, AuthShell } from '@/components/AuthShell'
import { Button, buttonClass, CardInset, IconBadge, fieldClass } from '@/components/ui'

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  disabled,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  disabled: boolean
  autoComplete: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-[#DBDEE1]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          disabled={disabled}
          className={fieldClass + " pr-12"}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={show}
          className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-[#949BA4] transition-colors hover:text-[#2DD4BF]"
        >
          {show ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

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

  const requirements = [
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[a-z]/.test(password), label: 'One lowercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
  ]

  if (!validToken && !error) {
    return (
      <AuthShell>
        <div aria-hidden="true" className="space-y-4">
          <div className="h-7 w-2/3 rounded-lg bg-[#383A40]" />
          <div className="h-12 rounded-xl bg-[#383A40]" />
          <div className="h-12 rounded-xl bg-[#383A40]" />
          <div className="h-12 rounded-xl bg-[#0D9488]/40" />
        </div>
        <span className="sr-only">Checking your reset link…</span>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      {success ? (
        <>
          <IconBadge tone="success" size="lg" className="mb-5">
            <CheckCircle size={26} aria-hidden="true" />
          </IconBadge>
          <AuthHeading
            title="Password updated"
            description="You're signed out everywhere except here. Taking you to the login screen…"
          />
          <Button size="lg" fullWidth onClick={() => router.push('/login')}>
            Go to login now
          </Button>
        </>
      ) : error && !validToken ? (
        <>
          <IconBadge tone="danger" size="lg" className="mb-5">
            <AlertTriangle size={26} aria-hidden="true" />
          </IconBadge>
          <AuthHeading title="This link has expired" description={error} />
          <Link href="/forgot-password" className={buttonClass({ size: 'lg', fullWidth: true })}>
            Request a new link
          </Link>
        </>
      ) : (
        <>
          <AuthHeading
            title="Choose a new password"
            description="You'll be signed in on this device only."
          />

          <form onSubmit={handleResetPassword} className="space-y-4">
            <PasswordField
              id="new-password"
              label="New password"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword(v => !v)}
              disabled={loading}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(v => !v)}
              disabled={loading}
              autoComplete="new-password"
            />

            <CardInset>
              <p className="mb-2 text-xs font-medium text-[#949BA4]">Password must contain:</p>
              <ul className="space-y-1.5 text-xs">
                {requirements.map((req) => (
                  <li
                    key={req.label}
                    className={req.met ? 'flex items-center gap-2 text-[#23A55A]' : 'flex items-center gap-2 text-[#949BA4]'}
                  >
                    <CheckCircle
                      size={14}
                      className={req.met ? 'shrink-0' : 'shrink-0 opacity-40'}
                      aria-hidden="true"
                    />
                    <span>
                      {req.label}
                      <span className="sr-only">{req.met ? ' — met' : ' — not yet met'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardInset>

            {error && <AuthError>{error}</AuthError>}

            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-5 inline-flex min-h-[44px] items-center text-sm text-[#949BA4] transition-colors hover:text-[#F2F3F5]"
          >
            Back to login
          </Link>
        </>
      )}
    </AuthShell>
  )
}

// Loading component for Suspense fallback
function ResetPasswordLoading() {
  return (
    <AuthShell>
      <div aria-hidden="true" className="space-y-4">
        <div className="h-7 w-2/3 rounded-lg bg-[#383A40]" />
        <div className="h-12 rounded-xl bg-[#383A40]" />
        <div className="h-12 rounded-xl bg-[#383A40]" />
        <div className="h-12 rounded-xl bg-[#0D9488]/40" />
      </div>
      <span className="sr-only">Loading password form…</span>
    </AuthShell>
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

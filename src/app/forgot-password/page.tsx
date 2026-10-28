"use client"

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, MailCheck, Clock3 } from 'lucide-react'
import { AuthError, AuthHeading, AuthShell } from '@/components/AuthShell'
import { Button, CardInset, IconBadge, fieldClass } from '@/components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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
      }
    } catch (err) {
      console.error('Password reset exception:', err)
      setError('An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <AuthShell>
      {!emailSent ? (
        <>
          <AuthHeading
            title="Reset your password"
            description="Enter the email on your account and we'll send a reset link."
          />

          <form onSubmit={handleResetRequest} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-[#DBDEE1]">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                className={fieldClass}
              />
            </div>

            {error && <AuthError>{error}</AuthError>}

            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-sm text-[#949BA4] transition-colors hover:text-[#F2F3F5]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to login
          </Link>
        </>
      ) : (
        <>
          <IconBadge tone="brand" size="md" className="mb-5">
            <MailCheck size={22} aria-hidden="true" />
          </IconBadge>

          <AuthHeading
            title="Check your email"
            description={
              <>
                We sent a reset link to{' '}
                <strong className="font-semibold text-[#F2F3F5]">{email}</strong>
              </>
            }
          />

          <CardInset className="mb-5 flex items-start gap-3">
            <Clock3 size={18} className="mt-0.5 shrink-0 text-[#E8A33D]" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-[#DBDEE1]">The link expires in 1 hour</p>
              <p className="mt-1 text-xs leading-relaxed text-[#949BA4]">
                Didn&apos;t receive it? Check your spam folder, then try again.
              </p>
            </div>
          </CardInset>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setEmailSent(false)
              setEmail('')
            }}
          >
            Send another link
          </Button>

          <Link
            href="/login"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm text-[#949BA4] transition-colors hover:text-[#F2F3F5]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to login
          </Link>
        </>
      )}
    </AuthShell>
  )
}

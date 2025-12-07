'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔥 Auth callback page loaded')
        console.log('🔍 Current URL:', window.location.href)
        
        // Clear any corrupted cookies first
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Wait a moment for URL to settle
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check if we have a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log('📊 Session check:', { sessionData, sessionError })
        
        if (sessionData.session) {
          console.log('✅ Session exists, redirecting to dashboard')
          router.push('/dashboard')
          return
        }
        
        // If no session, check for auth state change
        console.log('⏳ Waiting for auth state change...')
        
        // Check for error in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error === 'server_error' && errorDescription?.includes('Database error saving new user')) {
          console.log('🚨 Database error detected - user creation failed')
          router.push('/login?error=database_error&message=Account creation failed. Please try again or contact support.')
          return
        }
        
        // Listen for auth changes with shorter timeout
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 Auth state change:', event, session?.user?.email)
          
          if (event === 'SIGNED_IN' && session) {
            console.log('✅ User signed in successfully')
            subscription.unsubscribe()
            router.push('/dashboard')
          } else if (event === 'SIGNED_OUT') {
            console.log('❌ Sign in failed')
            subscription.unsubscribe()
            router.push('/login?error=signin_failed')
          }
        })
        
        // Shorter timeout since we're handling errors better
        setTimeout(() => {
          console.log('⏰ Timeout reached, cleaning up')
          subscription.unsubscribe()
          router.push('/login?error=timeout')
        }, 5000)
        
      } catch (error) {
        console.error('💥 Callback exception:', error)
        router.push('/login?error=callback_exception')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🧠</div>
        <h2 className="text-xl font-semibold mb-2">Completing sign-in...</h2>
        <p className="text-gray-400 mb-4">Please wait while we authenticate you</p>
        <div className="w-8 h-8 border-2 border-purple-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  )
}
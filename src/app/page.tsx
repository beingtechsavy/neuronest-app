'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">

      {/* MASSIVE BRAIN ICON */}
      <div className="text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[14rem] leading-none mb-4 select-none">
        🧠
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center leading-tight">
        Welcome to <span className="text-purple-400">NeuroNest</span>
      </h1>

      <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl text-center">
        An ADHD-friendly task manager designed for simplicity, focus, and building better routines.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Primary CTA - See Features */}
        <Link
          href="/features"
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition text-center"
        >
          See How It Works
        </Link>

        {/* Secondary CTA - Sign Up */}
        <GoogleSignInButton mode="signup" className="!bg-white !hover:bg-gray-50 !text-gray-900 !border-gray-300" />

        {/* Tertiary CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 text-sm">
          <Link
            href="/signup"
            className="text-purple-300 hover:text-white font-medium py-2 px-6 rounded transition text-center underline"
          >
            Sign up with email
          </Link>
          <Link
            href="/login"
            className="text-purple-300 hover:text-white font-medium py-2 px-6 rounded transition text-center underline"
          >
            Already have an account?
          </Link>
        </div>
      </div>

      <div className="mt-12 text-sm text-slate-500 text-center">
        Built for minds that wander — we bring the focus back.
      </div>
    </div>
  )
}

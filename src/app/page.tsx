'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/rescue');
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
    <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-center px-4 sm:px-6 py-8 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">

      {/* Brain icon */}
      <div className="text-6xl sm:text-7xl leading-none mb-6 select-none">
        🧠
      </div>

      <h1 className="text-[clamp(1.85rem,6vw,3.25rem)] font-extrabold mb-4 text-center tracking-tight leading-[1.1] max-w-2xl">
        Can&apos;t start?{' '}
        <span className="text-purple-400">Let&apos;s make the first step small enough.</span>
      </h1>

      <p className="text-base sm:text-lg text-slate-300 mb-10 max-w-xl text-center">
        NeuroNest helps you move from stuck to started — one tiny, realistic action at a time.
        No giant task lists. No broken streaks. No guilt.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Primary CTA - Help me start (no login needed) */}
        <Link
          href="/rescue"
          className="w-full min-h-[48px] py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <Sparkles size={22} />
          Help me start
        </Link>

        {/* Secondary CTA - Sign Up */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-950 px-3 text-slate-500">or create an account</span>
          </div>
        </div>

        <GoogleSignInButton mode="signup" className="!bg-white !hover:bg-gray-50 !text-gray-900 !border-gray-300 min-h-[44px]" />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm pt-2">
          <Link
            href="/signup"
            className="text-purple-300 hover:text-white font-medium transition text-center underline min-h-[44px] flex items-center justify-center"
          >
            Sign up with email
          </Link>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <Link
            href="/login"
            className="text-purple-300 hover:text-white font-medium transition text-center underline min-h-[44px] flex items-center justify-center"
          >
            Already have an account?
          </Link>
        </div>
      </div>

      <div className="mt-12 sm:mt-16 text-sm text-slate-500 text-center max-w-md">
        <p className="mb-2">No account needed to start a rescue session.</p>
        <p>Built for minds that know what to do but need help beginning.</p>
      </div>
    </div>
  )
}

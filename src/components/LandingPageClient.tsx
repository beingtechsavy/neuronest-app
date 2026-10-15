'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { Sparkles } from 'lucide-react';
import NeuroNestMark from '@/components/NeuroNestMark';

export default function LandingPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace('/rescue');
      else setLoading(false);
    };
    void checkAuthStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white" aria-live="polite">
        <NeuroNestMark size={64} className="mb-4" />
        <span className="text-slate-400">Loading NeuroNest…</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-center px-4 sm:px-6 py-8 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <NeuroNestMark size={92} className="mb-6" />

      <h1 className="text-[clamp(1.85rem,6vw,3.25rem)] font-extrabold mb-4 text-center tracking-tight leading-[1.1] max-w-2xl">
        Can&apos;t start the task?
        <span className="block text-purple-400">Get one small next action and begin.</span>
      </h1>

      <p className="text-base sm:text-lg text-slate-300 mb-10 max-w-xl text-center">
        Describe what you&apos;re trying to start, tell NeuroNest what is making it difficult, and get a realistic first step. No account required.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link href="/rescue" className="w-full min-h-[48px] py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2">
          <Sparkles size={22} />
          Give me my first step
        </Link>

        <Link href="/features" className="w-full min-h-[44px] py-3 px-6 border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-white rounded-xl transition-all text-center">
          See how it works
        </Link>

        <div className="relative mt-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-slate-950 px-3 text-slate-500">or create an account</span></div>
        </div>

        <GoogleSignInButton mode="signup" className="!bg-white !hover:bg-gray-50 !text-gray-900 !border-gray-300 min-h-[44px]" />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm pt-2">
          <Link href="/signup" className="text-purple-300 hover:text-white font-medium transition text-center underline min-h-[44px] flex items-center justify-center">Sign up with email</Link>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <Link href="/login" className="text-purple-300 hover:text-white font-medium transition text-center underline min-h-[44px] flex items-center justify-center">Already have an account?</Link>
        </div>
      </div>

      <div className="mt-12 sm:mt-16 text-sm text-slate-500 text-center max-w-md">
        <p className="mb-2">No account needed to start a Rescue session.</p>
        <p>For the moment when you know what to do but cannot begin.</p>
      </div>
    </div>
  );
}

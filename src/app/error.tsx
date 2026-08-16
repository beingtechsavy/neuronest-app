'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console / error monitoring
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={32} className="text-red-400" />
      </div>

      <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Something went wrong</h1>
      <p className="text-slate-400 text-base max-w-md mb-8">
        An unexpected error occurred. Don&apos;t worry — your progress is safe. Try reloading or return home.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all"
        >
          <RotateCcw size={18} />
          Try Again
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
        >
          <Home size={18} />
          Go Home
        </Link>
      </div>
    </main>
  );
}

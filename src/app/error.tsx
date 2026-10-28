'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button, IconBadge, buttonClass } from '@/components/ui';

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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#1E1F22] px-4 py-12 text-center">
      <IconBadge tone="danger" size="lg" className="mb-6">
        <AlertTriangle size={24} aria-hidden="true" />
      </IconBadge>

      <h1 className="mb-3 text-2xl font-bold tracking-tight text-[#F2F3F5] sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mb-8 max-w-md text-base leading-relaxed text-[#949BA4]">
        This is a fault on our side, not something you did. Your saved sessions are safe.
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row">
        <Button size="lg" onClick={() => reset()}>
          <RotateCcw size={18} aria-hidden="true" />
          Try again
        </Button>
        <Link href="/" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
          <Home size={18} aria-hidden="true" />
          Go home
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-[#6E747B]">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </main>
  );
}

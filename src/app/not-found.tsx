import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { IconBadge, buttonClass } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#1E1F22] px-4 py-12 text-center">
      <IconBadge tone="brand" size="lg" className="mb-6">
        <HelpCircle size={24} aria-hidden="true" />
      </IconBadge>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#949BA4]">
        Error 404
      </p>
      <h1 className="mb-3 text-2xl font-bold tracking-tight text-[#F2F3F5] sm:text-3xl">
        This page doesn&apos;t exist
      </h1>
      <p className="mb-8 max-w-md text-base leading-relaxed text-[#949BA4]">
        The link may be old, or the page may have moved. Nothing you were doing is lost.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonClass({ size: 'lg' })}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to home
        </Link>
        <Link href="/rescue" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
          Start a rescue
        </Link>
      </div>
    </main>
  );
}

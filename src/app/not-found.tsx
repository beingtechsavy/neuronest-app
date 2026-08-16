import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center mb-6">
        <HelpCircle size={32} className="text-purple-400" />
      </div>

      <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">404 — Page Not Found</h1>
      <p className="text-slate-400 text-base max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all"
      >
        <ArrowLeft size={18} />
        Back to Home
      </Link>
    </main>
  );
}

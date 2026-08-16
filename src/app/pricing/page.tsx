'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-4">Simple, honest pricing</h1>
        <p className="text-slate-400 text-lg mb-12">Start free. Upgrade when you need more.</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-2">Free</h2>
            <p className="text-3xl font-bold mb-1">$0<span className="text-base font-normal text-slate-400">/month</span></p>
            <p className="text-slate-400 text-sm mb-6">Get started with the basics</p>
            <ul className="space-y-3 mb-8">
              {['3 AI breakdowns per day', '3 projects', '30 tasks', 'Basic focus timer'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                  <Check size={16} className="text-green-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition text-center">
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-gradient-to-b from-purple-900/30 to-slate-900 border border-purple-500/30 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles size={12} /> MOST VALUE
            </div>
            <h2 className="text-xl font-semibold mb-2">Pro</h2>
            <p className="text-3xl font-bold mb-1">$9<span className="text-base font-normal text-slate-400">/month</span></p>
            <p className="text-slate-400 text-sm mb-6">Everything you need to stay on top</p>
            <ul className="space-y-3 mb-8">
              {['Unlimited AI breakdowns', 'Unlimited projects & tasks', 'Smart Daily Planner', 'Weekly insights', 'Customizable focus timer', 'Full task history'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                  <Check size={16} className="text-purple-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button disabled className="block w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg transition text-center cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          30-day money-back guarantee. Cancel anytime. No questions asked.
        </p>
      </div>
    </div>
  );
}

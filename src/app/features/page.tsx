'use client';

import Link from 'next/link';
import { Sparkles, Calendar, BarChart3, Timer, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: <Sparkles className="text-purple-400" size={28} />,
    title: 'AI Task Breakdown',
    description: 'Describe any overwhelming task and our AI breaks it into clear, manageable steps with time estimates and priorities.',
  },
  {
    icon: <Calendar className="text-blue-400" size={28} />,
    title: 'Smart Daily Planner',
    description: 'AI reads your open tasks and deadlines, then generates an optimized daily plan — so you always know what to do next.',
  },
  {
    icon: <BarChart3 className="text-green-400" size={28} />,
    title: 'Weekly Insights',
    description: 'Track your completed tasks, productive patterns, and progress over time. See how much you actually accomplish.',
  },
  {
    icon: <Timer className="text-amber-400" size={28} />,
    title: 'Focus Timer',
    description: 'Simple, distraction-free timer for deep work sessions. 25, 50, or 90 minute blocks — pick what works for you.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">How NeuroNest Works</h1>
        <p className="text-slate-400 text-lg text-center mb-12 max-w-2xl mx-auto">
          Your AI-powered productivity co-pilot. Break down tasks, plan your day, and track your progress — all in one place.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((f) => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
          <p className="text-slate-500 text-sm mt-3">No credit card required</p>
        </div>
      </div>
    </div>
  );
}
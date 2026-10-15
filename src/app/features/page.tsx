import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Calendar, BarChart3, Timer, ArrowRight, RotateCcw } from 'lucide-react';

const features = [
  {
    icon: <Sparkles className="text-purple-400" size={28} />,
    title: 'Rescue a stuck task',
    description: 'Describe the task you are resisting and get one small, realistic next action before you create a plan or project.',
  },
  {
    icon: <RotateCcw className="text-blue-400" size={28} />,
    title: 'Adapt without guilt',
    description: 'If the first action is too hard or does not feel right, make it smaller or try another approach while keeping the history.',
  },
  {
    icon: <Calendar className="text-green-400" size={28} />,
    title: 'Continue into your workspace',
    description: 'After you begin, save the next steps to your Inbox or optionally organize them in projects and schedules.',
  },
  {
    icon: <BarChart3 className="text-amber-400" size={28} />,
    title: 'Use AI when the task is larger',
    description: 'Generate a fair-use AI breakdown when a task needs more structure, without making project setup a prerequisite.',
  },
];

export const metadata: Metadata = {
  title: 'How NeuroNest Works — Rescue a stuck task and begin',
  description: 'See how NeuroNest turns a resisted task into one small next action, adapts it when needed, and continues into your workspace.',
  alternates: { canonical: 'https://www.neuronest.work/features' },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">How NeuroNest Works</h1>
        <p className="text-slate-400 text-lg text-center mb-12 max-w-2xl mx-auto">
          Start with the moment of resistance. Rescue one task, adapt the next action, then use planning and AI only when they help.
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

'use client';

import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import AIBreakdownModal from '@/components/AIBreakdownModal';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function AIBreakdownPage() {
  const user = useUser();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleBreakdownComplete = () => {
    // Redirect to dashboard after successful breakdown
    router.push('/dashboard');
  };

  const handleClose = () => {
    // Go back to dashboard when modal is closed
    router.push('/dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to use AI Breakdown</h1>
          <button
            onClick={() => router.push('/login')}
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-slate-400" size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={16} />
              </div>
              <h1 className="text-xl font-semibold text-white">AI Task Breakdown</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Turn Overwhelming Tasks into Easy Steps
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Our AI understands ADHD brains and breaks down any task into manageable, 
            momentum-building micro-steps that actually get done.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🟢</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Start Easy</h3>
            <p className="text-slate-400 text-sm">
              Always begins with simple 5-10 minute tasks to overcome executive dysfunction
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-purple-400" size={24} />
            </div>
            <h3 className="font-semibold text-white mb-2">ADHD-Optimized</h3>
            <p className="text-slate-400 text-sm">
              Designed specifically for how ADHD brains work - no overwhelm, just progress
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Auto-Organized</h3>
            <p className="text-slate-400 text-sm">
              Automatically saves to your subjects and creates trackable tasks
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 mx-auto shadow-xl"
          >
            <Sparkles size={24} />
            <span className="text-lg">Start Breaking Down Tasks</span>
          </button>
        </div>
      </div>

      {/* AI Breakdown Modal */}
      <AIBreakdownModal
        isOpen={isModalOpen}
        onClose={handleClose}
        userId={user.id}
        onBreakdownComplete={handleBreakdownComplete}
      />
    </div>
  );
}
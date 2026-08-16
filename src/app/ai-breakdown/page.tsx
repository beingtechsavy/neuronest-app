'use client';

import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import AIBreakdownModal from '@/components/AIBreakdownModal';
import BreakdownListView from '@/components/BreakdownListView';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function AIBreakdownPage() {
  const user = useUser();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBreakdownComplete = () => {
    // Close modal and stay on page to see the updated list
    setIsModalOpen(false);
  };

  const handleClose = () => {
    // Just close the modal, stay on the page
    setIsModalOpen(false);
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Prominent CTA Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Sparkles className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Get AI Assistance NOW
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
              Turn overwhelming tasks into clear, actionable steps. 
              Our AI breaks down any task into momentum-building micro-steps.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-3 shadow-2xl"
            >
              <Sparkles size={28} />
              <span>Break Down a Task</span>
            </button>
          </div>
        </div>

        {/* Breakdown List Section */}
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">Your AI Breakdowns</h3>
            <p className="text-slate-400">
              View and manage all your previous task breakdowns
            </p>
          </div>
          <BreakdownListView userId={user.id} />
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
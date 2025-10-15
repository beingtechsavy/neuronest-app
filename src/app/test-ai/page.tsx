'use client';

import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import AIBreakdownModal from '@/components/AIBreakdownModal';
import { Sparkles } from 'lucide-react';

export default function TestAIPage() {
  const user = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testTask, setTestTask] = useState({
    title: 'Write a 5-page research paper on climate change',
    description: 'Need to research, outline, and write a comprehensive paper for environmental science class',
    deadline: 'Next Friday',
    subject: 'Environmental Science'
  });

  const handleBreakdownComplete = (breakdown: any[]) => {
    console.log('AI Breakdown completed:', breakdown);
    alert(`Generated ${breakdown.length} steps! Check console for details.`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to test AI features</h1>
          <a href="/login" className="text-purple-400 hover:text-purple-300 underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧠 AI Breakdown Test Page
          </h1>
          <p className="text-slate-300 text-lg">
            Test the AI task breakdown feature before integrating it fully
          </p>
        </div>

        {/* Test Task Card */}
        <div className="bg-slate-800 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Test Task</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Task Title
              </label>
              <input
                type="text"
                value={testTask.title}
                onChange={(e) => setTestTask({...testTask, title: e.target.value})}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={testTask.subject}
                onChange={(e) => setTestTask({...testTask, subject: e.target.value})}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={testTask.description}
              onChange={(e) => setTestTask({...testTask, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Deadline
            </label>
            <input
              type="text"
              value={testTask.deadline}
              onChange={(e) => setTestTask({...testTask, deadline: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="e.g., Next Friday, In 3 days, March 15th"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-3 text-lg"
          >
            <Sparkles size={24} />
            Test AI Breakdown
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">
            🧪 Testing Instructions
          </h3>
          <div className="space-y-3 text-blue-300">
            <p>
              <strong>1. Setup Required:</strong> Make sure you've added Azure OpenAI credentials to your .env.local file
            </p>
            <p>
              <strong>2. Database:</strong> Run the SQL schema in your Supabase SQL editor
            </p>
            <p>
              <strong>3. Test:</strong> Click the button above to test the AI breakdown
            </p>
            <p>
              <strong>4. Check:</strong> Results will appear in the modal and console
            </p>
            <p>
              <strong>5. Verify:</strong> Check your Supabase tables for usage tracking
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="mt-8 text-center text-slate-400">
          <p>Logged in as: {user.email}</p>
          <p>User ID: {user.id}</p>
        </div>
      </div>

      {/* AI Breakdown Modal */}
      <AIBreakdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskTitle={testTask.title}
        taskDescription={testTask.description}
        taskDeadline={testTask.deadline}
        taskSubject={testTask.subject}
        userId={user.id}
        onBreakdownComplete={handleBreakdownComplete}
      />
    </div>
  );
}
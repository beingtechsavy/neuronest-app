'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface LoadingProgressProps {
  isLoading: boolean;
  hasData: boolean;
}

export default function LoadingProgress({ isLoading, hasData }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing...');

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setStage('Complete');
      return;
    }

    const stages = [
      { progress: 20, text: 'Loading task data...' },
      { progress: 40, text: 'Calculating completion rates...' },
      { progress: 60, text: 'Analyzing study patterns...' },
      { progress: 80, text: 'Generating insights...' },
      { progress: 100, text: 'Finalizing dashboard...' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setProgress(stages[currentStage].progress);
        setStage(stages[currentStage].text);
        currentStage++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading && hasData) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <TrendingUp className="mx-auto mb-4 text-purple-400 animate-pulse" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Loading Analytics</h3>
          <p className="text-slate-400 text-sm">Analyzing your study data...</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-300">{stage}</span>
            <span className="text-sm text-purple-400">{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Fun Facts */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            💡 Did you know? Students who track their progress are 40% more likely to achieve their goals!
          </p>
        </div>
      </div>
    </div>
  );
}
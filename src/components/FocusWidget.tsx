'use client';

import React, { useState } from 'react';
import { Brain, Headphones, Wind, Eye, Play, Settings } from 'lucide-react';
import Link from 'next/link';

interface FocusWidgetProps {
  className?: string;
}

const FocusWidget: React.FC<FocusWidgetProps> = ({ className = '' }) => {
  const [activeFeatures, setActiveFeatures] = useState({
    sounds: false,
    breathing: false,
    eyeCare: true
  });

  const toggleFeature = (feature: keyof typeof activeFeatures) => {
    setActiveFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const activeCount = Object.values(activeFeatures).filter(Boolean).length;

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">Focus Suite</span>
        </div>
        <Link 
          href="/focus"
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Full Suite
        </Link>
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-white mb-1">
          {activeCount}/3
        </div>
        <div className="text-xs text-slate-400">
          Active Tools
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="space-y-2 mb-4">
        <button
          onClick={() => toggleFeature('sounds')}
          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
            activeFeatures.sounds
              ? 'bg-blue-900/30 border border-blue-700 text-blue-300'
              : 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-slate-300'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span className="text-sm">Ambient Sounds</span>
          <div className={`ml-auto w-2 h-2 rounded-full ${
            activeFeatures.sounds ? 'bg-blue-400' : 'bg-slate-500'
          }`} />
        </button>

        <button
          onClick={() => toggleFeature('breathing')}
          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
            activeFeatures.breathing
              ? 'bg-green-900/30 border border-green-700 text-green-300'
              : 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-slate-300'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span className="text-sm">Breathing</span>
          <div className={`ml-auto w-2 h-2 rounded-full ${
            activeFeatures.breathing ? 'bg-green-400' : 'bg-slate-500'
          }`} />
        </button>

        <button
          onClick={() => toggleFeature('eyeCare')}
          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
            activeFeatures.eyeCare
              ? 'bg-purple-900/30 border border-purple-700 text-purple-300'
              : 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-slate-300'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm">Eye Care</span>
          <div className={`ml-auto w-2 h-2 rounded-full ${
            activeFeatures.eyeCare ? 'bg-purple-400' : 'bg-slate-500'
          }`} />
        </button>
      </div>

      {/* Quick Action */}
      <Link
        href="/focus"
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
      >
        <Play className="w-4 h-4" />
        Start Focus Session
      </Link>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Today&apos;s Focus</span>
          <span>2h 15m</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
          <div className="bg-blue-400 h-1 rounded-full w-3/4" />
        </div>
      </div>
    </div>
  );
};

export default FocusWidget;
'use client';

import { useState } from 'react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import ADHDAnalyticsDashboard from '@/components/analytics/ADHDAnalyticsDashboard';
import JobsAnalyticsDashboard from '@/components/analytics/JobsAnalyticsDashboard';
import AnalyticsDebugger from '@/components/analytics/AnalyticsDebugger';
import { Brain, BarChart3, Bug } from 'lucide-react';

export default function AnalyticsPage() {
  const [useADHDView, setUseADHDView] = useState(true);
  const [showDebugger, setShowDebugger] = useState(false);
  
  // Only show debug in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* View Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-1 flex">
          <button
            onClick={() => { setUseADHDView(true); setShowDebugger(false); }}
            className={`
              px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200
              ${useADHDView && !showDebugger
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }
            `}
          >
            <Brain size={16} />
            Focus View
          </button>
          <button
            onClick={() => { setUseADHDView(false); setShowDebugger(false); }}
            className={`
              px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200
              ${!useADHDView && !showDebugger
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }
            `}
          >
            <BarChart3 size={16} />
            Detailed View
          </button>
          
          {/* Debug button - only in development */}
          {isDevelopment && (
            <button
              onClick={() => { setShowDebugger(true); setUseADHDView(true); }}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200
                ${showDebugger
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              <Bug size={16} />
              Debug
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Content */}
      {showDebugger && isDevelopment ? (
        <AnalyticsDebugger />
      ) : useADHDView ? (
        <ADHDAnalyticsDashboard />
      ) : (
        <JobsAnalyticsDashboard />
      )}
    </main>
  );
}
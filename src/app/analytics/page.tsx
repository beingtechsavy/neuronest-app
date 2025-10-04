'use client';

import { useState } from 'react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import ADHDAnalyticsDashboard from '@/components/analytics/ADHDAnalyticsDashboard';
import JobsAnalyticsDashboard from '@/components/analytics/JobsAnalyticsDashboard';
import { Brain, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const [useADHDView, setUseADHDView] = useState(true);

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* View Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-1 flex">
          <button
            onClick={() => setUseADHDView(true)}
            className={`
              px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200
              ${useADHDView 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }
            `}
          >
            <Brain size={16} />
            Focus View
          </button>
          <button
            onClick={() => setUseADHDView(false)}
            className={`
              px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200
              ${!useADHDView 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }
            `}
          >
            <BarChart3 size={16} />
            Detailed View
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      {useADHDView ? <ADHDAnalyticsDashboard /> : <JobsAnalyticsDashboard />}
    </main>
  );
}
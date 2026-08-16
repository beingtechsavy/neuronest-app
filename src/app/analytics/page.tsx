'use client';

import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 size={24} className="text-purple-400" />
        <h1 className="text-2xl font-bold text-white">Insights</h1>
      </div>
      <AnalyticsDashboard />
    </main>
  );
}
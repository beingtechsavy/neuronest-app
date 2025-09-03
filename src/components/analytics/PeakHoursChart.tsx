'use client';

import { Clock } from 'lucide-react';

interface PeakHoursChartProps {
  peakHours: { hour: number; productivity: number }[];
}

export default function PeakHoursChart({ peakHours }: PeakHoursChartProps) {
  // Filter to reasonable study hours (6 AM to 11 PM)
  const studyHours = peakHours.filter(h => h.hour >= 6 && h.hour <= 23);
  const maxProductivity = Math.max(...studyHours.map(h => h.productivity), 1);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getProductivityColor = (productivity: number) => {
    const intensity = productivity / maxProductivity;
    if (intensity >= 0.8) return 'bg-green-400';
    if (intensity >= 0.6) return 'bg-yellow-400';
    if (intensity >= 0.4) return 'bg-orange-400';
    if (intensity >= 0.2) return 'bg-red-400';
    return 'bg-slate-600';
  };

  const getProductivityLevel = (productivity: number) => {
    const intensity = productivity / maxProductivity;
    if (intensity >= 0.8) return 'Peak';
    if (intensity >= 0.6) return 'High';
    if (intensity >= 0.4) return 'Medium';
    if (intensity >= 0.2) return 'Low';
    return 'Minimal';
  };

  // Find top 3 peak hours
  const topHours = studyHours
    .sort((a, b) => b.productivity - a.productivity)
    .slice(0, 3);

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="text-blue-400" size={20} />
        Peak Study Hours
      </h3>

      {/* Chart */}
      <div className="space-y-4">
        <div className="flex items-end gap-1 h-32">
          {studyHours.map((hourData) => (
            <div key={hourData.hour} className="flex-1 flex flex-col items-center">
              <div className="flex-1 flex items-end w-full">
                <div
                  className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${getProductivityColor(hourData.productivity)}`}
                  style={{
                    height: `${(hourData.productivity / maxProductivity) * 100}%`,
                    minHeight: hourData.productivity > 0 ? '4px' : '2px'
                  }}
                  title={`${formatHour(hourData.hour)}: ${getProductivityLevel(hourData.productivity)} productivity`}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1 transform -rotate-45 origin-top-left">
                {hourData.hour}
              </div>
            </div>
          ))}
        </div>

        {/* Hour labels */}
        <div className="flex justify-between text-xs text-slate-400">
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      {/* Top Hours Summary */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Your Peak Hours</h4>
        <div className="space-y-2">
          {topHours.map((hourData, index) => (
            <div key={hourData.hour} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {formatHour(hourData.hour)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${getProductivityColor(hourData.productivity)}`}
                />
                <span className="text-sm text-slate-300">
                  {getProductivityLevel(hourData.productivity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Schedule your most challenging tasks during your peak hours 
          ({topHours.slice(0, 2).map(h => formatHour(h.hour)).join(' and ')}) 
          for maximum productivity!
        </p>
      </div>
    </div>
  );
}
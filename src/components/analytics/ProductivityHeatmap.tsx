'use client';

import { ProductivityData } from '@/hooks/useAnalytics';
import { Activity } from 'lucide-react';

interface ProductivityHeatmapProps {
  productivityData: ProductivityData[];
}

export default function ProductivityHeatmap({ productivityData }: ProductivityHeatmapProps) {
  // Generate last 12 weeks of data
  const weeks = 12;
  const daysPerWeek = 7;
  
  // Create a map for quick lookup
  const dataMap = new Map(productivityData.map(d => [d.date, d]));
  
  // Generate grid data
  const gridData = Array.from({ length: weeks }, (_, weekIndex) => {
    return Array.from({ length: daysPerWeek }, (_, dayIndex) => {
      const date = new Date();
      date.setDate(date.getDate() - ((weeks - 1 - weekIndex) * 7) + dayIndex - date.getDay());
      const dateStr = date.toISOString().split('T')[0];
      
      return {
        date: dateStr,
        data: dataMap.get(dateStr) || null,
        dayOfWeek: dayIndex,
        weekIndex
      };
    });
  });

  const getIntensityColor = (focusScore: number | null) => {
    if (!focusScore || focusScore === 0) return 'bg-slate-800';
    if (focusScore < 20) return 'bg-green-900/50';
    if (focusScore < 40) return 'bg-green-700/70';
    if (focusScore < 60) return 'bg-green-500/80';
    if (focusScore < 80) return 'bg-green-400/90';
    return 'bg-green-300';
  };

  const formatTooltip = (cellData: any) => {
    const date = new Date(cellData.date);
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (!cellData.data) {
      return `${dateStr}: No activity`;
    }
    
    return `${dateStr}: ${cellData.data.tasksCompleted} tasks, ${cellData.data.timeSpent}min, ${cellData.data.focusScore.toFixed(0)}% focus`;
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels = [];
  
  // Generate month labels
  for (let i = 0; i < weeks; i += 4) {
    const date = new Date();
    date.setDate(date.getDate() - ((weeks - 1 - i) * 7));
    monthLabels.push({
      index: i,
      label: date.toLocaleDateString('en-US', { month: 'short' })
    });
  }

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Activity className="text-green-400" size={20} />
        Productivity Heatmap
      </h3>
      
      <div className="space-y-4">
        {/* Month labels */}
        <div className="flex">
          <div className="w-8"></div> {/* Space for day labels */}
          <div className="flex-1 flex">
            {monthLabels.map(month => (
              <div 
                key={month.index}
                className="text-xs text-slate-400 flex-1"
                style={{ marginLeft: `${(month.index / weeks) * 100}%` }}
              >
                {month.label}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="flex">
          {/* Day labels */}
          <div className="w-8 space-y-1">
            {dayLabels.map((day, index) => (
              <div 
                key={day} 
                className="h-3 flex items-center text-xs text-slate-400"
                style={{ opacity: index % 2 === 0 ? 1 : 0 }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 grid grid-cols-12 gap-1">
            {gridData.map((week, weekIndex) => (
              <div key={weekIndex} className="space-y-1">
                {week.map((cell, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`
                      w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110
                      ${getIntensityColor(cell.data?.focusScore || null)}
                    `}
                    title={formatTooltip(cell)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-800"></div>
            <div className="w-3 h-3 rounded-sm bg-green-900/50"></div>
            <div className="w-3 h-3 rounded-sm bg-green-700/70"></div>
            <div className="w-3 h-3 rounded-sm bg-green-500/80"></div>
            <div className="w-3 h-3 rounded-sm bg-green-400/90"></div>
            <div className="w-3 h-3 rounded-sm bg-green-300"></div>
          </div>
          <span>More</span>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-slate-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-400">
                {productivityData.filter(d => d.tasksCompleted > 0).length}
              </div>
              <div className="text-xs text-slate-400">Active Days</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">
                {productivityData.reduce((sum, d) => sum + d.tasksCompleted, 0)}
              </div>
              <div className="text-xs text-slate-400">Total Tasks</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">
                {productivityData.length > 0 
                  ? (productivityData.reduce((sum, d) => sum + d.focusScore, 0) / productivityData.length).toFixed(0)
                  : 0
                }%
              </div>
              <div className="text-xs text-slate-400">Avg Focus</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
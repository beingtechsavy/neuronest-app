'use client';

import { TaskCompletionStats } from '@/hooks/useAnalytics';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { SectionCard } from '@/components/ui';

export default function CompletionRateCard({ taskStats }: CompletionRateCardProps) {
  const { totalTasks, completedTasks, overdueTasks, onTimeTasks, completionRate } = taskStats;

  const pendingTasks = totalTasks - completedTasks;
  const lateRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;
  const onTimeRate = totalTasks > 0 ? (onTimeTasks / totalTasks) * 100 : 0;

  const tiles = [
    { label: 'Completed', value: completedTasks, icon: CheckCircle, tone: 'text-[#23A55A]' },
    { label: 'Pending', value: pendingTasks, icon: Clock, tone: 'text-[#2DD4BF]' },
    { label: 'Overdue', value: overdueTasks, icon: AlertTriangle, tone: 'text-[#E8A33D]' },
    { label: 'On time', value: onTimeTasks, icon: CheckCircle, tone: 'text-[#2DD4BF]' },
  ];

  return (
    <SectionCard
      title="Task completion"
      description="All tasks you have ever created."
      icon={<CheckCircle size={18} aria-hidden="true" />}
    >
      {totalTasks === 0 ? (
        <div className="py-8 text-center">
          <p className="font-medium text-[#DBDEE1]">No tasks yet</p>
          <p className="mt-1 text-sm text-[#949BA4]">
            Complete a task to start building your progress history.
          </p>
        </div>
      ) : (
        <>
          {/* A ring, not a progress bar: one number is the whole message, and a
              filled circle is read faster than a length. */}
          <div className="mb-6 flex items-center justify-center">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-[#383A40]"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionRate / 100)}`}
                  className="text-[#23A55A] transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums text-[#F2F3F5]">
                    {completionRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-[#949BA4]">complete</p>
                </div>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            {tiles.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-xl border border-[#3F4147] bg-[#1E1F22] p-3 text-center">
                <dt className="mb-1 flex items-center justify-center gap-1.5 text-sm text-[#DBDEE1]">
                  <Icon size={15} className={tone} aria-hidden="true" />
                  {label}
                </dt>
                <dd className={`text-xl font-bold tabular-nums ${tone}`}>{value}</dd>
              </div>
            ))}
          </dl>

          <dl className="mt-4 space-y-2 border-t border-[#383A40] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#949BA4]">On-time completion rate</dt>
              <dd className="font-medium tabular-nums text-[#2DD4BF]">{onTimeRate.toFixed(1)}%</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#949BA4]">Overdue rate</dt>
              <dd className="font-medium tabular-nums text-[#E8A33D]">{lateRate.toFixed(1)}%</dd>
            </div>
          </dl>
        </>
      )}
    </SectionCard>
  );
}

interface CompletionRateCardProps {
  taskStats: TaskCompletionStats;
}

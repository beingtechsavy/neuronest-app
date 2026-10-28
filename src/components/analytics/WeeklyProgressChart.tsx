'use client';

import { WeeklyProgress } from '@/hooks/useAnalytics';
import { TrendingUp, Calendar } from 'lucide-react';
import { SectionCard } from '@/components/ui';

export default function WeeklyProgressChart({ weeklyProgress }: WeeklyProgressChartProps) {
  if (weeklyProgress.length === 0) {
    return (
      <SectionCard
        title="Weekly progress"
        description="Completed tasks and focus time, week by week."
        icon={<TrendingUp size={18} aria-hidden="true" />}
      >
        <div className="py-8 text-center">
          <Calendar className="mx-auto mb-3 text-[#949BA4]" size={32} aria-hidden="true" />
          <p className="text-sm text-[#949BA4]">No progress data available yet.</p>
        </div>
      </SectionCard>
    );
  }

  const maxTasks = Math.max(...weeklyProgress.map(w => w.tasksCompleted), 1);
  const maxTime = Math.max(...weeklyProgress.map(w => w.timeSpent), 1);

  const formatWeekLabel = (weekStart: string) => {
    const date = new Date(weekStart);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'bg-[#23A55A]';
    if (rate >= 60) return 'bg-[#E8A33D]';
    if (rate >= 40) return 'bg-[#E8A33D]';
    return 'bg-[#ED4245]';
  };

  const totals = weeklyProgress.reduce(
    (sum, w) => ({
      tasks: sum.tasks + w.tasksCompleted,
      hours: sum.hours + w.timeSpent,
      rate: sum.rate + w.completionRate,
    }),
    { tasks: 0, hours: 0, rate: 0 },
  );
  const avgRate = totals.rate / weeklyProgress.length;

  return (
    <SectionCard
      title="Weekly progress"
      description="Completed tasks and focus time, week by week."
      icon={<TrendingUp size={18} aria-hidden="true" />}
    >
      <div className="space-y-6">
        {/* Bars are labelled by a value under each column, so the height is a
            secondary cue rather than the only one. */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-[#DBDEE1]">Tasks completed</h4>
          <div className="flex h-32 items-end gap-2" role="img" aria-label="Tasks completed per week">
            {weeklyProgress.map((week) => (
              <div key={week.weekStart} className="flex flex-1 flex-col items-center">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-[#2DD4BF] transition-colors hover:bg-[#5EEAD4] motion-reduce:transition-none"
                    style={{
                      height: `${(week.tasksCompleted / maxTasks) * 100}%`,
                      minHeight: week.tasksCompleted > 0 ? '4px' : '0px',
                    }}
                    title={`${week.tasksCompleted} tasks completed`}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-[#949BA4] tabular-nums">
                  {formatWeekLabel(week.weekStart)}
                </p>
                <p className="text-xs font-medium tabular-nums text-[#2DD4BF]">{week.tasksCompleted}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium text-[#DBDEE1]">Focus time (minutes)</h4>
          <div className="flex h-32 items-end gap-2" role="img" aria-label="Focus minutes per week">
            {weeklyProgress.map((week) => (
              <div key={`time-${week.weekStart}`} className="flex flex-1 flex-col items-center">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-[#2DD4BF] transition-colors hover:bg-[#5EEAD4] motion-reduce:transition-none"
                    style={{
                      height: `${(week.timeSpent / maxTime) * 100}%`,
                      minHeight: week.timeSpent > 0 ? '4px' : '0px',
                    }}
                    title={`${week.timeSpent} minutes studied`}
                  />
                </div>
                <p className="mt-2 text-xs font-medium tabular-nums text-[#2DD4BF]">
                  {Math.round(week.timeSpent)}m
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium text-[#DBDEE1]">Completion rate</h4>
          <div className="space-y-2">
            {weeklyProgress.map((week) => (
              <div key={`rate-${week.weekStart}`} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-xs text-[#949BA4] tabular-nums">
                  {formatWeekLabel(week.weekStart)}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#383A40]">
                  <div
                    className={`h-full rounded-full motion-reduce:transition-none ${getCompletionColor(week.completionRate)}`}
                    style={{ width: `${week.completionRate}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-[#F2F3F5]">
                  {week.completionRate.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-[#383A40] pt-4 text-center">
        <div>
          <dd className="text-lg font-bold tabular-nums text-[#2DD4BF]">{totals.tasks}</dd>
          <dt className="text-xs text-[#949BA4]">Total tasks</dt>
        </div>
        <div>
          <dd className="text-lg font-bold tabular-nums text-[#2DD4BF]">
            {Math.round(totals.hours / 60)}h
          </dd>
          <dt className="text-xs text-[#949BA4]">Total hours</dt>
        </div>
        <div>
          <dd className="text-lg font-bold tabular-nums text-[#23A55A]">{avgRate.toFixed(0)}%</dd>
          <dt className="text-xs text-[#949BA4]">Avg rate</dt>
        </div>
      </dl>
    </SectionCard>
  );
}

interface WeeklyProgressChartProps {
  weeklyProgress: WeeklyProgress[];
}

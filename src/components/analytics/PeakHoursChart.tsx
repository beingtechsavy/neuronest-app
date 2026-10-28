'use client';

import { Clock } from 'lucide-react';
import { CardInset, SectionCard } from '@/components/ui';

interface PeakHoursChartProps {
  peakHours: { hour: number; productivity: number }[];
}

export default function PeakHoursChart({ peakHours }: PeakHoursChartProps) {
  // Filter to reasonable study hours (6 AM to 11 PM)
  const studyHours = peakHours.filter(h => h.hour >= 6 && h.hour <= 23);

  if (studyHours.length < 1) {
    return (
      <SectionCard
        title="Peak productivity hours"
        description="When you actually finish things."
        icon={<Clock size={18} aria-hidden="true" />}
      >
        <div className="py-8 text-center">
          <p className="text-sm text-[#DBDEE1]">Not enough completed activity to show a pattern yet.</p>
          <p className="mt-1 text-sm text-[#949BA4]">
            Finish at least three scheduled tasks with completion times and this fills in.
          </p>
        </div>
      </SectionCard>
    );
  }

  const maxProductivity = Math.max(...studyHours.map(h => h.productivity), 1);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // One hue at four step values, instead of four unrelated status colours. A
  // red bar next to a green bar looked like success/failure when it only meant
  // "fewer tasks finished at 9am than at 7pm".
  const getProductivityColor = (productivity: number) => {
    const intensity = productivity / maxProductivity;
    if (intensity >= 0.8) return 'bg-[#2DD4BF]';
    if (intensity >= 0.6) return 'bg-[#2DD4BF]/70';
    if (intensity >= 0.4) return 'bg-[#2DD4BF]/45';
    if (intensity >= 0.2) return 'bg-[#2DD4BF]/25';
    return 'bg-[#383A40]';
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
  const topHours = [...studyHours].sort((a, b) => b.productivity - a.productivity).slice(0, 3);

  return (
    <SectionCard
      title="Peak productivity hours"
      description="When you actually finish things."
      icon={<Clock size={18} aria-hidden="true" />}
    >
      {/* Horizontal bars: the hour labels stay level, which the old rotated
          45° axis did not, and each row is a readable label + length + value. */}
      <ul className="space-y-1.5">
        {studyHours.map((hourData) => (
          <li key={hourData.hour} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-xs text-[#949BA4] tabular-nums">
              {formatHour(hourData.hour)}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#383A40]">
              <div
                className={`h-full rounded-full ${getProductivityColor(hourData.productivity)}`}
                style={{ width: `${(hourData.productivity / maxProductivity) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-[#949BA4]">
              {getProductivityLevel(hourData.productivity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-[#383A40] pt-4">
        <h4 className="mb-3 text-sm font-medium text-[#DBDEE1]">Your peak hours</h4>
        <ol className="space-y-2">
          {topHours.map((hourData, index) => (
            <li key={hourData.hour} className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="w-4 text-sm font-semibold tabular-nums text-[#6E747B]">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-[#F2F3F5]">{formatHour(hourData.hour)}</span>
              </span>
              <span className="flex items-center gap-2 text-sm text-[#DBDEE1]">
                <span
                  className={`h-2 w-2 rounded-full ${getProductivityColor(hourData.productivity)}`}
                  aria-hidden="true"
                />
                {getProductivityLevel(hourData.productivity)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <CardInset className="mt-4 border-l-2 border-l-[#14B8A6]">
        <p className="text-sm leading-relaxed text-[#DBDEE1]">
          Your hardest tasks are most likely to start around{' '}
          <strong className="font-semibold text-[#F2F3F5]">
            {topHours.slice(0, 2).map(h => formatHour(h.hour)).join(' and ')}
          </strong>
          .
        </p>
      </CardInset>
    </SectionCard>
  );
}

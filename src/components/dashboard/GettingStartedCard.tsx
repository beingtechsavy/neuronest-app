'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, ListChecks, Moon, X } from 'lucide-react';
import { Card } from '@/components/ui';
import { dismissGuide, isGuideDismissed } from '@/lib/guideState';

const steps = [
  {
    href: '/settings',
    icon: Moon,
    title: 'Set sleep & meal times',
    body: 'The planner treats these hours as already taken.',
  },
  {
    href: '/tasks',
    icon: ListChecks,
    title: 'Add your first task',
    body: 'Or split a big one with AI breakdown.',
  },
  {
    href: '/calendar',
    icon: CalendarDays,
    title: 'Schedule your week',
    body: 'Auto-schedule, or drag tasks into free time.',
  },
];

/**
 * First-run orientation. Shown once per browser until dismissed; the full
 * walkthrough stays reachable at /guide from the sidebar.
 */
export default function GettingStartedCard() {
  const [visible, setVisible] = useState(false);

  // Read after mount: the server has no localStorage, and rendering the card
  // during hydration would mismatch for users who already dismissed it.
  useEffect(() => {
    if (!isGuideDismissed()) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <Card className="mb-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#14B8A6]">
            New here?
          </p>
          <h2 className="text-lg font-bold tracking-tight text-[#F2F3F5]">
            Three steps to a week that fits
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#949BA4]">
            Each one takes a minute. You can skip any of them and come back later.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            dismissGuide();
            setVisible(false);
          }}
          aria-label="Dismiss getting started"
          className="-mr-2 -mt-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-[#949BA4] transition-colors hover:bg-[#383A40] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className="group flex h-full flex-col rounded-xl border border-[#3F4147] bg-[#1E1F22] p-4 transition-colors hover:border-[#14B8A6]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
              >
                <span className="mb-3 flex items-center gap-2 text-[#2DD4BF]">
                  <Icon size={18} aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#949BA4]">
                    {index + 1}
                  </span>
                </span>
                <span className="mb-1 text-sm font-semibold text-[#F2F3F5]">{step.title}</span>
                <span className="text-sm leading-relaxed text-[#949BA4]">{step.body}</span>
                <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#5EEAD4] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  Open <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <Link
        href="/guide"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2DD4BF] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] rounded"
      >
        <BookOpen size={16} aria-hidden="true" />
        Read the full walkthrough
      </Link>
    </Card>
  );
}

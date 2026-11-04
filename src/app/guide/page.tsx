import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  CalendarDays,
  LifeBuoy,
  ListChecks,
  Moon,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { Card, CardInset, IconBadge, PageHeader, PageShell, buttonClass } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Walkthrough — NeuroNest',
};

type Step = {
  icon: ReactNode;
  title: string;
  body: string;
  why: string;
  example: ReactNode;
  action: { href: string; label: string };
  secondary?: { href: string; label: string; icon: ReactNode };
};

/**
 * In-app walkthrough.
 *
 * Deliberately static: a guided tour that highlights live controls breaks on
 * every layout change and interrupts the one screen a stuck user is trying to
 * use. This is a page they can read once, return to from the sidebar, and leave.
 * Same reading rhythm as /features: one idea per step, an example, one action.
 */
const steps: Step[] = [
  {
    icon: <Moon size={20} aria-hidden="true" />,
    title: 'Set your sleep and meal times',
    body: 'Open Settings and tell NeuroNest when you sleep and when you eat. These are not reminders — they are the hours the planner treats as already taken.',
    why: 'The calendar paints sleep as a shaded block and never auto-schedules a task at 2am or over lunch. Without this, every schedule it builds is fiction.',
    example: (
      <div className="space-y-1 text-sm text-[#DBDEE1]">
        <p><span className="text-[#949BA4]">Sleep</span> · 23:00 → 07:00</p>
        <p><span className="text-[#949BA4]">Meals</span> · 08:00, 13:00, 19:00 · 45 min each</p>
        <p><span className="text-[#949BA4]">Focus block</span> · 50 min, 10 min buffer</p>
      </div>
    ),
    action: { href: '/settings', label: 'Open settings' },
  },
  {
    icon: <ListChecks size={20} aria-hidden="true" />,
    title: 'Add the task, not the plan',
    body: 'A task with a title and an honest duration is enough. Projects are optional containers — use one when you have several tasks that belong together.',
    why: 'A vague or oversized task is the thing that stalls you later, not the lack of a system. If it feels too big to start, break it down instead of scheduling it.',
    example: (
      <div className="space-y-1 text-sm text-[#DBDEE1]">
        <p><span className="text-[#949BA4]">Instead of</span> · “Do the biology paper”</p>
        <p><span className="text-[#949BA4]">Write</span> · “Draft the intro paragraph” · 25 min</p>
      </div>
    ),
    action: { href: '/tasks', label: 'Open tasks' },
    secondary: { href: '/ai-breakdown', label: 'Break one down', icon: <Sparkles size={16} aria-hidden="true" /> },
  },
  {
    icon: <CalendarDays size={20} aria-hidden="true" />,
    title: 'Give it a place in the week',
    body: 'Auto-schedule drops everything waiting in your inbox into the free gaps between sleep, meals and existing work. Nothing to arrange by hand.',
    why: 'Time blindness makes a free day look infinite. Seeing the week as a grid — including the hours that are genuinely already gone — is what makes a plan believable.',
    example: (
      <div className="space-y-1 text-sm text-[#DBDEE1]">
        <p><span className="text-[#949BA4]">Drag</span> a task up or down to change its time</p>
        <p><span className="text-[#949BA4]">Drag</span> it sideways to change the day</p>
        <p><span className="text-[#949BA4]">Drag</span> to the left or right edge to push it a week</p>
      </div>
    ),
    action: { href: '/calendar', label: 'Open calendar' },
  },
  {
    icon: <LifeBuoy size={20} aria-hidden="true" />,
    title: 'When you still cannot start',
    body: 'A plan does not fix initiation. Rescue takes the task you are avoiding and gives you one action small enough to begin with right now.',
    why: 'One 5-minute action beats a well-organised afternoon you never begin. If the first step is still too hard, say so — you get a smaller one, not a lecture.',
    example: (
      <div className="rounded-lg border border-[#14B8A6]/30 bg-[#14B8A6]/10 p-3 text-sm leading-relaxed text-[#F2F3F5]">
        Open the document and write the one sentence you already know belongs in it.
      </div>
    ),
    action: { href: '/rescue', label: 'Try a rescue' },
  },
];

export default function GuidePage() {
  return (
    <PageShell width="default">
      <PageHeader
        eyebrow="Walkthrough"
        title="How to use NeuroNest"
        description="Four steps, in order. Each one takes a couple of minutes and makes the next one work better. Nothing here is a tutorial you have to sit through — come back to this page whenever you need it."
      />

      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Card as="article">
              <div className="flex items-start gap-4">
                <IconBadge tone="neutral" size="md" className="mt-0.5">
                  {step.icon}
                </IconBadge>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#949BA4]">
                    Step {index + 1}
                  </p>
                  <h2 className="mb-2 mt-0.5 text-base font-semibold text-[#F2F3F5] sm:text-lg">
                    {step.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#DBDEE1] sm:text-base">
                    {step.body}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#949BA4]">
                    {step.why}
                  </p>

                  <CardInset className="mt-4">{step.example}</CardInset>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link href={step.action.href} className={buttonClass({ size: 'md' })}>
                      {step.action.label}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    {step.secondary && (
                      <Link
                        href={step.secondary.href}
                        className={buttonClass({ variant: 'secondary', size: 'md' })}
                      >
                        {step.secondary.icon}
                        {step.secondary.label}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <section aria-labelledby="loop" className="mt-10 border-t border-[#383A40] pt-8">
        <h2 id="loop" className="mb-3 text-lg font-bold tracking-tight text-[#F2F3F5]">
          The loop, in one line
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[#DBDEE1] sm:text-base">
          Set the hours you actually keep → capture what is on your mind → let the week hold
          it → when it stalls, shrink the first step instead of the goal.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[#949BA4]">
          <Moon size={16} aria-hidden="true" />
          <Chevron />
          <ListChecks size={16} aria-hidden="true" />
          <Chevron />
          <CalendarDays size={16} aria-hidden="true" />
          <Chevron />
          <LifeBuoy size={16} aria-hidden="true" />
          <span className="ml-1">Repeat as needed. None of it is undone by a bad day.</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-[#949BA4]">
          <Utensils size={16} aria-hidden="true" />
          <span>Meals and sleep are adjustable any time in Settings — the calendar re-plans around them.</span>
        </div>
      </section>
    </PageShell>
  );
}

function Chevron() {
  return <ArrowRight size={14} className="text-[#5C6167]" aria-hidden="true" />;
}

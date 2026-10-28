import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Calendar, BarChart3, RotateCcw, ArrowRight, Timer, ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Card, IconBadge, buttonClass } from '@/components/ui';

const features = [
  {
    icon: <Sparkles size={20} aria-hidden="true" />,
    tone: 'brand' as const,
    title: 'Rescue a stuck task',
    description: 'Describe the task you are resisting and get one small, realistic next action — before you create a plan or a project.',
  },
  {
    icon: <RotateCcw size={20} aria-hidden="true" />,
    tone: 'brand' as const,
    title: 'Adapt without guilt',
    description: 'If the first action is too hard or does not feel right, make it smaller or try another approach. The history stays.',
  },
  {
    icon: <Calendar size={20} aria-hidden="true" />,
    tone: 'neutral' as const,
    title: 'Continue into your workspace',
    description: 'After you begin, save the next steps to your inbox or organise them into projects and schedules — only if that helps.',
  },
  {
    icon: <BarChart3 size={20} aria-hidden="true" />,
    tone: 'neutral' as const,
    title: 'Break down larger tasks',
    description: 'Generate an AI breakdown when a task genuinely needs structure. Project setup is never a prerequisite for starting.',
  },
];

export const metadata: Metadata = {
  title: 'How NeuroNest Works — Rescue a stuck task and begin',
  description: 'See how NeuroNest turns a resisted task into one small next action, adapts it when needed, and continues into your workspace.',
  alternates: { canonical: 'https://www.neuronest.work/features' },
};

export default function FeaturesPage() {
  return (
    <MarketingShell back={null}>
      <header className="mb-10 max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#14B8A6]">
          How it works
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Start with the moment of resistance
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#949BA4]">
          Rescue one task, adapt the next action, then use planning and AI only when they
          genuinely help. Nothing here asks you to build a system before you can begin.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="p-5 sm:p-6">
            <IconBadge tone={feature.tone} size="md" className="mb-4">
              {feature.icon}
            </IconBadge>
            <h2 className="mb-2 text-base font-semibold text-[#F2F3F5]">{feature.title}</h2>
            <p className="text-sm leading-relaxed text-[#949BA4]">{feature.description}</p>
          </Card>
        ))}
      </div>

      {/* Grounding the page in the mechanism, not an adjective list. */}
      <section aria-labelledby="mechanism" className="mt-10 border-t border-[#383A40] pt-10">
        <h2 id="mechanism" className="mb-6 text-lg font-bold tracking-tight sm:text-xl">
          What actually happens in a rescue
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: <Timer size={18} aria-hidden="true" />,
              title: 'One action, sized to now',
              body: 'Not the whole task. The smallest step that still moves it forward, matched to the energy you said you have.',
            },
            {
              icon: <RotateCcw size={18} aria-hidden="true" />,
              title: 'A way out that is not failure',
              body: '"Too hard" and "not feeling it" both produce a new, smaller option instead of a reset.',
            },
            {
              icon: <ShieldCheck size={18} aria-hidden="true" />,
              title: 'Nothing is lost if you stop',
              body: 'Sessions are saved locally before you sign in. Stopping early is recorded as a stop, not a defeat.',
            },
          ].map((item) => (
            <li key={item.title}>
              <div className="mb-2 flex items-center gap-2 text-[#2DD4BF]">
                {item.icon}
                <span className="text-sm font-semibold text-[#F2F3F5]">{item.title}</span>
              </div>
              <p className="text-sm leading-relaxed text-[#949BA4]">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/rescue" className={buttonClass({ size: 'lg' })}>
          <Sparkles size={20} aria-hidden="true" />
          Try a rescue now
        </Link>
        <Link href="/signup" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
          Create an account
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-3 text-sm text-[#6E747B]">No account or credit card required to start.</p>
    </MarketingShell>
  );
}

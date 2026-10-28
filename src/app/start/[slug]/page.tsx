import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SEO_TASKS, getSeoTaskBySlug } from '@/data/seoTasks';
import NeuroNestMark from '@/components/NeuroNestMark';
import { Sparkles, ArrowRight, Clock, ShieldCheck, Heart } from 'lucide-react';
import { Card, CardInset, buttonClass } from '@/components/ui';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return SEO_TASKS.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getSeoTaskBySlug(params.slug);
  if (!item) return { title: 'Page Not Found — NeuroNest' };

  const canonicalUrl = `https://www.neuronest.work/start/${item.slug}`;

  return {
    title: `${item.title} | NeuroNest`,
    description: item.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: item.title,
      description: item.metaDescription,
      url: canonicalUrl,
      siteName: 'NeuroNest',
      images: [
        {
          url: 'https://www.neuronest.work/neuronest-og.svg',
          width: 1200,
          height: 630,
          alt: 'NeuroNest — One small next action',
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description: item.metaDescription,
      images: ['https://www.neuronest.work/neuronest-og.svg'],
    },
  };
}

export default function SeoStartPage({ params }: Props) {
  const item = getSeoTaskBySlug(params.slug);

  if (!item) {
    notFound();
  }

  const rescueUrl = `/rescue?task=${encodeURIComponent(item.task)}&friction=${item.defaultFriction}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: item.title,
    description: item.metaDescription,
    totalTime: `PT${item.estimatedMinutes}M`,
    step: [
      {
        '@type': 'HowToStep',
        name: 'The First Action',
        text: item.atomicFirstAction,
        url: `https://www.neuronest.work/start/${item.slug}#action`,
      },
    ],
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-start bg-[#1E1F22] px-4 py-8 text-[#F2F3F5] sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-[#383A40] pb-4">
          <Link
            href="/"
            className="group flex min-h-[44px] items-center gap-3 rounded-lg"
          >
            <NeuroNestMark size={32} variant="transparent" />
            <span className="text-lg font-bold tracking-tight transition-colors group-hover:text-[#2DD4BF]">
              NeuroNest
            </span>
          </Link>
          <p className="flex items-center gap-1.5 rounded-lg bg-[#14B8A6]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#2DD4BF]">
            <Sparkles size={12} aria-hidden="true" />
            Task initiation
          </p>
        </div>

        <Card as="article" className="mb-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-[#949BA4]">
            <Clock size={14} className="text-[#2DD4BF]" aria-hidden="true" />
            2-minute read · free, no sign-up
          </p>

          <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {item.title}
          </h1>

          <CardInset className="mb-6 border-l-2 border-l-[#14B8A6]">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#2DD4BF]">
              The reality check
            </p>
            <p className="text-sm leading-relaxed text-[#DBDEE1] sm:text-base">
              {item.problemInsight}
            </p>
          </CardInset>

          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#949BA4]">
            Your immediate action
          </h2>
          <CardInset className="mb-6 p-5 sm:p-6">
            <p className="mb-3 text-xl font-bold leading-relaxed text-[#F2F3F5] sm:text-2xl">
              &ldquo;{item.atomicFirstAction}&rdquo;
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2DD4BF] tabular-nums">
              <Clock size={12} aria-hidden="true" />
              Takes about {item.estimatedMinutes} minutes
            </p>
          </CardInset>

          <CardInset className="mb-8">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#F2F3F5]">
              <Heart size={16} className="text-[#2DD4BF]" aria-hidden="true" />
              Why this gets past task freeze
            </h2>
            <p className="text-xs leading-relaxed text-[#949BA4] sm:text-sm">
              {item.whyItWorks}
            </p>
          </CardInset>

          <Link href={rescueUrl} className={buttonClass({ size: 'lg', fullWidth: true })}>
            Begin this action in Rescue
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
          <p className="mt-3 text-center text-xs text-[#949BA4]">
            No sign-up · free for task rescues · no streak to break
          </p>
        </Card>

        <footer className="space-y-3 text-center text-xs text-[#949BA4]">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-[#23A55A]" aria-hidden="true" />
            Built for the moment when you know what to do but cannot begin.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1">
            <Link href="/rescue" className="inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]">
              Direct rescue flow
            </Link>
            <Link href="/features" className="inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]">
              How it works
            </Link>
            <Link href="/pricing" className="inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]">
              Pricing
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}

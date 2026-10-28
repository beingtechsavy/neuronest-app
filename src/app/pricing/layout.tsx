import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NeuroNest pricing — Free Rescue and Pro continuity',
  description: 'Start NeuroNest Rescue for free. Upgrade to Pro for cloud Rescue history, cross-device resume, preferences, and more AI breakdowns.',
  alternates: { canonical: 'https://www.neuronest.work/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

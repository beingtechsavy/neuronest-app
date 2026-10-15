import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rescue a stuck task — NeuroNest',
  description: 'Describe the task you cannot begin, choose what is making it difficult, and get one small realistic next action. No account required.',
  alternates: { canonical: 'https://www.neuronest.work/rescue' },
};

export default function RescueLayout({ children }: { children: React.ReactNode }) {
  return children;
}

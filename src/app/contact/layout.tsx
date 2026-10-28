import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact NeuroNest',
  description: 'Contact the NeuroNest team with product questions, feedback, or account support requests.',
  alternates: { canonical: 'https://www.neuronest.work/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

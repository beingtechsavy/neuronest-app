'use client';

import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import AIBreakdownModal from '@/components/AIBreakdownModal';
import BreakdownListView from '@/components/BreakdownListView';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button, Card, IconBadge, PageHeader, PageShell, SectionCard } from '@/components/ui';

export default function AIBreakdownPage() {
  const user = useUser();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBreakdownComplete = () => {
    // Close modal and stay on page to see the updated list
    setIsModalOpen(false);
  };

  const handleClose = () => {
    // Just close the modal, stay on the page
    setIsModalOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-[#1E1F22] flex items-center justify-center px-4">
        <Card className="text-center max-w-md">
          <IconBadge size="lg" className="mx-auto mb-4">
            <Sparkles size={20} />
          </IconBadge>
          <h1 className="text-xl font-bold text-[#F2F3F5] tracking-tight mb-2">
            Log in to use AI Breakdown
          </h1>
          <p className="text-sm text-[#949BA4] mb-6">
            Breakdowns are saved to your account so you can come back to them.
          </p>
          <Button size="lg" fullWidth onClick={() => router.push('/login')}>
            Go to login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#1E1F22]">
      <PageShell>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="mb-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-medium text-[#949BA4] transition-colors hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Dashboard
        </button>

        <PageHeader
          eyebrow="AI Breakdown"
          title="Turn a big task into a first step"
          description="Describe something you have been avoiding. You will get a short ordered list of concrete steps, each small enough to actually start."
          actions={
            <Button size="lg" onClick={() => setIsModalOpen(true)}>
              <Sparkles size={18} aria-hidden="true" />
              Break down a task
            </Button>
          }
        />

        <SectionCard
          title="Your breakdowns"
          description="Everything you have generated before, ready to reopen."
        >
          <BreakdownListView userId={user.id} />
        </SectionCard>
      </PageShell>

      {/* AI Breakdown Modal */}
      <AIBreakdownModal
        isOpen={isModalOpen}
        onClose={handleClose}
        userId={user.id}
        onBreakdownComplete={handleBreakdownComplete}
      />
    </div>
  );
}

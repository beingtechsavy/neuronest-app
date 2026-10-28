'use client';

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, PauseCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSessions } from '@/lib/rescue/anonymousSession';
import { supabase } from '@/lib/supabaseClient';
import type { RescueSessionData } from '@/types/rescue';
import { Button, Card, IconBadge, PageHeader, PageShell } from '@/components/ui';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<RescueSessionData[]>([]);

  useEffect(() => {
    async function load() {
      const local = getSessions();
      setSessions(local);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const response = await fetch('/api/rescue/sessions', { headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}` } });
      if (!response.ok) return;
      const data = await response.json() as { sessions?: Array<{ id: string; task_text: string | null; status: RescueSessionData['status']; started_at: string; friction_type: RescueSessionData['friction']; initial_action: RescueSessionData['initialAction']; adaptations: RescueSessionData['adaptations']; completed_at?: string }> };
      if (data.sessions) setSessions(data.sessions.map((item) => ({ id: item.id, taskText: item.task_text || 'Private Rescue task', friction: item.friction_type, initialAction: item.initial_action, adaptations: item.adaptations || [], startedAt: item.started_at, completedAt: item.completed_at, status: item.status })));
    }
    void load();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#1E1F22]">
      <PageShell>
        <PageHeader
          title="Previous Rescue sessions"
          description="Every time you got unstuck, newest first."
        />

        {sessions.length === 0 ? (
          <Card className="py-12 text-center">
            <IconBadge size="lg" className="mx-auto mb-4">
              <Clock size={20} />
            </IconBadge>
            <p className="mb-1 text-base font-semibold text-[#F2F3F5]">No Rescue sessions yet</p>
            <p className="mb-6 text-sm text-[#949BA4]">
              Describe one task you keep putting off and get a first step.
            </p>
            <Button size="lg" onClick={() => router.push('/rescue')}>
              Start your first Rescue
            </Button>
          </Card>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <Card
                as="li"
                key={session.id}
                className="flex items-center justify-between gap-4 p-4 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#F2F3F5]">{session.taskText}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#949BA4]">
                    <span className="flex items-center gap-1.5">
                      {session.status === 'completed' ? (
                        <CheckCircle size={14} className="text-[#23A55A]" aria-hidden="true" />
                      ) : (
                        <PauseCircle size={14} className="text-[#E8A33D]" aria-hidden="true" />
                      )}
                      <span className="capitalize">{session.status}</span>
                    </span>
                    <span>{formatDate(session.startedAt)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </PageShell>
    </div>
  );
}

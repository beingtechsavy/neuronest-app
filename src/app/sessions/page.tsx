'use client';

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, PauseCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSessions } from '@/lib/rescue/anonymousSession';
import type { RescueSessionData } from '@/types/rescue';

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
    setSessions(getSessions());
  }, []);

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Clock size={24} className="text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Previous Rescue Sessions</h1>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg mb-4">No rescue sessions yet.</p>
            <button
              onClick={() => router.push('/rescue')}
              className="py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all"
            >
              Start your first rescue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{session.taskText}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      {session.status === 'completed' ? (
                        <CheckCircle size={12} className="text-green-400" />
                      ) : (
                        <PauseCircle size={12} className="text-amber-400" />
                      )}
                      <span className="capitalize">{session.status}</span>
                    </span>
                    <span>{formatDate(session.startedAt)}</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
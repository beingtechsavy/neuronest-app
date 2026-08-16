'use client';

import React from 'react';
import RescueContainer from '@/components/rescue/RescueContainer';

export default function RescuePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <RescueContainer />
      </div>
    </main>
  );
}
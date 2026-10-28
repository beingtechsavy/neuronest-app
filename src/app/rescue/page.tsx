'use client';

import React from 'react';
import RescueContainer from '@/components/rescue/RescueContainer';

export default function RescuePage() {
  return (
    <main className="min-h-[100dvh] bg-[#1E1F22] text-[#F2F3F5] transition-colors">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <RescueContainer />
      </div>
    </main>
  );
}
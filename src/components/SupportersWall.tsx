'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { CardInset } from '@/components/ui';

interface SupporterEntry {
  id: string;
  display_name: string;
  is_anonymous: boolean;
  amount: number;
  currency: string;
  message: string | null;
  created_at: string;
}

function formatAmount(amount: number, currency: string): string {
  const value = (amount / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return currency === 'INR' ? `₹${value}` : `$${value}`;
}

/**
 * Public Supporters Wall ("hall of fame") — reads the privacy-safe
 * `supporters` table (anon-accessible by design; no PII columns exist).
 */
export default function SupportersWall() {
  const [entries, setEntries] = useState<SupporterEntry[] | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from('supporters')
      .select('id, display_name, is_anonymous, amount, currency, message, created_at')
      .order('created_at', { ascending: false })
      .limit(24)
      .then(({ data }) => {
        if (active) setEntries(data || []);
      });
    return () => { active = false; };
  }, []);

  if (entries !== null && entries.length === 0) return null;

  return (
    <section id="supporters" aria-label="Supporters Wall" className="mt-10">
      <header className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Heart size={18} className="text-[#2DD4BF]" aria-hidden="true" />
          Supporters Wall
        </h2>
        <p className="mt-1 text-sm text-[#949BA4]">
          People who chip in keep the Rescue line free for everyone. Public by
          default with an anonymity option at checkout.
        </p>
      </header>
      {entries === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => <CardInset key={i} className="h-24" />)}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
            >
              <CardInset className="h-full">
                <p className="text-sm font-semibold text-[#F2F3F5]">
                  {entry.is_anonymous ? 'Anonymous' : entry.display_name}
                  <span className="ml-2 font-normal tabular-nums text-[#2DD4BF]">
                    {formatAmount(entry.amount, entry.currency)}
                  </span>
                </p>
                {entry.message && (
                  <p className="mt-1.5 text-sm leading-relaxed text-[#949BA4]">“{entry.message}”</p>
                )}
              </CardInset>
            </motion.li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-[#6E747B]">
        Supported via Buy Me a Coffee or want your entry updated or removed? Email{' '}
        <a href="mailto:support@neuronest.work" className="text-[#5EEAD4] underline underline-offset-4">
          support@neuronest.work
        </a>
        .
      </p>
    </section>
  );
}

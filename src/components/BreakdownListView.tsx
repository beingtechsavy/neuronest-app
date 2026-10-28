'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpDown, Sparkles, Calendar, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button, IconBadge, buttonClass } from '@/components/ui';

interface BreakdownListItem {
  id: number;
  original_task_title: string;
  created_at: string;
  completion_rate: number;
  steps_count: number;
  subject: string | null;
}

interface BreakdownListViewProps {
  userId: string;
}

export default function BreakdownListView({ userId }: BreakdownListViewProps) {
  const router = useRouter();
  const [breakdowns, setBreakdowns] = useState<BreakdownListItem[]>([]);
  const [filteredBreakdowns, setFilteredBreakdowns] = useState<BreakdownListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'completion'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakdowns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/ai/breakdowns/list?userId=${userId}`, {
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch breakdowns');
      }

      setBreakdowns(data.breakdowns || []);
    } catch (err) {
      console.error('Error fetching breakdowns:', err);
      setError('Failed to load breakdowns. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const filterAndSortBreakdowns = useCallback(() => {
    let filtered = [...breakdowns];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(breakdown =>
        breakdown.original_task_title.toLowerCase().includes(query) ||
        (breakdown.subject && breakdown.subject.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'title':
          comparison = a.original_task_title.localeCompare(b.original_task_title);
          break;
        case 'completion':
          comparison = a.completion_rate - b.completion_rate;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBreakdowns(filtered);
  }, [breakdowns, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    if (userId) {
      fetchBreakdowns();
    }
  }, [userId, fetchBreakdowns]);

  useEffect(() => {
    filterAndSortBreakdowns();
  }, [filterAndSortBreakdowns]);



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-[#23A55A] bg-[#23A55A]/10';
    if (rate >= 50) return 'text-[#E8A33D] bg-[#E8A33D]/10';
    return 'text-[#949BA4] bg-[#383A40]/60';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-[#949BA4]" role="status">
        <Loader2 className="animate-spin text-[#14B8A6] motion-reduce:animate-none" size={20} aria-hidden="true" />
        <span className="text-sm">Loading your breakdowns…</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-[#ED4245]/30 bg-[#ED4245]/10 p-5"
      >
        <IconBadge tone="danger" size="sm">
          <AlertCircle size={16} />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#F2F3F5]">{error}</p>
          <Button variant="secondary" onClick={fetchBreakdowns} className="mt-3">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (breakdowns.length === 0) {
    return (
      <div className="py-12 text-center">
        <IconBadge tone="brand" size="lg" className="mx-auto mb-4">
          <Sparkles size={20} />
        </IconBadge>
        <h3 className="mb-1.5 text-lg font-bold tracking-tight text-[#F2F3F5]">
          No breakdowns yet
        </h3>
        <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-[#949BA4]">
          You have not split anything up yet. That is fine — it works the same whenever you are ready.
        </p>
        <Link href="/ai-breakdown" className={buttonClass({ size: 'lg' })}>
          Create your first breakdown
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="breakdown-search" className="sr-only">
            Search breakdowns
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#949BA4]"
            size={16}
            aria-hidden="true"
          />
          <input
            id="breakdown-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or project…"
            className="min-h-11 w-full rounded-xl border border-[#3F4147] bg-[#1E1F22] pl-9 pr-3 text-sm text-[#F2F3F5] placeholder:text-[#6E747B] outline-none transition-colors focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]"
          />
        </div>

        <div className="flex gap-2">
          <label htmlFor="breakdown-sort" className="sr-only">
            Sort breakdowns
          </label>
          <select
            id="breakdown-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'completion')}
            className="min-h-11 rounded-xl border border-[#3F4147] bg-[#1E1F22] px-3 text-sm text-[#F2F3F5] outline-none transition-colors focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]"
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="completion">Completion</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#3F4147] text-[#DBDEE1] transition-colors hover:border-[#14B8A6] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
            aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <ArrowUpDown size={18} className={sortOrder === 'desc' ? 'rotate-180' : ''} aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="text-sm text-[#949BA4]">
        {filteredBreakdowns.length === breakdowns.length
          ? `${breakdowns.length} breakdown${breakdowns.length !== 1 ? 's' : ''}`
          : `${filteredBreakdowns.length} of ${breakdowns.length} breakdowns`}
      </p>

      {filteredBreakdowns.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-3 text-[#949BA4]">No breakdowns match your search.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-[#2DD4BF] underline underline-offset-4 transition-colors hover:text-[#5EEAD4]"
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filteredBreakdowns.map((breakdown) => (
            <li key={breakdown.id}>
              {/* Real link semantics: this row navigates, so it must be
                  reachable and announced as a link, not a div with onClick. */}
              <Link
                href={`/ai-breakdown?id=${breakdown.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-[#383A40] bg-[#2B2D31] p-4 transition-colors hover:border-[#14B8A6]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1F22] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1.5 truncate text-base font-bold tracking-tight text-[#F2F3F5] transition-colors group-hover:text-[#5EEAD4]">
                    {breakdown.original_task_title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#949BA4]">
                    {breakdown.subject && (
                      <span className="rounded-lg bg-[#14B8A6]/10 px-2 py-0.5 font-medium text-[#5EEAD4]">
                        {breakdown.subject}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} aria-hidden="true" />
                      {formatDate(breakdown.created_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={13} aria-hidden="true" />
                      {breakdown.steps_count} steps
                    </span>
                  </div>
                </div>

                <span
                  className={`flex shrink-0 items-center gap-2 self-start rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums sm:self-center ${getCompletionColor(breakdown.completion_rate)}`}
                >
                  <CheckCircle2 size={15} aria-hidden="true" />
                  {Math.round(breakdown.completion_rate)}%
                  <span className="sr-only">complete</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

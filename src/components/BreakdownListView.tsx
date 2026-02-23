'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpDown, Sparkles, Calendar, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

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

  useEffect(() => {
    if (userId) {
      fetchBreakdowns();
    }
  }, [userId]);

  useEffect(() => {
    filterAndSortBreakdowns();
  }, [breakdowns, searchQuery, sortBy, sortOrder]);

  const fetchBreakdowns = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/breakdowns/list?userId=${userId}`);
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
  };

  const filterAndSortBreakdowns = () => {
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
  };

  const handleBreakdownClick = (breakdownId: number) => {
    // Navigate to breakdown details or AI breakdown page
    router.push(`/ai-breakdown?id=${breakdownId}`);
  };

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
    if (rate >= 80) return 'text-green-400 bg-green-400/10';
    if (rate >= 50) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-slate-400 bg-slate-400/10';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-500 mx-auto mb-4" size={40} />
          <p className="text-slate-400">Loading your breakdowns...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle size={24} />
          <div>
            <p className="font-medium">{error}</p>
            <button
              onClick={fetchBreakdowns}
              className="text-sm underline hover:text-red-300 mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (breakdowns.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="text-purple-400" size={40} />
        </div>
        <h3 className="text-2xl font-semibold text-white mb-3">
          No breakdowns yet
        </h3>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Start breaking down complex tasks into manageable steps with AI assistance!
        </p>
        <button
          onClick={() => router.push('/ai-breakdown')}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
        >
          Create Your First Breakdown
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search breakdowns by title or subject..."
            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'completion')}
            className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="completion">Completion</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white hover:bg-slate-600/50 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <ArrowUpDown size={20} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-400">
        {filteredBreakdowns.length === breakdowns.length
          ? `${breakdowns.length} breakdown${breakdowns.length !== 1 ? 's' : ''}`
          : `${filteredBreakdowns.length} of ${breakdowns.length} breakdowns`}
      </div>

      {/* Breakdowns List */}
      {filteredBreakdowns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No breakdowns match your search</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBreakdowns.map((breakdown) => (
            <div
              key={breakdown.id}
              onClick={() => handleBreakdownClick(breakdown.id)}
              className="group bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-purple-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                {/* Left: Title and Subject */}
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <h3 className="text-lg font-semibold text-white mb-2 truncate group-hover:text-purple-300 transition-colors">
                    {breakdown.original_task_title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {breakdown.subject && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                        {breakdown.subject}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-slate-400">
                      <Calendar size={14} />
                      <span>{formatDate(breakdown.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Sparkles size={14} />
                      <span>{breakdown.steps_count} steps</span>
                    </div>
                  </div>
                </div>

                {/* Right: Completion Status */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end w-full sm:w-auto justify-between sm:justify-start gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getCompletionColor(breakdown.completion_rate)}`}>
                    <CheckCircle2 size={16} />
                    <span className="font-medium">{Math.round(breakdown.completion_rate)}%</span>
                  </div>
                  <span className="text-xs text-slate-500">Complete</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

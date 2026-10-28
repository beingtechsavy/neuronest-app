'use client';

import React from 'react';
import { Search, ListFilter, ArrowUpDown } from 'lucide-react';
import { CardInset } from '@/components/ui';

// --- TYPE DEFINITIONS ---
interface TaskFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: 'all' | 'breakdown' | 'inbox' | 'scheduled' | 'completed';
  setStatusFilter: (value: 'all' | 'breakdown' | 'inbox' | 'scheduled' | 'completed') => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
}

// The three controls previously had three different heights and radii inside a
// translucent card. One field shape, one control height, labels wired by id.
const control =
  'min-h-11 w-full rounded-xl border border-[#3F4147] bg-[#1E1F22] px-3 text-sm text-[#F2F3F5] ' +
  'outline-none transition-colors focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]';

// --- MAIN COMPONENT ---
export default function TaskFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
}: TaskFiltersProps) {
  return (
    <CardInset className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
      <div className="relative col-span-1">
        <label htmlFor="task-search" className="sr-only">
          Search tasks
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#949BA4]"
          size={16}
          aria-hidden="true"
        />
        <input
          id="task-search"
          type="search"
          placeholder="Search tasks…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${control} pl-9 pr-3 placeholder:text-[#6E747B]`}
        />
      </div>

      <div className="col-span-1 flex min-w-0 items-center gap-2 md:col-span-2 md:justify-end">
        <label htmlFor="task-status-filter" className="sr-only">
          Filter by status
        </label>
        <ListFilter size={16} className="shrink-0 text-[#949BA4]" aria-hidden="true" />
        <select
          id="task-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskFiltersProps['statusFilter'])}
          className={`${control} md:max-w-[11rem]`}
        >
          <option value="all">All statuses</option>
          <option value="breakdown">Breakdown</option>
          <option value="inbox">Inbox</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>

        <label htmlFor="task-sort" className="sr-only">
          Sort tasks
        </label>
        <ArrowUpDown size={16} className="shrink-0 text-[#949BA4]" aria-hidden="true" />
        <select
          id="task-sort"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className={`${control} md:max-w-[11rem]`}
        >
          <option value="deadline">Sort by deadline</option>
          <option value="created_at">Sort by newest</option>
          <option value="subject">Sort by project</option>
        </select>
      </div>
    </CardInset>
  );
}

'use client';

import React from 'react';
import { Search, ListFilter, ArrowUpDown } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface TaskFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
}

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      {/* Search Input */}
      <div className="relative col-span-1 md:col-span-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-md text-white pl-10 pr-4 py-2 text-sm placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
      </div>

      <div className="flex gap-4 col-span-1 md:col-span-2 justify-end">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
            <ListFilter size={16} className="text-slate-400" />
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-md text-white p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
                <option value="all">All Statuses</option>
                <option value="pending">Inbox</option>
                <option value="Scheduled">Scheduled</option>
                <option value="completed">Completed</option>
            </select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-md text-white p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
                <option value="deadline">Sort by Deadline</option>
                <option value="created_at">Sort by Newest</option>
                <option value="subject">Sort by Subject</option>
            </select>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, CalendarDays, ChevronLeft, ChevronRight, Settings, ListChecks, TrendingUp, Timer } from 'lucide-react';

// --- CONSTANTS ---
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={18} /> },
  { label: 'Calendar', href: '/calendar', icon: <CalendarDays size={18} /> },
  { label: 'Tasks', href: '/tasks', icon: <ListChecks size={18} /> },
  { label: 'Pomodoro', href: '/pomodoro', icon: <Timer size={18} /> },
  { label: 'Analytics', href: '/analytics', icon: <TrendingUp size={18} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
];

// --- COMPONENT DEFINITION ---
export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-slate-800 border-r border-slate-700 text-white z-50 flex flex-col transition-all duration-200 ease-in-out ${
        isOpen ? 'w-60' : 'w-[72px]'
      }`}
    >
      <div className="flex items-center justify-between p-3.5 mb-4">
        {isOpen && (
            <h2 className="text-xl font-bold text-slate-100 whitespace-nowrap">
              🧠 NeuroNest
            </h2>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          aria-label="Toggle Sidebar"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="flex flex-col gap-2 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="no-underline text-inherit">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer text-sm font-medium ${
                  isActive
                    ? 'bg-purple-600/80 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                } ${!isOpen ? 'justify-center' : ''}`}
                title={item.label}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

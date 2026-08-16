'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, CalendarDays, ChevronLeft, ChevronRight, Settings, ListChecks, TrendingUp, Brain, Sparkles, CreditCard, Clock, LifeBuoy, ChevronDown } from 'lucide-react';

// --- PRIMARY NAV ITEMS (Rescue-focused) ---
const primaryNavItems = [
  { label: 'Rescue', href: '/rescue', icon: <LifeBuoy size={18} /> },
  { label: 'Sessions', href: '/sessions', icon: <Clock size={18} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
];

// --- SECONDARY NAV ITEMS (Moved to "More Tools") ---
const moreToolsItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={18} /> },
  { label: 'AI Breakdown', href: '/ai-breakdown', icon: <Sparkles size={18} /> },
  { label: 'Calendar', href: '/calendar', icon: <CalendarDays size={18} /> },
  { label: 'Tasks', href: '/tasks', icon: <ListChecks size={18} /> },
  { label: 'Focus', href: '/focus', icon: <Brain size={18} /> },
  { label: 'Analytics', href: '/analytics', icon: <TrendingUp size={18} /> },
  { label: 'Pricing', href: '/pricing', icon: <CreditCard size={18} /> },
];

// --- COMPONENT DEFINITION ---
export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If a more-tools item is active, expand the section
  const moreToolsActive = moreToolsItems.some((item) => pathname === item.href);
  useEffect(() => {
    if (moreToolsActive) {
      setShowMoreTools(true);
    }
  }, [moreToolsActive]);

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

      <nav className="flex flex-col gap-1 px-2 flex-1 overflow-y-auto">
        {/* Primary items */}
        {primaryNavItems.map((item) => {
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

        {/* Divider */}
        {isOpen && <div className="my-2 border-t border-slate-700" />}

        {/* More Tools accordion */}
        {isOpen ? (
          <div>
            <button
              onClick={() => setShowMoreTools(!showMoreTools)}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              <ChevronDown
                size={14}
                className={`transition-transform ${showMoreTools ? 'rotate-0' : '-rotate-90'}`}
              />
              More Tools
            </button>
            {showMoreTools && (
              <div className="mt-1 space-y-1 pl-2">
                {moreToolsItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} className="no-underline text-inherit">
                      <div
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer text-sm font-medium ${
                          isActive
                            ? 'bg-purple-600/60 text-white'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                        title={item.label}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="whitespace-nowrap">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* When collapsed, show a small More button */
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center p-3 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
            title="More Tools"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </nav>
    </aside>
  );
}

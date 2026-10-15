'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, CalendarDays, ChevronLeft, ChevronRight, Settings, ListChecks, TrendingUp, Brain, Sparkles, CreditCard, Clock, LifeBuoy, ChevronDown, X } from 'lucide-react';
import NeuroNestMark from '@/components/NeuroNestMark';

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

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

// --- COMPONENT DEFINITION ---
export default function Sidebar({ isCollapsed, isMobileOpen, onToggleCollapsed, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  const showLabels = !isCollapsed || isMobileOpen;

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
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-60 max-w-[calc(100vw-1rem)] flex-col border-r border-slate-700 bg-slate-800 text-white shadow-2xl transition-[transform,width] duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-60'}`}
      >
        <div className={`flex p-3.5 mb-4 ${showLabels ? 'items-center justify-between' : 'flex-col items-center gap-2'}`}>
          <div className="flex min-w-0 items-center gap-2">
            <NeuroNestMark size={32} className="shrink-0" />
            {showLabels && <h2 className="text-xl font-bold text-slate-100 whitespace-nowrap">NeuroNest</h2>}
          </div>
          <button
            type="button"
            onClick={isMobileOpen ? onCloseMobile : onToggleCollapsed}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            aria-label={isMobileOpen ? 'Close navigation' : isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isMobileOpen ? 'Close navigation' : isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isMobileOpen ? <X size={20} /> : isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
        {/* Primary items */}
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onCloseMobile} className="no-underline text-inherit">
              <div
                className={`flex min-h-11 items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600/80 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                } ${!showLabels ? 'justify-center' : ''}`}
                title={item.label}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {showLabels && <span className="whitespace-nowrap">{item.label}</span>}
              </div>
            </Link>
          );
        })}

        {/* Divider */}
        {showLabels && <div className="my-2 border-t border-slate-700" />}

        {/* More Tools accordion */}
        {showLabels ? (
          <div>
            <button
              type="button"
              onClick={() => setShowMoreTools(!showMoreTools)}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg p-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
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
                    <Link key={item.href} href={item.href} onClick={onCloseMobile} className="no-underline text-inherit">
                      <div
                        className={`flex min-h-11 items-center gap-3 rounded-lg p-2.5 text-sm font-medium transition-colors ${
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
            type="button"
            onClick={onToggleCollapsed}
            className="flex min-h-11 items-center justify-center rounded-lg p-3 text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
            title="More Tools"
            aria-label="Expand sidebar to show more tools"
          >
            <ChevronRight size={18} />
          </button>
        )}
        </nav>
      </aside>
    </>
  );
}

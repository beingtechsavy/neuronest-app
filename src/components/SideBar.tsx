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
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-60 max-w-[calc(100vw-1rem)] flex-col border-r border-[#383A40] bg-[#2B2D31] text-[#F2F3F5] transition-[transform,width] duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-60'}`}
      >
        <div className={`flex p-3.5 mb-4 ${showLabels ? 'items-center justify-between' : 'flex-col items-center gap-2'}`}>
          <div className="flex min-w-0 items-center gap-2">
            <NeuroNestMark size={32} className="shrink-0" />
            {showLabels && <h2 className="text-xl font-bold text-[#F2F3F5] whitespace-nowrap">NeuroNest</h2>}
          </div>
          <button
            type="button"
            onClick={isMobileOpen ? onCloseMobile : onToggleCollapsed}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-[#DBDEE1] transition-colors hover:bg-[#383A40] hover:text-[#F2F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]"
            aria-label={isMobileOpen ? 'Close navigation' : isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isMobileOpen ? <X size={20} aria-hidden="true" /> : isCollapsed ? <ChevronRight size={20} aria-hidden="true" /> : <ChevronLeft size={20} aria-hidden="true" />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
        {/* Primary items */}
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={showLabels ? undefined : item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold no-underline transition-colors ${
                isActive
                  ? 'bg-[#0D9488] text-[#F2F3F5]'
                  : 'text-[#949BA4] hover:bg-[#383A40] hover:text-[#F2F3F5]'
              } ${!showLabels ? 'justify-center' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]`}
            >
              <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
              {showLabels && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}

        {/* Divider */}
        {showLabels && <div className="my-2 border-t border-[#383A40]" />}

        {/* More Tools accordion */}
        {showLabels ? (
          <div>
            <button
              type="button"
              onClick={() => setShowMoreTools(!showMoreTools)}
              aria-expanded={showMoreTools}
              aria-controls="sidebar-more-tools"
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold uppercase tracking-wider text-[#6E747B] transition-colors hover:bg-[#383A40] hover:text-[#DBDEE1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]"
            >
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform motion-reduce:transition-none ${showMoreTools ? 'rotate-0' : '-rotate-90'}`}
              />
              More tools
            </button>
            {showMoreTools && (
              <div id="sidebar-more-tools" className="mt-1 space-y-1 pl-2">
                {moreToolsItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium no-underline transition-colors ${
                        isActive
                          ? 'bg-[#383A40] text-[#F2F3F5]'
                          : 'text-[#949BA4] hover:bg-[#383A40] hover:text-[#F2F3F5]'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]`}
                    >
                      <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                      <span className="whitespace-nowrap">{item.label}</span>
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
            className="flex min-h-11 items-center justify-center rounded-xl p-3 text-[#6E747B] transition-colors hover:bg-[#383A40] hover:text-[#DBDEE1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B2D31]"
            aria-label="Expand sidebar to show more tools"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        )}
        </nav>
      </aside>
    </>
  );
}

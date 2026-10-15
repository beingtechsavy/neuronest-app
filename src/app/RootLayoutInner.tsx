'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { SupabaseProvider } from '@/components/SupabaseProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Sidebar from '@/components/SideBar'; 
import Topbar from '@/components/TopBar';

export default function RootLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isAppPage = !['/', '/login', '/signup', '/forgot-password', '/reset-password', '/features', '/pricing', '/terms', '/privacy', '/refund', '/contact', '/rescue', '/sessions'].includes(pathname);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleViewportChange = () => {
      if (!mediaQuery.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleViewportChange();
    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileSidebarOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileSidebarOpen]);

  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <ToastProvider>
          {isAppPage ? (
            // --- App Layout (with Sidebar AND Topbar) ---
            <>
              <Sidebar
                isCollapsed={isSidebarCollapsed}
                isMobileOpen={isMobileSidebarOpen}
                onToggleCollapsed={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />
              <div className={`min-w-0 w-full transition-[margin-left] duration-200 ease-in-out ${isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}`}>
                <Topbar onOpenMenu={() => setIsMobileSidebarOpen(true)} />
                <main className="min-w-0">
                  {children}
                </main>
              </div>
            </>
          ) : (
            // --- Public Layout (No Sidebar) ---
            <main>
              {children}
            </main>
          )}
        </ToastProvider>
      </SupabaseProvider>
    </ErrorBoundary>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { SupabaseProvider } from '@/components/SupabaseProvider';
import Sidebar from '@/components/SideBar'; 
import Topbar from '@/components/TopBar'; // Corrected the casing from 'Topbar' to 'TopBar'

export default function RootLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAppPage = !['/', '/login', '/signup'].includes(pathname);

  return (
    <SupabaseProvider>
      {isAppPage ? (
        // --- App Layout (with Sidebar AND Topbar) ---
        <>
          <Sidebar />
          <div className="lg:ml-60">
            <Topbar />
            <main>
              {children}
            </main>
          </div>
        </>
      ) : (
        // --- Public Layout (No Topbar) ---
        <main>
          {children}
        </main>
      )}
    </SupabaseProvider>
  );
}

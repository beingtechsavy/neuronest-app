'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  CalendarDays,
  ListTodo,
  LineChart,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={18} /> },
  { label: 'Calendar', href: '/calendar', icon: <CalendarDays size={18} /> },
  { label: 'Tasks', href: '/tasks', icon: <ListTodo size={18} /> },
  { label: 'Progress', href: '/progress', icon: <LineChart size={18} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setIsOpen(true)
  }, [])
  
  if (!isMounted) {
      return null;
  }

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: isOpen ? '240px' : '72px',
      }}
    >
      <div style={styles.header}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={styles.toggleButton}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        {isOpen && <h2 style={styles.logo}>🧠 NeuroNest</h2>}
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} style={styles.linkReset}>
            <div
              style={{
                ...styles.navItem,
                // FIX: This now correctly highlights the active link
                ...(pathname === item.href
                  ? styles.navItemActive
                  : styles.navItemInactive),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {isOpen && <span style={styles.navLabel}>{item.label}</span>}
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    backgroundColor: '#1e293b',
    borderRight: '1px solid #334155',
    color: '#ffffff',
    padding: '1rem 0.5rem',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease-in-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0.5rem',
    marginBottom: '1.5rem',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#f1f5f9',
    padding: '0.25rem',
    marginRight: '0.5rem',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
    whiteSpace: 'nowrap',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  linkReset: {
    textDecoration: 'none',
    color: 'inherit',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  navItemActive: {
    backgroundColor: '#374151',
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  navItemInactive: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  navLabel: {
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
}

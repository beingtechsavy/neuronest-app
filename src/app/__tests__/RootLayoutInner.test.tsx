/**
 * Unit tests for RootLayoutInner component
 * Tests requirements 2.1, 2.2, 2.3 for clean authentication page layouts
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayoutInner from '../RootLayoutInner';

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname()
}));

// Mock SupabaseProvider
vi.mock('@/components/SupabaseProvider', () => ({
  SupabaseProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="supabase-provider">{children}</div>
  )
}));

// Mock TopBar
vi.mock('@/components/TopBar', () => ({
  default: () => <div data-testid="top-bar">TopBar</div>
}));

describe('RootLayoutInner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Pages Layout', () => {
    test('should not show TopBar on landing page', () => {
      mockUsePathname.mockReturnValue('/');
      
      render(
        <RootLayoutInner>
          <div>Landing Page Content</div>
        </RootLayoutInner>
      );

      expect(screen.queryByTestId('top-bar')).not.toBeInTheDocument();
      expect(screen.getByText('Landing Page Content')).toBeInTheDocument();
    });

    test('should not show TopBar on login page', () => {
      mockUsePathname.mockReturnValue('/login');
      
      render(
        <RootLayoutInner>
          <div>Login Page Content</div>
        </RootLayoutInner>
      );

      expect(screen.queryByTestId('top-bar')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page Content')).toBeInTheDocument();
    });

    test('should not show TopBar on signup page', () => {
      mockUsePathname.mockReturnValue('/signup');
      
      render(
        <RootLayoutInner>
          <div>Signup Page Content</div>
        </RootLayoutInner>
      );

      expect(screen.queryByTestId('top-bar')).not.toBeInTheDocument();
      expect(screen.getByText('Signup Page Content')).toBeInTheDocument();
    });

    test('should not apply padding to landing page', () => {
      mockUsePathname.mockReturnValue('/');
      
      render(
        <RootLayoutInner>
          <div>Landing Page Content</div>
        </RootLayoutInner>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).not.toHaveClass('px-4');
      expect(mainElement).not.toHaveClass('py-6');
      expect(mainElement.className).toBe('');
    });

    test('should not apply padding to login page', () => {
      mockUsePathname.mockReturnValue('/login');
      
      render(
        <RootLayoutInner>
          <div>Login Page Content</div>
        </RootLayoutInner>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).not.toHaveClass('px-4');
      expect(mainElement).not.toHaveClass('py-6');
      expect(mainElement.className).toBe('');
    });

    test('should not apply padding to signup page', () => {
      mockUsePathname.mockReturnValue('/signup');
      
      render(
        <RootLayoutInner>
          <div>Signup Page Content</div>
        </RootLayoutInner>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).not.toHaveClass('px-4');
      expect(mainElement).not.toHaveClass('py-6');
      expect(mainElement.className).toBe('');
    });
  });

  describe('Authenticated Pages Layout', () => {
    test('should show TopBar on dashboard page', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      
      render(
        <RootLayoutInner>
          <div>Dashboard Content</div>
        </RootLayoutInner>
      );

      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    test('should show TopBar on calendar page', () => {
      mockUsePathname.mockReturnValue('/calendar');
      
      render(
        <RootLayoutInner>
          <div>Calendar Content</div>
        </RootLayoutInner>
      );

      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      expect(screen.getByText('Calendar Content')).toBeInTheDocument();
    });

    test('should show TopBar on settings page', () => {
      mockUsePathname.mockReturnValue('/settings');
      
      render(
        <RootLayoutInner>
          <div>Settings Content</div>
        </RootLayoutInner>
      );

      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      expect(screen.getByText('Settings Content')).toBeInTheDocument();
    });

    test('should apply padding to dashboard page', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      
      render(
        <RootLayoutInner>
          <div>Dashboard Content</div>
        </RootLayoutInner>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-6');
    });

    test('should apply padding to calendar page', () => {
      mockUsePathname.mockReturnValue('/calendar');
      
      render(
        <RootLayoutInner>
          <div>Calendar Content</div>
        </RootLayoutInner>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-6');
    });

    test('should apply padding to settings page', () => {
      mockUsePathname.mockReturnValue('/settings');
      
      render(
        <RootLayoutInner>
          <div>Settings Content</div>
        </RootLayoutInner>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-6');
    });

    test('should apply padding to unknown/custom pages', () => {
      mockUsePathname.mockReturnValue('/custom-page');
      
      render(
        <RootLayoutInner>
          <div>Custom Page Content</div>
        </RootLayoutInner>
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-6');
    });
  });

  describe('SupabaseProvider Integration', () => {
    test('should wrap content in SupabaseProvider', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      
      render(
        <RootLayoutInner>
          <div>Test Content</div>
        </RootLayoutInner>
      );

      expect(screen.getByTestId('supabase-provider')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('should wrap authentication pages in SupabaseProvider', () => {
      mockUsePathname.mockReturnValue('/login');
      
      render(
        <RootLayoutInner>
          <div>Login Content</div>
        </RootLayoutInner>
      );

      expect(screen.getByTestId('supabase-provider')).toBeInTheDocument();
      expect(screen.getByText('Login Content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle undefined pathname', () => {
      mockUsePathname.mockReturnValue(undefined);
      
      render(
        <RootLayoutInner>
          <div>Content</div>
        </RootLayoutInner>
      );

      // Should default to showing TopBar and applying padding
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-6');
    });

    test('should handle null pathname', () => {
      mockUsePathname.mockReturnValue(null);
      
      render(
        <RootLayoutInner>
          <div>Content</div>
        </RootLayoutInner>
      );

      // Should default to showing TopBar and applying padding
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-6');
    });

    test('should handle empty string pathname', () => {
      mockUsePathname.mockReturnValue('');
      
      render(
        <RootLayoutInner>
          <div>Content</div>
        </RootLayoutInner>
      );

      // Empty string should be treated as non-auth page
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-6');
    });

    test('should handle pathname with query parameters', () => {
      mockUsePathname.mockReturnValue('/login?redirect=/dashboard');
      
      render(
        <RootLayoutInner>
          <div>Login Content</div>
        </RootLayoutInner>
      );

      // Should still recognize as login page
      expect(screen.queryByTestId('top-bar')).not.toBeInTheDocument();
      const mainElement = screen.getByRole('main');
      expect(mainElement.className).toBe('');
    });

    test('should handle pathname with hash', () => {
      mockUsePathname.mockReturnValue('/signup#form');
      
      render(
        <RootLayoutInner>
          <div>Signup Content</div>
        </RootLayoutInner>
      );

      // Should still recognize as signup page
      expect(screen.queryByTestId('top-bar')).not.toBeInTheDocument();
      const mainElement = screen.getByRole('main');
      expect(mainElement.className).toBe('');
    });

    test('should handle nested auth paths', () => {
      mockUsePathname.mockReturnValue('/auth/login');
      
      render(
        <RootLayoutInner>
          <div>Nested Login Content</div>
        </RootLayoutInner>
      );

      // Should not be treated as auth page (exact match required)
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-6');
    });
  });

  describe('Layout Consistency', () => {
    test('should maintain consistent structure across different pages', () => {
      const testPages = [
        { path: '/', expectTopBar: false, expectPadding: false },
        { path: '/login', expectTopBar: false, expectPadding: false },
        { path: '/signup', expectTopBar: false, expectPadding: false },
        { path: '/dashboard', expectTopBar: true, expectPadding: true },
        { path: '/calendar', expectTopBar: true, expectPadding: true },
        { path: '/settings', expectTopBar: true, expectPadding: true }
      ];

      testPages.forEach(({ path, expectTopBar, expectPadding }) => {
        mockUsePathname.mockReturnValue(path);
        
        const { unmount } = render(
          <RootLayoutInner>
            <div>Content for {path}</div>
          </RootLayoutInner>
        );

        if (expectTopBar) {
          expect(screen.getByTestId('top-bar')).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('top-bar')).not.toBeInTheDocument();
        }

        const mainElement = screen.getByRole('main');
        if (expectPadding) {
          expect(mainElement).toHaveClass('px-4');
          expect(mainElement).toHaveClass('py-6');
        } else {
          expect(mainElement).not.toHaveClass('px-4');
          expect(mainElement).not.toHaveClass('py-6');
        }

        // Always wrapped in SupabaseProvider
        expect(screen.getByTestId('supabase-provider')).toBeInTheDocument();

        unmount();
      });
    });

    test('should render children correctly in all scenarios', () => {
      const testContent = <div data-testid="test-content">Test Content</div>;
      
      const testPaths = ['/', '/login', '/signup', '/dashboard', '/calendar'];
      
      testPaths.forEach(path => {
        mockUsePathname.mockReturnValue(path);
        
        const { unmount } = render(
          <RootLayoutInner>
            {testContent}
          </RootLayoutInner>
        );

        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Responsive Behavior', () => {
    test('should apply responsive padding classes', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      
      render(
        <RootLayoutInner>
          <div>Dashboard Content</div>
        </RootLayoutInner>
      );

      const mainElement = screen.getByRole('main');
      
      // Check that the padding classes are applied
      expect(mainElement).toHaveClass('px-4'); // Horizontal padding
      expect(mainElement).toHaveClass('py-6'); // Vertical padding
    });

    test('should maintain clean layout on auth pages regardless of screen size', () => {
      const authPages = ['/', '/login', '/signup'];
      
      authPages.forEach(path => {
        mockUsePathname.mockReturnValue(path);
        
        const { unmount } = render(
          <RootLayoutInner>
            <div>Auth Content</div>
          </RootLayoutInner>
        );

        const mainElement = screen.getByRole('main');
        
        // Should have no padding classes for clean, full-screen design
        expect(mainElement.className).toBe('');
        
        unmount();
      });
    });
  });
});
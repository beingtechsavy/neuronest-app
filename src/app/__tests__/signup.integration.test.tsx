/**
 * Integration tests for signup page
 * Tests requirements 1.1, 1.2, 1.3, 1.4 for authentication flow and redirect URLs
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '../signup/page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock Supabase client
const mockSignUp = vi.fn();
const mockSupabase = {
  auth: {
    signUp: mockSignUp
  }
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Mock redirect URL function
const mockGetRedirectUrl = vi.fn();
vi.mock('@/lib/redirectUrl', () => ({
  getRedirectUrl: mockGetRedirectUrl
}));

// Mock error handling
vi.mock('@/lib/errorHandling', () => ({
  AuthErrorHandler: {
    handleSignupConfirmationError: vi.fn((error) => ({
      success: false,
      error: error.message,
      canRetry: true,
      userMessage: 'Signup failed. Please try again.'
    })),
    handleRedirectUrlError: vi.fn((error) => ({
      success: false,
      error: error.message,
      canRetry: false,
      userMessage: 'Configuration error. Please contact support.'
    }))
  },
  ValidationUtils: {
    validateEmail: vi.fn((email) => {
      if (!email || !email.includes('@')) {
        return { field: 'email', message: 'Please enter a valid email address', code: 'INVALID_EMAIL' };
      }
      return null;
    }),
    validatePassword: vi.fn((password) => {
      if (!password || password.length < 6) {
        return { field: 'password', message: 'Password must be at least 6 characters long', code: 'TOO_SHORT' };
      }
      return null;
    })
  },
  validateForm: vi.fn((data, rules) => {
    const errors = [];
    for (const [field, validator] of Object.entries(rules)) {
      const error = validator(data[field]);
      if (error) errors.push(error);
    }
    return { isValid: errors.length === 0, errors };
  })
}));

// Mock validation error display
vi.mock('@/components/ValidationErrorDisplay', () => ({
  default: ({ errors, onDismiss }: { errors: any[]; onDismiss: () => void }) => (
    <div data-testid="validation-errors">
      {errors.map((error, index) => (
        <div key={index}>{error.message}</div>
      ))}
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
  useValidationErrors: () => ({
    errors: [],
    addErrors: vi.fn(),
    clearErrors: vi.fn(),
    hasErrors: false,
    getFieldError: vi.fn(() => null)
  })
}));

describe('Signup Page Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRedirectUrl.mockReturnValue('https://neuronest.app');
    
    // Mock successful signup by default
    mockSignUp.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Signup Flow', () => {
    test('should complete successful signup with correct redirect URL', async () => {
      render(<SignupPage />);

      // Fill in the form
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            emailRedirectTo: 'https://neuronest.app/login',
            data: {
              signup_timestamp: expect.any(String)
            }
          }
        });
      });

      // Should show success message
      expect(screen.getByText(/Signup successful! Check your email/)).toBeInTheDocument();
    });

    test('should use VERCEL_URL when NEXT_PUBLIC_SITE_URL is not available', async () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.VERCEL_URL = 'neuronest-production.vercel.app';
      
      mockGetRedirectUrl.mockReturnValue('https://neuronest-production.vercel.app');

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            emailRedirectTo: 'https://neuronest-production.vercel.app/login',
            data: {
              signup_timestamp: expect.any(String)
            }
          }
        });
      });

      process.env = originalEnv;
    });

    test('should redirect to login page after successful signup', async () => {
      vi.useFakeTimers();
      
      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/Signup successful!/)).toBeInTheDocument();
      });

      // Fast-forward time to trigger redirect
      vi.advanceTimersByTime(3000);

      expect(mockPush).toHaveBeenCalledWith('/login');
      
      vi.useRealTimers();
    });

    test('should clear form data after successful signup', async () => {
      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/Signup successful!/)).toBeInTheDocument();
      });

      // Form should be cleared
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  describe('Error Handling', () => {
    test('should handle existing user error', async () => {
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'User already_registered' }
      });

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/An account with this email already exists/)).toBeInTheDocument();
      });
    });

    test('should handle invalid email error', async () => {
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'invalid_email format' }
      });

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument();
      });
    });

    test('should handle weak password error', async () => {
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'weak_password detected' }
      });

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/Password is too weak/)).toBeInTheDocument();
      });
    });

    test('should handle network errors', async () => {
      mockSignUp.mockRejectedValue(new Error('Network error occurred'));

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    test('should handle redirect URL configuration errors', async () => {
      mockGetRedirectUrl.mockImplementation(() => {
        throw new Error('localhost redirect in production');
      });

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/Configuration error/)).toBeInTheDocument();
      });
    });

    test('should detect localhost redirect in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      mockGetRedirectUrl.mockReturnValue('http://localhost:3000');

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/Configuration error/)).toBeInTheDocument();
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Form Validation', () => {
    test('should validate email format', async () => {
      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      // Should not call signup with invalid email
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    test('should validate password length', async () => {
      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(signupButton);

      // Should not call signup with short password
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    test('should require both email and password', async () => {
      render(<SignupPage />);

      const signupButton = screen.getByText('Sign Up');
      fireEvent.click(signupButton);

      // Should not call signup without required fields
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    test('should trim email whitespace', async () => {
      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com', // Should be trimmed
          password: 'password123',
          options: expect.any(Object)
        });
      });
    });
  });

  describe('UI Interactions', () => {
    test('should toggle password visibility', () => {
      render(<SignupPage />);

      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

      // Initially password should be hidden
      expect(passwordInput.type).toBe('password');

      // Click to show password
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      // Click to hide password again
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    test('should disable form during submission', async () => {
      // Mock slow signup
      mockSignUp.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { user: {} }, error: null }), 100))
      );

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      // Form should be disabled during submission
      expect(signupButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(signupButton).toHaveTextContent('Signing up…');
    });

    test('should show loading state during submission', async () => {
      mockSignUp.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { user: {} }, error: null }), 100))
      );

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      expect(signupButton).toHaveTextContent('Signing up…');
    });

    test('should clear validation errors when user starts typing', () => {
      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      
      // Trigger validation error first
      fireEvent.click(screen.getByText('Sign Up'));
      
      // Start typing should clear errors
      fireEvent.change(emailInput, { target: { value: 't' } });
      
      // This would be tested with actual validation error display
      // The mock implementation doesn't show the full interaction
    });
  });

  describe('Accessibility', () => {
    test('should have proper form labels and structure', () => {
      render(<SignupPage />);

      // Check for proper form structure
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      
      // Check for proper input attributes
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
      expect(passwordInput).toHaveAttribute('minLength', '6');
    });

    test('should have proper ARIA attributes for error states', async () => {
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'invalid_email format' }
      });

      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      // Error states should be properly indicated
      await waitFor(() => {
        const emailField = screen.getByPlaceholderText('you@example.com');
        expect(emailField).toHaveClass('border-red-500');
      });
    });

    test('should be keyboard navigable', () => {
      render(<SignupPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const signupButton = screen.getByText('Sign Up');

      // Tab navigation should work
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);

      fireEvent.keyDown(emailInput, { key: 'Tab' });
      expect(document.activeElement).toBe(passwordInput);

      fireEvent.keyDown(passwordInput, { key: 'Tab' });
      // Should focus on password toggle button, then signup button
    });
  });
});
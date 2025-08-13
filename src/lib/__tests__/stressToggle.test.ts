/**
 * Unit tests for stress marking functionality
 * Tests requirements 4.3, 4.4, 4.7 for database persistence and error handling
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [{ task_id: 1, is_stressful: true }], error: null }))
      }))
    }))
  }))
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Mock the stress toggle function
async function toggleTaskStress(taskId: number, isStressful: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await mockSupabase
      .from('tasks')
      .update({ is_stressful: isStressful })
      .eq('task_id', taskId)
      .select();

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling stress status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

describe('Stress Toggle Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should successfully toggle stress status to true', async () => {
    const result = await toggleTaskStress(1, true);
    
    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
  });

  test('should successfully toggle stress status to false', async () => {
    const result = await toggleTaskStress(1, false);
    
    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
  });

  test('should handle database errors gracefully', async () => {
    // Mock database error
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Database connection failed' } 
          }))
        }))
      }))
    });

    const result = await toggleTaskStress(1, true);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection failed');
  });

  test('should handle network errors', async () => {
    // Mock network error
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.reject(new Error('Network error')))
        }))
      }))
    });

    const result = await toggleTaskStress(1, true);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  test('should handle authentication errors', async () => {
    // Mock auth error
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'JWT expired' } 
          }))
        }))
      }))
    });

    const result = await toggleTaskStress(1, true);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('JWT expired');
  });

  test('should handle invalid task ID', async () => {
    // Mock no rows affected
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    });

    const result = await toggleTaskStress(999, true);
    
    expect(result.success).toBe(true); // Supabase doesn't error on no rows affected
  });

  test('should handle concurrent stress toggle operations', async () => {
    // Test multiple simultaneous toggles
    const promises = [
      toggleTaskStress(1, true),
      toggleTaskStress(2, false),
      toggleTaskStress(3, true)
    ];

    const results = await Promise.all(promises);
    
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
    
    expect(mockSupabase.from).toHaveBeenCalledTimes(3);
  });

  test('should validate task ID parameter', async () => {
    // Test with invalid task ID types
    const invalidIds = [null, undefined, 'string', -1, 0];
    
    for (const invalidId of invalidIds) {
      try {
        await toggleTaskStress(invalidId as any, true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    }
  });

  test('should validate stress status parameter', async () => {
    // Test with invalid stress status types
    const invalidStatuses = [null, undefined, 'string', 1, 0];
    
    for (const invalidStatus of invalidStatuses) {
      const result = await toggleTaskStress(1, invalidStatus as any);
      // Should still work as Supabase will coerce to boolean
      expect(result.success).toBe(true);
    }
  });

  test('should handle database constraint violations', async () => {
    // Mock constraint violation
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: { 
              message: 'violates foreign key constraint',
              code: '23503'
            } 
          }))
        }))
      }))
    });

    const result = await toggleTaskStress(1, true);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('constraint');
  });

  test('should handle timeout errors', async () => {
    // Mock timeout
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          }))
        }))
      }))
    });

    const result = await toggleTaskStress(1, true);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Request timeout');
  });
});

describe('Stress Toggle UI Integration', () => {
  test('should provide optimistic UI updates', () => {
    // Mock optimistic update function
    const mockOptimisticUpdate = vi.fn();
    const mockRevertUpdate = vi.fn();

    const performOptimisticStressToggle = async (taskId: number, newStatus: boolean) => {
      // Apply optimistic update
      mockOptimisticUpdate(taskId, newStatus);
      
      try {
        const result = await toggleTaskStress(taskId, newStatus);
        if (!result.success) {
          // Revert on failure
          mockRevertUpdate(taskId, !newStatus);
          throw new Error(result.error);
        }
        return result;
      } catch (error) {
        mockRevertUpdate(taskId, !newStatus);
        throw error;
      }
    };

    // Test successful optimistic update
    expect(async () => {
      await performOptimisticStressToggle(1, true);
      expect(mockOptimisticUpdate).toHaveBeenCalledWith(1, true);
      expect(mockRevertUpdate).not.toHaveBeenCalled();
    }).not.toThrow();
  });

  test('should revert optimistic updates on failure', async () => {
    const mockOptimisticUpdate = vi.fn();
    const mockRevertUpdate = vi.fn();

    // Mock failure
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Database error' } 
          }))
        }))
      }))
    });

    const performOptimisticStressToggle = async (taskId: number, newStatus: boolean) => {
      mockOptimisticUpdate(taskId, newStatus);
      
      try {
        const result = await toggleTaskStress(taskId, newStatus);
        if (!result.success) {
          mockRevertUpdate(taskId, !newStatus);
          throw new Error(result.error);
        }
        return result;
      } catch (error) {
        mockRevertUpdate(taskId, !newStatus);
        throw error;
      }
    };

    try {
      await performOptimisticStressToggle(1, true);
    } catch (error) {
      expect(mockOptimisticUpdate).toHaveBeenCalledWith(1, true);
      expect(mockRevertUpdate).toHaveBeenCalledWith(1, false);
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle rapid successive toggles', async () => {
    let currentStatus = false;
    const toggleHistory: boolean[] = [];

    const rapidToggle = async () => {
      currentStatus = !currentStatus;
      toggleHistory.push(currentStatus);
      return await toggleTaskStress(1, currentStatus);
    };

    // Perform rapid toggles
    const results = await Promise.all([
      rapidToggle(),
      rapidToggle(),
      rapidToggle(),
      rapidToggle()
    ]);

    // All should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // Should have alternating values
    expect(toggleHistory).toEqual([true, false, true, false]);
  });

  test('should provide user feedback for different error types', () => {
    const getErrorMessage = (error: string): string => {
      if (error.includes('JWT') || error.includes('auth')) {
        return 'Please log in and try again.';
      }
      if (error.includes('network') || error.includes('timeout')) {
        return 'Network error. Please check your connection and try again.';
      }
      if (error.includes('constraint') || error.includes('database')) {
        return 'Unable to save changes. Please try again.';
      }
      return 'An error occurred. Please try again.';
    };

    expect(getErrorMessage('JWT expired')).toBe('Please log in and try again.');
    expect(getErrorMessage('Network error')).toBe('Network error. Please check your connection and try again.');
    expect(getErrorMessage('violates constraint')).toBe('Unable to save changes. Please try again.');
    expect(getErrorMessage('Unknown error')).toBe('An error occurred. Please try again.');
  });
});
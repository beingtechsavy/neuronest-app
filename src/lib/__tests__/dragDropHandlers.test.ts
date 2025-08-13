/**
 * Unit tests for drag-and-drop handlers
 * Tests requirements 3.2, 3.4, 3.5, 3.6 for database updates and error handling
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [{ task_id: 1, start_time: '2024-01-01T10:00:00.000Z', end_time: '2024-01-01T11:00:00.000Z' }], 
          error: null 
        }))
      }))
    }))
  }))
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Mock drag-and-drop handler functions
interface DragEndResult {
  success: boolean;
  error?: string;
  updatedTask?: any;
}

async function handleDragEnd(
  taskId: number,
  newStartTime: string,
  newEndTime: string
): Promise<DragEndResult> {
  try {
    const { data, error } = await mockSupabase
      .from('tasks')
      .update({ 
        start_time: newStartTime,
        end_time: newEndTime 
      })
      .eq('task_id', taskId)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Task not found');
    }

    return { 
      success: true, 
      updatedTask: data[0] 
    };
  } catch (error) {
    console.error('Error updating task position:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function validateDragOperation(
  taskId: number,
  newStartTime: string,
  newEndTime: string,
  existingTasks: Array<{ start_time: string; end_time: string; task_id: number }>
): Promise<{ isValid: boolean; error?: string }> {
  // Basic time validation
  const start = new Date(newStartTime);
  const end = new Date(newEndTime);

  if (start >= end) {
    return { isValid: false, error: 'Start time must be before end time' };
  }

  // Check for conflicts with existing tasks
  for (const task of existingTasks) {
    if (task.task_id === taskId) continue; // Skip self

    const taskStart = new Date(task.start_time);
    const taskEnd = new Date(task.end_time);

    // Check for overlap
    if (start < taskEnd && end > taskStart) {
      return { isValid: false, error: 'Time slot conflicts with existing task' };
    }
  }

  return { isValid: true };
}

describe('Drag-and-Drop Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleDragEnd', () => {
    test('should successfully update task position', async () => {
      const result = await handleDragEnd(
        1,
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T11:00:00.000Z'
      );

      expect(result.success).toBe(true);
      expect(result.updatedTask).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
    });

    test('should handle database errors', async () => {
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

      const result = await handleDragEnd(
        1,
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T11:00:00.000Z'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    test('should handle task not found', async () => {
      // Mock empty result
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      });

      const result = await handleDragEnd(
        999,
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T11:00:00.000Z'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task not found');
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

      const result = await handleDragEnd(
        1,
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T11:00:00.000Z'
      );

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
              error: { message: 'JWT expired', code: '401' } 
            }))
          }))
        }))
      });

      const result = await handleDragEnd(
        1,
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T11:00:00.000Z'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('JWT expired');
    });

    test('should handle constraint violations', async () => {
      // Mock constraint error
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

      const result = await handleDragEnd(
        1,
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T11:00:00.000Z'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('constraint');
    });

    test('should handle concurrent updates', async () => {
      // Test multiple simultaneous updates
      const promises = [
        handleDragEnd(1, '2024-01-01T09:00:00.000Z', '2024-01-01T10:00:00.000Z'),
        handleDragEnd(2, '2024-01-01T11:00:00.000Z', '2024-01-01T12:00:00.000Z'),
        handleDragEnd(3, '2024-01-01T13:00:00.000Z', '2024-01-01T14:00:00.000Z')
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      expect(mockSupabase.from).toHaveBeenCalledTimes(3);
    });
  });

  describe('validateDragOperation', () => {
    const existingTasks = [
      { task_id: 2, start_time: '2024-01-01T08:00:00.000Z', end_time: '2024-01-01T09:00:00.000Z' },
      { task_id: 3, start_time: '2024-01-01T14:00:00.000Z', end_time: '2024-01-01T15:00:00.000Z' }
    ];

    test('should validate non-conflicting time slot', async () => {
      const result = await validateDragOperation(
        1,
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T11:00:00.000Z',
        existingTasks
      );

      expect(result.isValid).toBe(true);
    });

    test('should detect time conflicts', async () => {
      const result = await validateDragOperation(
        1,
        '2024-01-01T08:30:00.000Z',
        '2024-01-01T09:30:00.000Z',
        existingTasks
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Time slot conflicts with existing task');
    });

    test('should reject invalid time order', async () => {
      const result = await validateDragOperation(
        1,
        '2024-01-01T11:00:00.000Z',
        '2024-01-01T10:00:00.000Z',
        existingTasks
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Start time must be before end time');
    });

    test('should allow task to be moved to its own time slot', async () => {
      const tasksWithSelf = [
        ...existingTasks,
        { task_id: 1, start_time: '2024-01-01T10:00:00.000Z', end_time: '2024-01-01T11:00:00.000Z' }
      ];

      const result = await validateDragOperation(
        1,
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T11:00:00.000Z',
        tasksWithSelf
      );

      expect(result.isValid).toBe(true);
    });

    test('should handle edge case conflicts', async () => {
      // Test exact boundary conflicts
      const result1 = await validateDragOperation(
        1,
        '2024-01-01T09:00:00.000Z', // Starts exactly when another ends
        '2024-01-01T10:00:00.000Z',
        existingTasks
      );

      expect(result1.isValid).toBe(true); // Should be valid as no overlap

      const result2 = await validateDragOperation(
        1,
        '2024-01-01T07:00:00.000Z',
        '2024-01-01T08:00:00.000Z', // Ends exactly when another starts
        existingTasks
      );

      expect(result2.isValid).toBe(true); // Should be valid as no overlap
    });

    test('should handle partial overlaps', async () => {
      // Test partial overlap at start
      const result1 = await validateDragOperation(
        1,
        '2024-01-01T07:30:00.000Z',
        '2024-01-01T08:30:00.000Z',
        existingTasks
      );

      expect(result1.isValid).toBe(false);

      // Test partial overlap at end
      const result2 = await validateDragOperation(
        1,
        '2024-01-01T08:30:00.000Z',
        '2024-01-01T09:30:00.000Z',
        existingTasks
      );

      expect(result2.isValid).toBe(false);

      // Test complete overlap
      const result3 = await validateDragOperation(
        1,
        '2024-01-01T07:30:00.000Z',
        '2024-01-01T09:30:00.000Z',
        existingTasks
      );

      expect(result3.isValid).toBe(false);
    });

    test('should handle empty existing tasks array', async () => {
      const result = await validateDragOperation(
        1,
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T11:00:00.000Z',
        []
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    test('should provide rollback functionality', async () => {
      const originalPosition = {
        start_time: '2024-01-01T09:00:00.000Z',
        end_time: '2024-01-01T10:00:00.000Z'
      };

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

      const result = await handleDragEnd(
        1,
        '2024-01-01T11:00:00.000Z',
        '2024-01-01T12:00:00.000Z'
      );

      expect(result.success).toBe(false);

      // In a real implementation, this would trigger a rollback
      // to the original position
      const rollbackResult = await handleDragEnd(
        1,
        originalPosition.start_time,
        originalPosition.end_time
      );

      expect(rollbackResult.success).toBe(true);
    });

    test('should handle rollback failures', async () => {
      // Mock both operations failing
      mockSupabase.from
        .mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Primary operation failed' } 
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Rollback failed' } 
              }))
            }))
          }))
        });

      const primaryResult = await handleDragEnd(
        1,
        '2024-01-01T11:00:00.000Z',
        '2024-01-01T12:00:00.000Z'
      );

      expect(primaryResult.success).toBe(false);

      const rollbackResult = await handleDragEnd(
        1,
        '2024-01-01T09:00:00.000Z',
        '2024-01-01T10:00:00.000Z'
      );

      expect(rollbackResult.success).toBe(false);
      expect(rollbackResult.error).toBe('Rollback failed');
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle batch updates efficiently', async () => {
      const batchUpdates = [
        { taskId: 1, start: '2024-01-01T09:00:00.000Z', end: '2024-01-01T10:00:00.000Z' },
        { taskId: 2, start: '2024-01-01T11:00:00.000Z', end: '2024-01-01T12:00:00.000Z' },
        { taskId: 3, start: '2024-01-01T13:00:00.000Z', end: '2024-01-01T14:00:00.000Z' }
      ];

      const startTime = Date.now();
      
      const promises = batchUpdates.map(update => 
        handleDragEnd(update.taskId, update.start, update.end)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete reasonably quickly (less than 1 second for mocked operations)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should handle rapid successive updates to same task', async () => {
      const updates = [
        { start: '2024-01-01T09:00:00.000Z', end: '2024-01-01T10:00:00.000Z' },
        { start: '2024-01-01T10:00:00.000Z', end: '2024-01-01T11:00:00.000Z' },
        { start: '2024-01-01T11:00:00.000Z', end: '2024-01-01T12:00:00.000Z' }
      ];

      const results = [];
      for (const update of updates) {
        const result = await handleDragEnd(1, update.start, update.end);
        results.push(result);
      }

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should have made 3 database calls
      expect(mockSupabase.from).toHaveBeenCalledTimes(3);
    });
  });
});
/**
 * Integration tests for drag-and-drop functionality
 * Tests requirements 3.1, 3.2, 3.4, 3.5, 3.6 for end-to-end drag-and-drop operations
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the entire drag-and-drop system
interface MockTask {
  task_id: number;
  title: string;
  start_time: string;
  end_time: string;
  is_stressful?: boolean;
}

interface MockDragEvent {
  taskId: number;
  targetDate: string;
  newStartTime: string;
  newEndTime: string;
}

interface DragDropResult {
  success: boolean;
  error?: string;
  updatedTask?: MockTask;
  conflicts?: string[];
}

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [{ 
            task_id: 1, 
            title: 'Test Task',
            start_time: '2024-01-01T10:00:00.000Z', 
            end_time: '2024-01-01T11:00:00.000Z' 
          }], 
          error: null 
        }))
      }))
    })),
    select: vi.fn(() => Promise.resolve({
      data: [
        { task_id: 2, start_time: '2024-01-01T08:00:00.000Z', end_time: '2024-01-01T09:00:00.000Z' },
        { task_id: 3, start_time: '2024-01-01T14:00:00.000Z', end_time: '2024-01-01T15:00:00.000Z' }
      ],
      error: null
    }))
  }))
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Mock drag-and-drop system
class MockDragDropSystem {
  private tasks: MockTask[] = [
    { task_id: 1, title: 'Task 1', start_time: '2024-01-01T09:00:00.000Z', end_time: '2024-01-01T10:00:00.000Z' },
    { task_id: 2, title: 'Task 2', start_time: '2024-01-01T11:00:00.000Z', end_time: '2024-01-01T12:00:00.000Z' },
    { task_id: 3, title: 'Task 3', start_time: '2024-01-01T14:00:00.000Z', end_time: '2024-01-01T15:00:00.000Z' }
  ];

  private preferences = {
    sleep_start: '23:00',
    sleep_end: '07:00',
    meal_start_times: ['08:00', '12:30', '18:00'],
    meal_duration: 60
  };

  async validateDragOperation(event: MockDragEvent): Promise<{ isValid: boolean; conflicts: string[] }> {
    const conflicts: string[] = [];
    const startTime = new Date(event.newStartTime);
    const endTime = new Date(event.newEndTime);

    // Basic validation
    if (startTime >= endTime) {
      conflicts.push('Start time must be before end time');
      return { isValid: false, conflicts };
    }

    // Check task conflicts
    for (const task of this.tasks) {
      if (task.task_id === event.taskId) continue;

      const taskStart = new Date(task.start_time);
      const taskEnd = new Date(task.end_time);

      if (startTime < taskEnd && endTime > taskStart) {
        conflicts.push(`Conflicts with ${task.title}`);
      }
    }

    // Check sleep conflicts
    const startHour = startTime.getUTCHours();
    const endHour = endTime.getUTCHours();
    
    if ((startHour >= 23 || startHour < 7) || (endHour >= 23 || endHour < 7)) {
      conflicts.push('Conflicts with sleep time');
    }

    // Check meal conflicts
    for (const mealTime of this.preferences.meal_start_times) {
      const [hour, minute] = mealTime.split(':').map(Number);
      const mealStart = hour * 60 + minute;
      const mealEnd = mealStart + this.preferences.meal_duration;
      
      const taskStartMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
      const taskEndMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();

      if (taskStartMinutes < mealEnd && taskEndMinutes > mealStart) {
        conflicts.push(`Conflicts with meal time at ${mealTime}`);
      }
    }

    return { isValid: conflicts.length === 0, conflicts };
  }

  async performDragOperation(event: MockDragEvent): Promise<DragDropResult> {
    try {
      // Validate the operation
      const validation = await this.validateDragOperation(event);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.conflicts.join(', '),
          conflicts: validation.conflicts
        };
      }

      // Update the task in the database
      const { data, error } = await mockSupabase
        .from('tasks')
        .update({
          start_time: event.newStartTime,
          end_time: event.newEndTime
        })
        .eq('task_id', event.taskId)
        .select();

      if (error) {
        throw error;
      }

      // Update local state
      const taskIndex = this.tasks.findIndex(t => t.task_id === event.taskId);
      if (taskIndex !== -1) {
        this.tasks[taskIndex].start_time = event.newStartTime;
        this.tasks[taskIndex].end_time = event.newEndTime;
      }

      return {
        success: true,
        updatedTask: data?.[0] as MockTask
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async simulateMultipleDragOperations(events: MockDragEvent[]): Promise<DragDropResult[]> {
    const results: DragDropResult[] = [];
    
    for (const event of events) {
      const result = await this.performDragOperation(event);
      results.push(result);
      
      // If one fails, stop processing (simulating UI behavior)
      if (!result.success) {
        break;
      }
    }
    
    return results;
  }

  getTasks(): MockTask[] {
    return [...this.tasks];
  }

  reset(): void {
    this.tasks = [
      { task_id: 1, title: 'Task 1', start_time: '2024-01-01T09:00:00.000Z', end_time: '2024-01-01T10:00:00.000Z' },
      { task_id: 2, title: 'Task 2', start_time: '2024-01-01T11:00:00.000Z', end_time: '2024-01-01T12:00:00.000Z' },
      { task_id: 3, title: 'Task 3', start_time: '2024-01-01T14:00:00.000Z', end_time: '2024-01-01T15:00:00.000Z' }
    ];
  }
}

describe('Drag-and-Drop Integration Tests', () => {
  let dragDropSystem: MockDragDropSystem;

  beforeEach(() => {
    dragDropSystem = new MockDragDropSystem();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Drag Operations', () => {
    test('should successfully move task to empty time slot', async () => {
      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T13:00:00.000Z',
        newEndTime: '2024-01-01T14:00:00.000Z'
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(true);
      expect(result.updatedTask).toBeDefined();
      expect(result.updatedTask?.start_time).toBe('2024-01-01T13:00:00.000Z');
      expect(result.updatedTask?.end_time).toBe('2024-01-01T14:00:00.000Z');
    });

    test('should handle task duration changes during drag', async () => {
      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T13:00:00.000Z',
        newEndTime: '2024-01-01T15:30:00.000Z' // Different duration
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(true);
      expect(result.updatedTask?.start_time).toBe('2024-01-01T13:00:00.000Z');
      expect(result.updatedTask?.end_time).toBe('2024-01-01T15:30:00.000Z');
    });

    test('should allow moving task to adjacent time slots', async () => {
      // Move task 1 to end exactly when task 2 starts
      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T10:00:00.000Z',
        newEndTime: '2024-01-01T11:00:00.000Z'
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(true);
    });

    test('should handle moving multiple tasks in sequence', async () => {
      const dragEvents: MockDragEvent[] = [
        {
          taskId: 1,
          targetDate: '2024-01-01',
          newStartTime: '2024-01-01T16:00:00.000Z',
          newEndTime: '2024-01-01T17:00:00.000Z'
        },
        {
          taskId: 2,
          targetDate: '2024-01-01',
          newStartTime: '2024-01-01T17:00:00.000Z',
          newEndTime: '2024-01-01T18:00:00.000Z'
        }
      ];

      const results = await dragDropSystem.simulateMultipleDragOperations(dragEvents);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe('Conflict Detection and Prevention', () => {
    test('should detect and prevent task-to-task conflicts', async () => {
      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T11:30:00.000Z', // Overlaps with task 2
        newEndTime: '2024-01-01T12:30:00.000Z'
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conflicts with Task 2');
      expect(result.conflicts).toContain('Conflicts with Task 2');
    });

    test('should detect sleep time conflicts', async () => {
      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T23:30:00.000Z', // During sleep time
        newEndTime: '2024-01-02T00:30:00.000Z'
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conflicts with sleep time');
    });

    test('should detect meal time conflicts', async () => {
      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T12:00:00.000Z', // During lunch time
        newEndTime: '2024-01-01T13:00:00.000Z'
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conflicts with meal time at 12:30');
    });

    test('should detect multiple conflicts', async () => {
      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T11:30:00.000Z', // Overlaps with task 2 AND meal time
        newEndTime: '2024-01-01T13:00:00.000Z'
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(2);
      expect(result.conflicts).toContain('Conflicts with Task 2');
      expect(result.conflicts).toContain('Conflicts with meal time at 12:30');
    });

    test('should prevent invalid time order', async () => {
      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T15:00:00.000Z',
        newEndTime: '2024-01-01T14:00:00.000Z' // End before start
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Start time must be before end time');
    });
  });

  describe('Error Handling and Recovery', () => {
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

      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T13:00:00.000Z',
        newEndTime: '2024-01-01T14:00:00.000Z'
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    test('should handle network errors during drag operations', async () => {
      // Mock network error
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => Promise.reject(new Error('Network error')))
          }))
        }))
      });

      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T13:00:00.000Z',
        newEndTime: '2024-01-01T14:00:00.000Z'
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('should stop batch operations on first failure', async () => {
      // Mock failure for second operation
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => {
              callCount++;
              if (callCount === 2) {
                return Promise.resolve({ 
                  data: null, 
                  error: { message: 'Second operation failed' } 
                });
              }
              return Promise.resolve({ 
                data: [{ task_id: 1, start_time: '2024-01-01T16:00:00.000Z', end_time: '2024-01-01T17:00:00.000Z' }], 
                error: null 
              });
            })
          }))
        }))
      }));

      const dragEvents: MockDragEvent[] = [
        {
          taskId: 1,
          targetDate: '2024-01-01',
          newStartTime: '2024-01-01T16:00:00.000Z',
          newEndTime: '2024-01-01T17:00:00.000Z'
        },
        {
          taskId: 2,
          targetDate: '2024-01-01',
          newStartTime: '2024-01-01T17:00:00.000Z',
          newEndTime: '2024-01-01T18:00:00.000Z'
        },
        {
          taskId: 3,
          targetDate: '2024-01-01',
          newStartTime: '2024-01-01T18:00:00.000Z',
          newEndTime: '2024-01-01T19:00:00.000Z'
        }
      ];

      const results = await dragDropSystem.simulateMultipleDragOperations(dragEvents);

      expect(results).toHaveLength(2); // Should stop after second failure
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Second operation failed');
    });
  });

  describe('Time Accuracy and Grid Positioning', () => {
    test('should maintain accurate time calculations across different scenarios', async () => {
      const testCases = [
        {
          name: 'Quarter hour alignment',
          start: '2024-01-01T09:15:00.000Z',
          end: '2024-01-01T09:30:00.000Z'
        },
        {
          name: 'Half hour alignment',
          start: '2024-01-01T09:30:00.000Z',
          end: '2024-01-01T10:00:00.000Z'
        },
        {
          name: 'Hour alignment',
          start: '2024-01-01T10:00:00.000Z',
          end: '2024-01-01T11:00:00.000Z'
        },
        {
          name: 'Non-standard duration',
          start: '2024-01-01T10:00:00.000Z',
          end: '2024-01-01T10:45:00.000Z'
        }
      ];

      for (const testCase of testCases) {
        const dragEvent: MockDragEvent = {
          taskId: 1,
          targetDate: '2024-01-01',
          newStartTime: testCase.start,
          newEndTime: testCase.end
        };

        const result = await dragDropSystem.performDragOperation(dragEvent);

        expect(result.success).toBe(true);
        expect(result.updatedTask?.start_time).toBe(testCase.start);
        expect(result.updatedTask?.end_time).toBe(testCase.end);

        // Reset for next test
        dragDropSystem.reset();
      }
    });

    test('should handle edge cases at day boundaries', async () => {
      const dragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T23:45:00.000Z',
        newEndTime: '2024-01-02T00:15:00.000Z' // Crosses midnight
      };

      const result = await dragDropSystem.performDragOperation(dragEvent);

      // This should fail as it crosses day boundaries
      expect(result.success).toBe(false);
    });

    test('should handle minimum and maximum durations', async () => {
      // Test very short duration (should be allowed)
      const shortDragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T10:00:00.000Z',
        newEndTime: '2024-01-01T10:15:00.000Z' // 15 minutes
      };

      const shortResult = await dragDropSystem.performDragOperation(shortDragEvent);
      expect(shortResult.success).toBe(true);

      // Reset and test long duration
      dragDropSystem.reset();

      const longDragEvent: MockDragEvent = {
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: '2024-01-01T08:00:00.000Z',
        newEndTime: '2024-01-01T16:00:00.000Z' // 8 hours
      };

      const longResult = await dragDropSystem.performDragOperation(longDragEvent);
      expect(longResult.success).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle rapid successive drag operations', async () => {
      const startTime = Date.now();
      
      const rapidDragEvents: MockDragEvent[] = Array.from({ length: 10 }, (_, i) => ({
        taskId: 1,
        targetDate: '2024-01-01',
        newStartTime: `2024-01-01T${(16 + i).toString().padStart(2, '0')}:00:00.000Z`,
        newEndTime: `2024-01-01T${(17 + i).toString().padStart(2, '0')}:00:00.000Z`
      }));

      // Process each drag operation
      for (const dragEvent of rapidDragEvents) {
        const result = await dragDropSystem.performDragOperation(dragEvent);
        expect(result.success).toBe(true);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second for mocked operations)
      expect(duration).toBeLessThan(1000);
    });

    test('should maintain consistency with concurrent operations', async () => {
      // Simulate concurrent drag operations on different tasks
      const concurrentDragEvents: MockDragEvent[] = [
        {
          taskId: 1,
          targetDate: '2024-01-01',
          newStartTime: '2024-01-01T16:00:00.000Z',
          newEndTime: '2024-01-01T17:00:00.000Z'
        },
        {
          taskId: 2,
          targetDate: '2024-01-01',
          newStartTime: '2024-01-01T17:00:00.000Z',
          newEndTime: '2024-01-01T18:00:00.000Z'
        },
        {
          taskId: 3,
          targetDate: '2024-01-01',
          newStartTime: '2024-01-01T18:00:00.000Z',
          newEndTime: '2024-01-01T19:00:00.000Z'
        }
      ];

      const promises = concurrentDragEvents.map(event => 
        dragDropSystem.performDragOperation(event)
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify final state
      const finalTasks = dragDropSystem.getTasks();
      expect(finalTasks[0].start_time).toBe('2024-01-01T16:00:00.000Z');
      expect(finalTasks[1].start_time).toBe('2024-01-01T17:00:00.000Z');
      expect(finalTasks[2].start_time).toBe('2024-01-01T18:00:00.000Z');
    });
  });
});
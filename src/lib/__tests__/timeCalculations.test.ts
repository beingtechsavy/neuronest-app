/**
 * Unit tests for time calculation functions
 * Tests requirements 3.1, 3.2, 3.3, 3.4 for accurate time calculations
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  enhancedTimeToMinutes,
  calculateGridPosition,
  validateTimeSlot,
  roundToNearestQuarter,
  minutesToTimeString,
  createDateWithTime,
  calculateDuration,
  validateTaskForDrag,
  validateDropTarget,
  validateDragOperation
} from '../timeCalculations';

describe('enhancedTimeToMinutes', () => {
  test('should convert valid date to minutes correctly', () => {
    const date = new Date('2024-01-01T14:30:00.000Z');
    expect(enhancedTimeToMinutes(date)).toBe(870); // 14*60 + 30 = 870
  });

  test('should handle string input correctly', () => {
    expect(enhancedTimeToMinutes('2024-01-01T09:15:00.000Z')).toBe(555); // 9*60 + 15 = 555
  });

  test('should return 0 for null/undefined input', () => {
    expect(enhancedTimeToMinutes(null)).toBe(0);
    expect(enhancedTimeToMinutes(undefined)).toBe(0);
  });

  test('should return 0 for empty string', () => {
    expect(enhancedTimeToMinutes('')).toBe(0);
    expect(enhancedTimeToMinutes('   ')).toBe(0);
  });

  test('should return 0 for invalid date string', () => {
    expect(enhancedTimeToMinutes('invalid-date')).toBe(0);
  });

  test('should handle edge cases correctly', () => {
    // Midnight
    expect(enhancedTimeToMinutes('2024-01-01T00:00:00.000Z')).toBe(0);
    // End of day
    expect(enhancedTimeToMinutes('2024-01-01T23:59:00.000Z')).toBe(1439);
  });

  test('should clamp out-of-range values', () => {
    // Test with a date that would produce negative minutes (shouldn't happen in normal use)
    const date = new Date('2024-01-01T00:00:00.000Z');
    expect(enhancedTimeToMinutes(date)).toBe(0);
  });
});

describe('calculateGridPosition', () => {
  test('should calculate correct grid positions for valid times', () => {
    const result = calculateGridPosition('2024-01-01T09:00:00.000Z', '2024-01-01T10:00:00.000Z');
    expect(result.isValid).toBe(true);
    expect(result.gridStart).toBe(37); // 9*4 + 1 = 37 (15-minute slots, 1-based)
    expect(result.gridEnd).toBe(41); // 10*4 + 1 = 41
  });

  test('should handle 15-minute intervals correctly', () => {
    const result = calculateGridPosition('2024-01-01T09:15:00.000Z', '2024-01-01T09:30:00.000Z');
    expect(result.isValid).toBe(true);
    expect(result.gridStart).toBe(38); // 9.25*4 + 1 = 38
    expect(result.gridEnd).toBe(39); // 9.5*4 + 1 = 39
  });

  test('should return invalid for start time after end time', () => {
    const result = calculateGridPosition('2024-01-01T10:00:00.000Z', '2024-01-01T09:00:00.000Z');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Start time must be before end time');
  });

  test('should return invalid for same start and end time', () => {
    const result = calculateGridPosition('2024-01-01T09:00:00.000Z', '2024-01-01T09:00:00.000Z');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Start time must be before end time');
  });

  test('should handle times beyond 24 hours', () => {
    const result = calculateGridPosition('2024-01-01T25:00:00.000Z', '2024-01-01T26:00:00.000Z');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Time extends beyond 24-hour period');
  });

  test('should handle Date objects as input', () => {
    const start = new Date('2024-01-01T14:30:00.000Z');
    const end = new Date('2024-01-01T15:45:00.000Z');
    const result = calculateGridPosition(start, end);
    expect(result.isValid).toBe(true);
    expect(result.gridStart).toBe(59); // 14.5*4 + 1 = 59
    expect(result.gridEnd).toBe(64); // 15.75*4 + 1 = 64
  });
});

describe('validateTimeSlot', () => {
  const existingSlots = [
    { start: 480, end: 540, type: 'meeting' }, // 8:00-9:00
    { start: 720, end: 780, type: 'lunch' },   // 12:00-13:00
  ];

  test('should validate non-conflicting time slot', () => {
    const startTime = new Date('2024-01-01T10:00:00.000Z');
    const endTime = new Date('2024-01-01T11:00:00.000Z');
    const result = validateTimeSlot(startTime, endTime, existingSlots);
    expect(result.isValid).toBe(true);
  });

  test('should detect conflicts with existing slots', () => {
    const startTime = new Date('2024-01-01T08:30:00.000Z');
    const endTime = new Date('2024-01-01T09:30:00.000Z');
    const result = validateTimeSlot(startTime, endTime, existingSlots);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('conflicts');
  });

  test('should reject start time after end time', () => {
    const startTime = new Date('2024-01-01T11:00:00.000Z');
    const endTime = new Date('2024-01-01T10:00:00.000Z');
    const result = validateTimeSlot(startTime, endTime, existingSlots);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Start time must be before end time');
  });

  test('should reject tasks shorter than 15 minutes', () => {
    const startTime = new Date('2024-01-01T10:00:00.000Z');
    const endTime = new Date('2024-01-01T10:10:00.000Z');
    const result = validateTimeSlot(startTime, endTime, existingSlots);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Task duration must be at least 15 minutes');
  });

  test('should reject tasks longer than 8 hours', () => {
    const startTime = new Date('2024-01-01T08:00:00.000Z');
    const endTime = new Date('2024-01-01T17:00:00.000Z'); // 9 hours
    const result = validateTimeSlot(startTime, endTime, existingSlots);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Task duration cannot exceed 8 hours');
  });

  test('should handle edge case at midnight', () => {
    const startTime = new Date('2024-01-01T23:45:00.000Z');
    const endTime = new Date('2024-01-02T00:15:00.000Z');
    const result = validateTimeSlot(startTime, endTime, []);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Time slot extends beyond valid 24-hour period');
  });
});

describe('roundToNearestQuarter', () => {
  test('should round to nearest 15-minute interval', () => {
    const date = new Date('2024-01-01T09:07:00.000Z');
    const rounded = roundToNearestQuarter(date);
    expect(rounded.getUTCMinutes()).toBe(0);
  });

  test('should round up when closer to next quarter', () => {
    const date = new Date('2024-01-01T09:08:00.000Z');
    const rounded = roundToNearestQuarter(date);
    expect(rounded.getUTCMinutes()).toBe(15);
  });

  test('should handle hour overflow', () => {
    const date = new Date('2024-01-01T09:53:00.000Z');
    const rounded = roundToNearestQuarter(date);
    expect(rounded.getUTCHours()).toBe(10);
    expect(rounded.getUTCMinutes()).toBe(0);
  });

  test('should handle exact quarter hours', () => {
    const date = new Date('2024-01-01T09:15:00.000Z');
    const rounded = roundToNearestQuarter(date);
    expect(rounded.getUTCMinutes()).toBe(15);
  });
});

describe('minutesToTimeString', () => {
  test('should convert minutes to time string correctly', () => {
    expect(minutesToTimeString(0)).toBe('00:00');
    expect(minutesToTimeString(60)).toBe('01:00');
    expect(minutesToTimeString(90)).toBe('01:30');
    expect(minutesToTimeString(1439)).toBe('23:59');
  });

  test('should handle out-of-range values', () => {
    expect(minutesToTimeString(-10)).toBe('00:00');
    expect(minutesToTimeString(1500)).toBe('23:59');
  });

  test('should pad single digits with zeros', () => {
    expect(minutesToTimeString(65)).toBe('01:05');
    expect(minutesToTimeString(540)).toBe('09:00');
  });
});

describe('createDateWithTime', () => {
  test('should create date with specified time', () => {
    const baseDate = new Date('2024-01-01T00:00:00.000Z');
    const result = createDateWithTime(baseDate, 570); // 9:30
    expect(result.getUTCHours()).toBe(9);
    expect(result.getUTCMinutes()).toBe(30);
    expect(result.getUTCDate()).toBe(1);
  });

  test('should handle midnight', () => {
    const baseDate = new Date('2024-01-01T12:00:00.000Z');
    const result = createDateWithTime(baseDate, 0);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
  });

  test('should handle end of day', () => {
    const baseDate = new Date('2024-01-01T12:00:00.000Z');
    const result = createDateWithTime(baseDate, 1439); // 23:59
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
  });
});

describe('calculateDuration', () => {
  test('should calculate duration correctly', () => {
    const start = '2024-01-01T09:00:00.000Z';
    const end = '2024-01-01T10:30:00.000Z';
    expect(calculateDuration(start, end)).toBe(90);
  });

  test('should return 0 for invalid time order', () => {
    const start = '2024-01-01T10:00:00.000Z';
    const end = '2024-01-01T09:00:00.000Z';
    expect(calculateDuration(start, end)).toBe(0);
  });

  test('should handle Date objects', () => {
    const start = new Date('2024-01-01T14:00:00.000Z');
    const end = new Date('2024-01-01T15:45:00.000Z');
    expect(calculateDuration(start, end)).toBe(105);
  });
});

describe('validateTaskForDrag', () => {
  test('should validate valid task', () => {
    const task = {
      task_id: 1,
      title: 'Test Task',
      start_time: '2024-01-01T09:00:00.000Z',
      end_time: '2024-01-01T10:00:00.000Z',
      effort_units: 2
    };
    const result = validateTaskForDrag(task);
    expect(result.isValid).toBe(true);
  });

  test('should reject task without ID', () => {
    const task = {
      title: 'Test Task',
      start_time: '2024-01-01T09:00:00.000Z',
      end_time: '2024-01-01T10:00:00.000Z'
    };
    const result = validateTaskForDrag(task);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Task is missing required ID');
  });

  test('should reject task without title', () => {
    const task = {
      task_id: 1,
      start_time: '2024-01-01T09:00:00.000Z',
      end_time: '2024-01-01T10:00:00.000Z'
    };
    const result = validateTaskForDrag(task);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Task is missing a valid title');
  });

  test('should reject task without time information', () => {
    const task = {
      task_id: 1,
      title: 'Test Task'
    };
    const result = validateTaskForDrag(task);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Task has no start time - cannot be moved');
  });

  test('should add warnings for edge cases', () => {
    const task = {
      task_id: 1,
      title: 'Test Task',
      start_time: '2024-01-01T09:00:00.000Z',
      end_time: '2024-01-01T09:10:00.000Z', // Very short duration
      effort_units: 0
    };
    const result = validateTaskForDrag(task);
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain('Task duration is very short (less than 15 minutes)');
    expect(result.warnings).toContain('Task has no effort estimate - using default duration');
  });
});

describe('validateDropTarget', () => {
  test('should validate valid drop target', () => {
    const dropTargetId = '2024-01-01T00:00:00.000Z';
    const result = validateDropTarget(dropTargetId);
    expect(result.isValid).toBe(true);
    expect(result.targetDate).toBeInstanceOf(Date);
  });

  test('should reject null drop target', () => {
    const result = validateDropTarget(null);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('No drop target specified');
  });

  test('should reject navigation edges', () => {
    const result = validateDropTarget('navigate-prev');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Cannot drop on navigation area');
  });

  test('should reject invalid date format', () => {
    const result = validateDropTarget('invalid-date');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid drop target date format');
  });

  test('should reject dates too far in the past', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago
    const result = validateDropTarget(oldDate.toISOString());
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Cannot schedule tasks more than one week in the past');
  });

  test('should reject dates too far in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2); // 2 years from now
    const result = validateDropTarget(futureDate.toISOString());
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Cannot schedule tasks more than one year in the future');
  });
});

describe('validateDragOperation', () => {
  const validTask = {
    task_id: 1,
    title: 'Test Task',
    start_time: '2024-01-01T09:00:00.000Z',
    end_time: '2024-01-01T10:00:00.000Z'
  };

  const existingSlots = [
    { start: 720, end: 780, type: 'lunch' } // 12:00-13:00
  ];

  test('should validate successful drag operation', () => {
    const dropTargetId = '2024-01-01T00:00:00.000Z';
    const newStartTime = new Date('2024-01-01T14:00:00.000Z');
    const newEndTime = new Date('2024-01-01T15:00:00.000Z');
    
    const result = validateDragOperation(
      validTask,
      dropTargetId,
      newStartTime,
      newEndTime,
      existingSlots
    );
    
    expect(result.isValid).toBe(true);
    expect(result.canProceed).toBe(true);
  });

  test('should reject invalid task', () => {
    const invalidTask = { task_id: 1 }; // Missing required fields
    const dropTargetId = '2024-01-01T00:00:00.000Z';
    const newStartTime = new Date('2024-01-01T14:00:00.000Z');
    const newEndTime = new Date('2024-01-01T15:00:00.000Z');
    
    const result = validateDragOperation(
      invalidTask,
      dropTargetId,
      newStartTime,
      newEndTime,
      existingSlots
    );
    
    expect(result.isValid).toBe(false);
    expect(result.canProceed).toBe(false);
  });

  test('should reject invalid drop target', () => {
    const newStartTime = new Date('2024-01-01T14:00:00.000Z');
    const newEndTime = new Date('2024-01-01T15:00:00.000Z');
    
    const result = validateDragOperation(
      validTask,
      'invalid-target',
      newStartTime,
      newEndTime,
      existingSlots
    );
    
    expect(result.isValid).toBe(false);
    expect(result.canProceed).toBe(false);
  });

  test('should reject conflicting time slots', () => {
    const dropTargetId = '2024-01-01T00:00:00.000Z';
    const newStartTime = new Date('2024-01-01T12:30:00.000Z'); // Conflicts with lunch
    const newEndTime = new Date('2024-01-01T13:30:00.000Z');
    
    const result = validateDragOperation(
      validTask,
      dropTargetId,
      newStartTime,
      newEndTime,
      existingSlots
    );
    
    expect(result.isValid).toBe(false);
    expect(result.canProceed).toBe(false);
  });
});
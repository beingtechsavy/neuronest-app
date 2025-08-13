/**
 * Enhanced drag-and-drop handlers with improved error handling and validation
 * Addresses requirements 3.3, 3.4 for proper error handling of invalid drag operations
 */

import { DragEndEvent } from '@dnd-kit/core';
import { CalendarTask, UserPreferences, TimeBlock } from '../app/calendar/page';
import { 
  enhancedTimeToMinutes, 
  validateTimeSlot, 
  roundToNearestQuarter,
  createDateWithTime,
  validateTaskForDrag,
  validateDropTarget,
  validateDragOperation
} from './timeCalculations';
import { TimeSlotValidator } from './timeSlotValidator';

export interface DragResult {
  success: boolean;
  error?: string;
  newStartTime?: Date;
  newEndTime?: Date;
  taskId?: number;
  title?: string;
}

export interface BusySlot {
  start: number;
  end: number;
  type: string;
  id?: string | number;
}

/**
 * Create busy slots from user preferences (sleep, meals)
 */
export function createPreferenceBusySlots(
  preferences: UserPreferences,
  targetDate: Date
): BusySlot[] {
  const busySlots: BusySlot[] = [];
  
  try {
    const year = targetDate.getUTCFullYear();
    const month = targetDate.getUTCMonth();
    const date = targetDate.getUTCDate();

    // Add sleep slots
    const sleepStart = enhancedTimeToMinutes(new Date(`1970-01-01T${preferences.sleep_start || '00:00'}Z`));
    const sleepEnd = enhancedTimeToMinutes(new Date(`1970-01-01T${preferences.sleep_end || '00:00'}Z`));

    if (sleepStart > sleepEnd) {
      // Sleep spans midnight
      busySlots.push(
        { start: sleepStart, end: 1440, type: 'sleep', id: 'sleep-1' },
        { start: 0, end: sleepEnd, type: 'sleep', id: 'sleep-2' }
      );
    } else {
      busySlots.push({ start: sleepStart, end: sleepEnd, type: 'sleep', id: 'sleep' });
    }

    // Add meal slots
    preferences.meal_start_times.forEach((mealTime, index) => {
      const startMin = enhancedTimeToMinutes(new Date(`1970-01-01T${mealTime || '00:00'}Z`));
      const endMin = startMin + preferences.meal_duration;
      
      // Ensure meal doesn't extend past midnight
      const actualEndMin = Math.min(endMin, 1440);
      
      busySlots.push({
        start: startMin,
        end: actualEndMin,
        type: 'meal',
        id: `meal-${index}`
      });
    });

    return busySlots;
  } catch (error) {
    console.error('createPreferenceBusySlots: Error creating preference busy slots', error);
    return [];
  }
}

/**
 * Create busy slots from existing time blocks
 */
export function createTimeBlockBusySlots(
  timeBlocks: TimeBlock[],
  targetDateKey: string
): BusySlot[] {
  try {
    return timeBlocks
      .filter(block => new Date(block.start_time).toISOString().startsWith(targetDateKey))
      .map(block => ({
        start: enhancedTimeToMinutes(new Date(block.start_time)),
        end: enhancedTimeToMinutes(new Date(block.end_time)),
        type: 'time_block',
        id: block.block_id
      }));
  } catch (error) {
    console.error('createTimeBlockBusySlots: Error creating time block busy slots', error);
    return [];
  }
}

/**
 * Create busy slots from existing tasks
 */
export function createTaskBusySlots(
  tasks: CalendarTask[],
  excludeTaskId?: number
): BusySlot[] {
  try {
    return tasks
      .filter(task => 
        task.start_time && 
        task.end_time && 
        task.task_id !== excludeTaskId
      )
      .map(task => ({
        start: enhancedTimeToMinutes(new Date(task.start_time!)),
        end: enhancedTimeToMinutes(new Date(task.end_time!)),
        type: 'task',
        id: task.task_id
      }));
  } catch (error) {
    console.error('createTaskBusySlots: Error creating task busy slots', error);
    return [];
  }
}

/**
 * Merge overlapping busy slots for efficient conflict detection
 */
export function mergeBusySlots(slots: BusySlot[]): BusySlot[] {
  if (slots.length === 0) return [];

  try {
    // Sort by start time
    const sorted = [...slots].sort((a, b) => a.start - b.start);
    const merged: BusySlot[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      if (current.start <= last.end) {
        // Overlapping slots - merge them
        last.end = Math.max(last.end, current.end);
        last.type = last.type === current.type ? last.type : 'mixed';
        last.id = `merged-${last.id}-${current.id}`;
      } else {
        merged.push(current);
      }
    }

    return merged;
  } catch (error) {
    console.error('mergeBusySlots: Error merging busy slots', error);
    return slots; // Return original slots on error
  }
}

/**
 * Enhanced drag end handler with comprehensive validation and error handling
 */
export function handleEnhancedDragEnd(
  event: DragEndEvent,
  tasks: Record<string, CalendarTask[]>,
  preferences: UserPreferences | null,
  timeBlocks: TimeBlock[],
  HOUR_HEIGHT: number = 64
): DragResult {
  try {
    const { active, over, delta } = event;

    // Validate basic drag event structure
    if (!over || !active.data.current?.task) {
      return {
        success: false,
        error: 'Invalid drag operation: missing target or task data'
      };
    }

    // Skip navigation edges
    if (String(over.id).startsWith('navigate-')) {
      return {
        success: false,
        error: 'Navigation edge drop - no action needed'
      };
    }

    const task = active.data.current.task as CalendarTask;

    // Comprehensive task validation
    const taskValidation = validateTaskForDrag(task);
    if (!taskValidation.isValid) {
      return {
        success: false,
        error: taskValidation.error || 'Task validation failed'
      };
    }

    // Validate drop target
    const dropValidation = validateDropTarget(String(over.id));
    if (!dropValidation.isValid) {
      return {
        success: false,
        error: dropValidation.error || 'Invalid drop target'
      };
    }

    // Validate preferences are loaded
    if (!preferences) {
      return {
        success: false,
        error: 'User preferences not loaded - cannot validate time slot'
      };
    }

    // Calculate new position with enhanced error handling
    let originalStartDate: Date;
    try {
      originalStartDate = new Date(task.start_time!);
      if (isNaN(originalStartDate.getTime())) {
        throw new Error('Invalid start time format');
      }
    } catch (error) {
      return {
        success: false,
        error: 'Task has invalid start time format'
      };
    }

    const minutesOffset = Math.round((delta.y / HOUR_HEIGHT) * 60);
    const targetDay = dropValidation.targetDate!;

    // Validate offset is reasonable (not more than 24 hours)
    if (Math.abs(minutesOffset) > 1440) {
      return {
        success: false,
        error: 'Cannot move task more than 24 hours from its original position'
      };
    }

    // Create new start time
    const newStartDate = new Date(Date.UTC(
      targetDay.getUTCFullYear(),
      targetDay.getUTCMonth(),
      targetDay.getUTCDate(),
      originalStartDate.getUTCHours(),
      originalStartDate.getUTCMinutes()
    ));

    newStartDate.setUTCMinutes(newStartDate.getUTCMinutes() + minutesOffset);

    // Round to nearest 15-minute interval
    const roundedStartDate = roundToNearestQuarter(newStartDate);

    // Calculate duration and end time with validation
    const duration = task.effort_units ?? preferences.session_length ?? 60;
    
    if (duration <= 0) {
      return {
        success: false,
        error: 'Task has invalid duration - cannot reschedule'
      };
    }

    if (duration > 480) {
      return {
        success: false,
        error: 'Task duration exceeds maximum allowed (8 hours)'
      };
    }

    const newEndDate = new Date(roundedStartDate.getTime() + duration * 60000);

    // Validate the new time is within the same day
    if (roundedStartDate.getUTCDate() !== targetDay.getUTCDate() ||
        newEndDate.getUTCDate() !== targetDay.getUTCDate()) {
      return {
        success: false,
        error: 'Task cannot span multiple days'
      };
    }

    // Validate time is within reasonable bounds
    const startMinutes = enhancedTimeToMinutes(roundedStartDate);
    const endMinutes = enhancedTimeToMinutes(newEndDate);

    if (startMinutes < 0 || endMinutes > 1440) {
      return {
        success: false,
        error: 'Task time extends beyond valid 24-hour period'
      };
    }

    // Create date key for conflict checking
    const dateKey = targetDay.toISOString().split('T')[0];

    // Collect all busy slots for the target day with error handling
    let preferenceBusySlots: BusySlot[] = [];
    let timeBlockBusySlots: BusySlot[] = [];
    let taskBusySlots: BusySlot[] = [];

    try {
      preferenceBusySlots = createPreferenceBusySlots(preferences, targetDay);
    } catch (error) {
      console.error('Error creating preference busy slots:', error);
      return {
        success: false,
        error: 'Failed to load user preferences for validation'
      };
    }

    try {
      timeBlockBusySlots = createTimeBlockBusySlots(timeBlocks, dateKey);
    } catch (error) {
      console.error('Error creating time block busy slots:', error);
      return {
        success: false,
        error: 'Failed to load time blocks for validation'
      };
    }

    try {
      taskBusySlots = createTaskBusySlots(tasks[dateKey] || [], task.task_id);
    } catch (error) {
      console.error('Error creating task busy slots:', error);
      return {
        success: false,
        error: 'Failed to load existing tasks for validation'
      };
    }

    const allBusySlots = [
      ...preferenceBusySlots,
      ...timeBlockBusySlots,
      ...taskBusySlots
    ];

    let mergedBusySlots: BusySlot[];
    try {
      mergedBusySlots = mergeBusySlots(allBusySlots);
    } catch (error) {
      console.error('Error merging busy slots:', error);
      return {
        success: false,
        error: 'Failed to process schedule conflicts'
      };
    }

    // Use comprehensive time slot validator
    let validator: TimeSlotValidator;
    try {
      validator = new TimeSlotValidator(preferences, tasks, timeBlocks, {
        allowSleepOverlap: false,
        allowMealOverlap: false,
        allowTaskOverlap: false,
        allowTimeBlockOverlap: false,
        minTaskDuration: 15,
        maxTaskDuration: 480,
        bufferTime: 0
      });
    } catch (error) {
      console.error('Failed to create TimeSlotValidator:', error);
      return {
        success: false,
        error: 'Failed to initialize time slot validation'
      };
    }

    // Comprehensive validation using TimeSlotValidator
    const validationResult = validator.validateTimeSlot(
      roundedStartDate,
      newEndDate,
      task.task_id
    );

    if (!validationResult.isValid) {
      // Provide detailed error message with conflict information
      let errorMessage = validationResult.userMessage;
      
      if (validationResult.conflicts.length > 0) {
        const conflictDetails = validationResult.conflicts
          .map(c => `${c.title} (${c.startTime} - ${c.endTime})`)
          .join(', ');
        errorMessage += ` Details: ${conflictDetails}`;
      }

      return {
        success: false,
        error: errorMessage
      };
    }

    // Check if we can proceed despite warnings
    if (!validationResult.canProceed) {
      return {
        success: false,
        error: validationResult.userMessage
      };
    }

    // Success - return the new times
    return {
      success: true,
      newStartTime: roundedStartDate,
      newEndTime: newEndDate,
      taskId: task.task_id,
      title: task.title
    };

  } catch (error) {
    console.error('handleEnhancedDragEnd: Unexpected error during drag handling', error);
    
    // Provide more specific error messages based on error type
    if (error instanceof TypeError) {
      return {
        success: false,
        error: 'Invalid data format during drag operation'
      };
    } else if (error instanceof RangeError) {
      return {
        success: false,
        error: 'Time calculation out of valid range'
      };
    } else {
      return {
        success: false,
        error: 'Unexpected error during drag operation'
      };
    }
  }
}

/**
 * Utility to format time for user-friendly error messages
 */
export function formatTimeForError(date: Date): string {
  try {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    });
  } catch (error) {
    return date.toISOString();
  }
}
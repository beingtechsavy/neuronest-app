/**
 * Enhanced time calculation utilities for drag-and-drop operations
 * Addresses requirements 3.1, 3.2, 3.3, 3.4 for improved accuracy and error handling
 */

export interface TimeCalculationResult {
  gridStart: number;
  gridEnd: number;
  isValid: boolean;
  error?: string;
}

export interface TimeSlotValidationResult {
  isValid: boolean;
  error?: string;
  conflictingSlots?: Array<{ start: number; end: number; type: string }>;
}

/**
 * Enhanced time-to-minutes conversion with better UTC handling and error checking
 * Replaces the basic robustTimeToMinutes function
 */
export function enhancedTimeToMinutes(dt: Date | string | null | undefined): number {
  try {
    if (!dt) {
      console.warn('enhancedTimeToMinutes: Received null/undefined input, returning 0');
      return 0;
    }

    let date: Date;
    
    if (typeof dt === 'string') {
      // Handle string inputs - ensure proper parsing
      if (!dt.trim()) {
        console.warn('enhancedTimeToMinutes: Received empty string, returning 0');
        return 0;
      }
      
      date = new Date(dt);
    } else {
      date = dt;
    }

    // Validate the date object
    if (isNaN(date.getTime())) {
      console.error('enhancedTimeToMinutes: Invalid date object', dt);
      return 0;
    }

    // Use UTC methods for consistent timezone handling
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    // Validate hour and minute ranges
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error('enhancedTimeToMinutes: Invalid time values', { hours, minutes });
      return 0;
    }

    const totalMinutes = hours * 60 + minutes;
    
    // Additional validation for reasonable time ranges
    if (totalMinutes < 0 || totalMinutes >= 1440) {
      console.error('enhancedTimeToMinutes: Time out of valid range (0-1439)', totalMinutes);
      return Math.max(0, Math.min(1439, totalMinutes));
    }

    return totalMinutes;
  } catch (error) {
    console.error('enhancedTimeToMinutes: Unexpected error', error, dt);
    return 0;
  }
}

/**
 * Calculate grid position for calendar display with enhanced validation
 */
export function calculateGridPosition(startTime: string | Date, endTime: string | Date): TimeCalculationResult {
  try {
    const startMinutes = enhancedTimeToMinutes(startTime);
    const endMinutes = enhancedTimeToMinutes(endTime);

    // Validate time order
    if (startMinutes >= endMinutes) {
      return {
        gridStart: 1,
        gridEnd: 2,
        isValid: false,
        error: 'Start time must be before end time'
      };
    }

    // Calculate grid positions (15-minute slots, 1-based indexing)
    const gridStart = Math.max(1, Math.floor(startMinutes / 15) + 1);
    const gridEnd = Math.max(gridStart + 1, Math.ceil(endMinutes / 15) + 1);

    // Validate grid positions are within reasonable bounds (24 hours = 96 slots)
    if (gridStart > 96 || gridEnd > 97) {
      return {
        gridStart: 1,
        gridEnd: 2,
        isValid: false,
        error: 'Time extends beyond 24-hour period'
      };
    }

    return {
      gridStart,
      gridEnd,
      isValid: true
    };
  } catch (error) {
    console.error('calculateGridPosition: Error calculating grid position', error);
    return {
      gridStart: 1,
      gridEnd: 2,
      isValid: false,
      error: 'Failed to calculate grid position'
    };
  }
}

/**
 * Validate if a time slot is available (no conflicts with existing slots)
 */
export function validateTimeSlot(
  startTime: Date,
  endTime: Date,
  existingSlots: Array<{ start: number; end: number; type?: string }>,
  excludeTaskId?: number
): TimeSlotValidationResult {
  try {
    const startMinutes = enhancedTimeToMinutes(startTime);
    const endMinutes = enhancedTimeToMinutes(endTime);

    // Basic time validation
    if (startMinutes >= endMinutes) {
      return {
        isValid: false,
        error: 'Start time must be before end time'
      };
    }

    // Validate time is within reasonable bounds (not negative or beyond 24 hours)
    if (startMinutes < 0 || endMinutes > 1440) {
      return {
        isValid: false,
        error: 'Time slot extends beyond valid 24-hour period'
      };
    }

    // Validate minimum duration (at least 15 minutes)
    if (endMinutes - startMinutes < 15) {
      return {
        isValid: false,
        error: 'Task duration must be at least 15 minutes'
      };
    }

    // Validate maximum duration (no more than 8 hours)
    if (endMinutes - startMinutes > 480) {
      return {
        isValid: false,
        error: 'Task duration cannot exceed 8 hours'
      };
    }

    // Check for conflicts with existing slots
    const conflictingSlots = existingSlots.filter(slot => {
      // Check if the new time slot overlaps with existing slot
      return startMinutes < slot.end && endMinutes > slot.start;
    });

    if (conflictingSlots.length > 0) {
      // Create detailed conflict information
      const conflictDetails = conflictingSlots.map(slot => {
        const conflictType = slot.type || 'unknown';
        const conflictStart = minutesToTimeString(slot.start);
        const conflictEnd = minutesToTimeString(slot.end);
        
        return {
          type: conflictType,
          timeRange: `${conflictStart} - ${conflictEnd}`,
          start: slot.start,
          end: slot.end
        };
      });

      // Generate user-friendly error message
      const conflictTypeMap: Record<string, string> = {
        'sleep': 'sleep time',
        'meal': 'meal time',
        'time_block': 'scheduled appointment',
        'task': 'another task',
        'mixed': 'multiple scheduled items',
        'unknown': 'scheduled item'
      };

      const primaryConflict = conflictDetails[0];
      const conflictTypeName = conflictTypeMap[primaryConflict.type] || 'scheduled item';
      
      let errorMessage = `Time slot conflicts with ${conflictTypeName}`;
      if (conflictDetails.length === 1) {
        errorMessage += ` (${primaryConflict.timeRange})`;
      } else {
        errorMessage += ` and ${conflictDetails.length - 1} other item(s)`;
      }

      return {
        isValid: false,
        error: errorMessage,
        conflictingSlots: conflictDetails
      };
    }

    return {
      isValid: true
    };
  } catch (error) {
    console.error('validateTimeSlot: Error validating time slot', error);
    return {
      isValid: false,
      error: 'Failed to validate time slot due to unexpected error'
    };
  }
}

/**
 * Round time to nearest 15-minute interval
 */
export function roundToNearestQuarter(date: Date): Date {
  try {
    const rounded = new Date(date);
    const minutes = rounded.getUTCMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    
    // Handle hour overflow before setting minutes
    if (roundedMinutes >= 60) {
      rounded.setUTCHours(rounded.getUTCHours() + 1);
      rounded.setUTCMinutes(0, 0, 0);
    } else {
      rounded.setUTCMinutes(roundedMinutes, 0, 0);
    }
    
    return rounded;
  } catch (error) {
    console.error('roundToNearestQuarter: Error rounding time', error);
    return new Date(date); // Return original date on error
  }
}

/**
 * Convert minutes since midnight to a formatted time string
 */
export function minutesToTimeString(minutes: number): string {
  try {
    if (minutes < 0 || minutes >= 1440) {
      console.warn('minutesToTimeString: Minutes out of valid range', minutes);
      minutes = Math.max(0, Math.min(1439, minutes));
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('minutesToTimeString: Error converting minutes to time string', error);
    return '00:00';
  }
}

/**
 * Create a date with specific time on a given day
 */
export function createDateWithTime(baseDate: Date, timeMinutes: number): Date {
  try {
    const result = new Date(baseDate);
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    
    result.setUTCHours(hours, minutes, 0, 0);
    return result;
  } catch (error) {
    console.error('createDateWithTime: Error creating date with time', error);
    return new Date(baseDate); // Return base date on error
  }
}

/**
 * Calculate duration between two times in minutes
 */
export function calculateDuration(startTime: Date | string, endTime: Date | string): number {
  try {
    const startMinutes = enhancedTimeToMinutes(startTime);
    const endMinutes = enhancedTimeToMinutes(endTime);
    
    if (endMinutes <= startMinutes) {
      console.warn('calculateDuration: End time is not after start time');
      return 0;
    }
    
    return endMinutes - startMinutes;
  } catch (error) {
    console.error('calculateDuration: Error calculating duration', error);
    return 0;
  }
}

/**
 * Validate task data for drag operations
 */
export interface TaskValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export function validateTaskForDrag(task: any): TaskValidationResult {
  const warnings: string[] = [];
  
  try {
    // Check if task exists
    if (!task) {
      return {
        isValid: false,
        error: 'No task data provided'
      };
    }

    // Check required fields
    if (!task.task_id) {
      return {
        isValid: false,
        error: 'Task is missing required ID'
      };
    }

    if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
      return {
        isValid: false,
        error: 'Task is missing a valid title'
      };
    }

    // Check time data
    if (!task.start_time) {
      return {
        isValid: false,
        error: 'Task has no start time - cannot be moved'
      };
    }

    if (!task.end_time) {
      return {
        isValid: false,
        error: 'Task has no end time - cannot be moved'
      };
    }

    // Validate time format
    const startDate = new Date(task.start_time);
    const endDate = new Date(task.end_time);

    if (isNaN(startDate.getTime())) {
      return {
        isValid: false,
        error: 'Task has invalid start time format'
      };
    }

    if (isNaN(endDate.getTime())) {
      return {
        isValid: false,
        error: 'Task has invalid end time format'
      };
    }

    // Check time logic
    if (startDate >= endDate) {
      return {
        isValid: false,
        error: 'Task start time must be before end time'
      };
    }

    // Add warnings for potential issues
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    
    if (duration < 15) {
      warnings.push('Task duration is very short (less than 15 minutes)');
    }

    if (duration > 480) {
      warnings.push('Task duration is very long (more than 8 hours)');
    }

    if (!task.effort_units || task.effort_units <= 0) {
      warnings.push('Task has no effort estimate - using default duration');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    console.error('validateTaskForDrag: Error validating task', error);
    return {
      isValid: false,
      error: 'Failed to validate task data due to unexpected error'
    };
  }
}

/**
 * Validate drop target for drag operations
 */
export interface DropTargetValidationResult {
  isValid: boolean;
  error?: string;
  targetDate?: Date;
}

export function validateDropTarget(dropTargetId: string | null): DropTargetValidationResult {
  try {
    if (!dropTargetId) {
      return {
        isValid: false,
        error: 'No drop target specified'
      };
    }

    // Skip navigation edges
    if (dropTargetId.startsWith('navigate-')) {
      return {
        isValid: false,
        error: 'Cannot drop on navigation area'
      };
    }

    // Validate date format
    const targetDate = new Date(dropTargetId);
    
    if (isNaN(targetDate.getTime())) {
      return {
        isValid: false,
        error: 'Invalid drop target date format'
      };
    }

    // Check if date is too far in the past
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (targetDate < oneWeekAgo) {
      return {
        isValid: false,
        error: 'Cannot schedule tasks more than one week in the past'
      };
    }

    // Check if date is too far in the future
    const oneYearFromNow = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (targetDate > oneYearFromNow) {
      return {
        isValid: false,
        error: 'Cannot schedule tasks more than one year in the future'
      };
    }

    return {
      isValid: true,
      targetDate
    };

  } catch (error) {
    console.error('validateDropTarget: Error validating drop target', error);
    return {
      isValid: false,
      error: 'Failed to validate drop target due to unexpected error'
    };
  }
}

/**
 * Comprehensive validation for drag-and-drop operations
 */
export interface DragOperationValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  canProceed: boolean;
}

export function validateDragOperation(
  task: any,
  dropTargetId: string | null,
  newStartTime: Date,
  newEndTime: Date,
  existingSlots: Array<{ start: number; end: number; type?: string }>
): DragOperationValidationResult {
  try {
    const warnings: string[] = [];

    // Validate task
    const taskValidation = validateTaskForDrag(task);
    if (!taskValidation.isValid) {
      return {
        isValid: false,
        error: taskValidation.error,
        canProceed: false
      };
    }

    if (taskValidation.warnings) {
      warnings.push(...taskValidation.warnings);
    }

    // Validate drop target
    const dropValidation = validateDropTarget(dropTargetId);
    if (!dropValidation.isValid) {
      return {
        isValid: false,
        error: dropValidation.error,
        canProceed: false
      };
    }

    // Validate new time slot
    const timeValidation = validateTimeSlot(newStartTime, newEndTime, existingSlots, task.task_id);
    if (!timeValidation.isValid) {
      return {
        isValid: false,
        error: timeValidation.error,
        canProceed: false
      };
    }

    // Additional cross-validation checks
    if (dropValidation.targetDate) {
      // Ensure new times are on the target date
      if (newStartTime.getUTCDate() !== dropValidation.targetDate.getUTCDate() ||
          newEndTime.getUTCDate() !== dropValidation.targetDate.getUTCDate()) {
        return {
          isValid: false,
          error: 'Task times do not match the target date',
          canProceed: false
        };
      }
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      canProceed: true
    };

  } catch (error) {
    console.error('validateDragOperation: Error validating drag operation', error);
    return {
      isValid: false,
      error: 'Failed to validate drag operation due to unexpected error',
      canProceed: false
    };
  }
}
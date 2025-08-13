/**
 * Comprehensive time slot validation for drag-and-drop operations
 * Addresses requirements 3.4, 3.6 for time slot conflicts and overlapping tasks
 */

import { CalendarTask, TimeBlock, UserPreferences } from '../app/calendar/page';
import { enhancedTimeToMinutes, validateTimeSlot } from './timeCalculations';

export interface TimeSlotConflict {
  type: 'sleep' | 'meal' | 'task' | 'time_block' | 'mixed';
  title: string;
  startTime: string;
  endTime: string;
  conflictSeverity: 'low' | 'medium' | 'high';
  canOverride: boolean;
  id?: string | number;
}

export interface TimeSlotValidationResult {
  isValid: boolean;
  conflicts: TimeSlotConflict[];
  warnings: string[];
  canProceed: boolean;
  userMessage: string;
}

export interface TimeSlotValidatorOptions {
  allowSleepOverlap?: boolean;
  allowMealOverlap?: boolean;
  allowTaskOverlap?: boolean;
  allowTimeBlockOverlap?: boolean;
  minTaskDuration?: number; // in minutes
  maxTaskDuration?: number; // in minutes
  bufferTime?: number; // in minutes
}

const DEFAULT_OPTIONS: TimeSlotValidatorOptions = {
  allowSleepOverlap: false,
  allowMealOverlap: false,
  allowTaskOverlap: false,
  allowTimeBlockOverlap: false,
  minTaskDuration: 15,
  maxTaskDuration: 480, // 8 hours
  bufferTime: 0
};

/**
 * Comprehensive time slot validator
 */
export class TimeSlotValidator {
  private preferences: UserPreferences;
  private tasks: Record<string, CalendarTask[]>;
  private timeBlocks: TimeBlock[];
  private options: TimeSlotValidatorOptions;

  constructor(
    preferences: UserPreferences,
    tasks: Record<string, CalendarTask[]>,
    timeBlocks: TimeBlock[],
    options: Partial<TimeSlotValidatorOptions> = {}
  ) {
    this.preferences = preferences;
    this.tasks = tasks;
    this.timeBlocks = timeBlocks;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate a time slot for conflicts
   */
  validateTimeSlot(
    startTime: Date,
    endTime: Date,
    excludeTaskId?: number
  ): TimeSlotValidationResult {
    try {
      const conflicts: TimeSlotConflict[] = [];
      const warnings: string[] = [];

      // Basic time validation
      const basicValidation = this.validateBasicTimeConstraints(startTime, endTime);
      if (!basicValidation.isValid) {
        return {
          isValid: false,
          conflicts: [],
          warnings: [],
          canProceed: false,
          userMessage: basicValidation.error || 'Invalid time slot'
        };
      }

      const dateKey = startTime.toISOString().split('T')[0];
      const startMinutes = enhancedTimeToMinutes(startTime);
      const endMinutes = enhancedTimeToMinutes(endTime);

      // Check sleep conflicts
      const sleepConflicts = this.checkSleepConflicts(startMinutes, endMinutes, startTime);
      conflicts.push(...sleepConflicts);

      // Check meal conflicts
      const mealConflicts = this.checkMealConflicts(startMinutes, endMinutes, startTime);
      conflicts.push(...mealConflicts);

      // Check task conflicts
      const taskConflicts = this.checkTaskConflicts(
        startMinutes, 
        endMinutes, 
        dateKey, 
        excludeTaskId
      );
      conflicts.push(...taskConflicts);

      // Check time block conflicts
      const timeBlockConflicts = this.checkTimeBlockConflicts(
        startMinutes, 
        endMinutes, 
        dateKey
      );
      conflicts.push(...timeBlockConflicts);

      // Generate warnings
      this.generateWarnings(startTime, endTime, warnings);

      // Determine if we can proceed
      const canProceed = this.canProceedWithConflicts(conflicts);
      const userMessage = this.generateUserMessage(conflicts, warnings);

      return {
        isValid: conflicts.length === 0,
        conflicts,
        warnings,
        canProceed,
        userMessage
      };

    } catch (error) {
      console.error('TimeSlotValidator: Error validating time slot', error);
      return {
        isValid: false,
        conflicts: [],
        warnings: [],
        canProceed: false,
        userMessage: 'Failed to validate time slot due to unexpected error'
      };
    }
  }

  /**
   * Validate basic time constraints
   */
  private validateBasicTimeConstraints(startTime: Date, endTime: Date): { isValid: boolean; error?: string } {
    // Check if times are valid dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }

    // Check time order
    if (startTime >= endTime) {
      return { isValid: false, error: 'Start time must be before end time' };
    }

    // Check minimum duration
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (durationMinutes < (this.options.minTaskDuration || 15)) {
      return { 
        isValid: false, 
        error: `Task duration must be at least ${this.options.minTaskDuration} minutes` 
      };
    }

    // Check maximum duration
    if (durationMinutes > (this.options.maxTaskDuration || 480)) {
      return { 
        isValid: false, 
        error: `Task duration cannot exceed ${this.options.maxTaskDuration} minutes` 
      };
    }

    // Check if task spans multiple days
    if (startTime.getUTCDate() !== endTime.getUTCDate()) {
      return { isValid: false, error: 'Tasks cannot span multiple days' };
    }

    // Check if time is within reasonable bounds (0-24 hours)
    const startMinutes = enhancedTimeToMinutes(startTime);
    const endMinutes = enhancedTimeToMinutes(endTime);

    if (startMinutes < 0 || endMinutes > 1440) {
      return { isValid: false, error: 'Time extends beyond valid 24-hour period' };
    }

    return { isValid: true };
  }

  /**
   * Check for sleep time conflicts
   */
  private checkSleepConflicts(
    startMinutes: number, 
    endMinutes: number, 
    targetDate: Date
  ): TimeSlotConflict[] {
    if (this.options.allowSleepOverlap) {
      return [];
    }

    const conflicts: TimeSlotConflict[] = [];
    
    try {
      const sleepStart = enhancedTimeToMinutes(new Date(`1970-01-01T${this.preferences.sleep_start || '00:00'}Z`));
      const sleepEnd = enhancedTimeToMinutes(new Date(`1970-01-01T${this.preferences.sleep_end || '00:00'}Z`));

      let sleepPeriods: Array<{ start: number; end: number }> = [];

      if (sleepStart > sleepEnd) {
        // Sleep spans midnight
        sleepPeriods = [
          { start: sleepStart, end: 1440 },
          { start: 0, end: sleepEnd }
        ];
      } else {
        sleepPeriods = [{ start: sleepStart, end: sleepEnd }];
      }

      for (const period of sleepPeriods) {
        if (startMinutes < period.end && endMinutes > period.start) {
          const conflictStart = Math.max(startMinutes, period.start);
          const conflictEnd = Math.min(endMinutes, period.end);
          
          conflicts.push({
            type: 'sleep',
            title: 'Sleep Time',
            startTime: this.minutesToTimeString(conflictStart),
            endTime: this.minutesToTimeString(conflictEnd),
            conflictSeverity: 'high',
            canOverride: false,
            id: 'sleep'
          });
        }
      }
    } catch (error) {
      console.error('Error checking sleep conflicts:', error);
    }

    return conflicts;
  }

  /**
   * Check for meal time conflicts
   */
  private checkMealConflicts(
    startMinutes: number, 
    endMinutes: number, 
    targetDate: Date
  ): TimeSlotConflict[] {
    if (this.options.allowMealOverlap) {
      return [];
    }

    const conflicts: TimeSlotConflict[] = [];

    try {
      this.preferences.meal_start_times.forEach((mealTime, index) => {
        const mealStart = enhancedTimeToMinutes(new Date(`1970-01-01T${mealTime || '00:00'}Z`));
        const mealEnd = mealStart + this.preferences.meal_duration;

        if (startMinutes < mealEnd && endMinutes > mealStart) {
          const conflictStart = Math.max(startMinutes, mealStart);
          const conflictEnd = Math.min(endMinutes, mealEnd);

          conflicts.push({
            type: 'meal',
            title: `Meal Time ${index + 1}`,
            startTime: this.minutesToTimeString(conflictStart),
            endTime: this.minutesToTimeString(conflictEnd),
            conflictSeverity: 'medium',
            canOverride: true,
            id: `meal-${index}`
          });
        }
      });
    } catch (error) {
      console.error('Error checking meal conflicts:', error);
    }

    return conflicts;
  }

  /**
   * Check for task conflicts
   */
  private checkTaskConflicts(
    startMinutes: number, 
    endMinutes: number, 
    dateKey: string,
    excludeTaskId?: number
  ): TimeSlotConflict[] {
    if (this.options.allowTaskOverlap) {
      return [];
    }

    const conflicts: TimeSlotConflict[] = [];
    const dayTasks = this.tasks[dateKey] || [];

    try {
      for (const task of dayTasks) {
        if (task.task_id === excludeTaskId || !task.start_time || !task.end_time) {
          continue;
        }

        const taskStart = enhancedTimeToMinutes(new Date(task.start_time));
        const taskEnd = enhancedTimeToMinutes(new Date(task.end_time));

        // Apply buffer time if specified
        const bufferTime = this.options.bufferTime || 0;
        const bufferedStart = taskStart - bufferTime;
        const bufferedEnd = taskEnd + bufferTime;

        if (startMinutes < bufferedEnd && endMinutes > bufferedStart) {
          const conflictStart = Math.max(startMinutes, taskStart);
          const conflictEnd = Math.min(endMinutes, taskEnd);

          conflicts.push({
            type: 'task',
            title: task.title,
            startTime: this.minutesToTimeString(conflictStart),
            endTime: this.minutesToTimeString(conflictEnd),
            conflictSeverity: task.is_stressful ? 'high' : 'medium',
            canOverride: true,
            id: task.task_id
          });
        }
      }
    } catch (error) {
      console.error('Error checking task conflicts:', error);
    }

    return conflicts;
  }

  /**
   * Check for time block conflicts
   */
  private checkTimeBlockConflicts(
    startMinutes: number, 
    endMinutes: number, 
    dateKey: string
  ): TimeSlotConflict[] {
    if (this.options.allowTimeBlockOverlap) {
      return [];
    }

    const conflicts: TimeSlotConflict[] = [];

    try {
      const dayTimeBlocks = this.timeBlocks.filter(block => 
        new Date(block.start_time).toISOString().startsWith(dateKey)
      );

      for (const block of dayTimeBlocks) {
        const blockStart = enhancedTimeToMinutes(new Date(block.start_time));
        const blockEnd = enhancedTimeToMinutes(new Date(block.end_time));

        if (startMinutes < blockEnd && endMinutes > blockStart) {
          const conflictStart = Math.max(startMinutes, blockStart);
          const conflictEnd = Math.min(endMinutes, blockEnd);

          conflicts.push({
            type: 'time_block',
            title: block.title,
            startTime: this.minutesToTimeString(conflictStart),
            endTime: this.minutesToTimeString(conflictEnd),
            conflictSeverity: 'high',
            canOverride: false,
            id: block.block_id
          });
        }
      }
    } catch (error) {
      console.error('Error checking time block conflicts:', error);
    }

    return conflicts;
  }

  /**
   * Generate warnings for potential issues
   */
  private generateWarnings(startTime: Date, endTime: Date, warnings: string[]): void {
    try {
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const startHour = startTime.getUTCHours();
      const endHour = endTime.getUTCHours();

      // Duration warnings
      if (duration < 30) {
        warnings.push('Very short task duration (less than 30 minutes)');
      } else if (duration > 240) {
        warnings.push('Very long task duration (more than 4 hours)');
      }

      // Time of day warnings
      if (startHour < 6) {
        warnings.push('Task scheduled very early in the morning');
      } else if (endHour > 22) {
        warnings.push('Task scheduled late in the evening');
      }

      // Weekend warnings
      const dayOfWeek = startTime.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        warnings.push('Task scheduled on weekend');
      }

      // Past date warnings
      const now = new Date();
      if (startTime < now) {
        warnings.push('Task scheduled in the past');
      }
    } catch (error) {
      console.error('Error generating warnings:', error);
    }
  }

  /**
   * Determine if we can proceed despite conflicts
   */
  private canProceedWithConflicts(conflicts: TimeSlotConflict[]): boolean {
    // Cannot proceed if there are any non-overridable conflicts
    const nonOverridableConflicts = conflicts.filter(c => !c.canOverride);
    if (nonOverridableConflicts.length > 0) {
      return false;
    }

    // Cannot proceed if there are high-severity conflicts
    const highSeverityConflicts = conflicts.filter(c => c.conflictSeverity === 'high');
    if (highSeverityConflicts.length > 0) {
      return false;
    }

    return true;
  }

  /**
   * Generate user-friendly message
   */
  private generateUserMessage(conflicts: TimeSlotConflict[], warnings: string[]): string {
    if (conflicts.length === 0) {
      if (warnings.length > 0) {
        return `Time slot is available. Note: ${warnings[0]}`;
      }
      return 'Time slot is available';
    }

    const conflictTypes = [...new Set(conflicts.map(c => c.type))];
    const conflictTypeNames: Record<string, string> = {
      sleep: 'sleep time',
      meal: 'meal time',
      task: 'another task',
      time_block: 'scheduled appointment',
      mixed: 'multiple scheduled items'
    };

    if (conflictTypes.length === 1) {
      const typeName = conflictTypeNames[conflictTypes[0]] || 'scheduled item';
      if (conflicts.length === 1) {
        return `Time slot conflicts with ${typeName} (${conflicts[0].title})`;
      } else {
        return `Time slot conflicts with ${conflicts.length} ${typeName}s`;
      }
    } else {
      return `Time slot conflicts with ${conflicts.length} scheduled items`;
    }
  }

  /**
   * Convert minutes to time string
   */
  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get available time slots for a given day
   */
  getAvailableTimeSlots(
    targetDate: Date, 
    taskDuration: number,
    excludeTaskId?: number
  ): Array<{ start: Date; end: Date }> {
    const availableSlots: Array<{ start: Date; end: Date }> = [];
    
    try {
      // Generate 15-minute time slots for the entire day
      for (let minutes = 0; minutes < 1440; minutes += 15) {
        const startTime = new Date(targetDate);
        startTime.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
        
        const endTime = new Date(startTime.getTime() + taskDuration * 60000);
        
        // Skip if end time goes to next day
        if (endTime.getUTCDate() !== targetDate.getUTCDate()) {
          continue;
        }

        const validation = this.validateTimeSlot(startTime, endTime, excludeTaskId);
        if (validation.isValid) {
          availableSlots.push({ start: startTime, end: endTime });
        }
      }
    } catch (error) {
      console.error('Error finding available time slots:', error);
    }

    return availableSlots;
  }

  /**
   * Suggest alternative time slots when there's a conflict
   */
  suggestAlternativeTimeSlots(
    preferredStart: Date,
    taskDuration: number,
    excludeTaskId?: number,
    maxSuggestions: number = 3
  ): Array<{ start: Date; end: Date; score: number }> {
    const suggestions: Array<{ start: Date; end: Date; score: number }> = [];
    
    try {
      const targetDate = new Date(preferredStart);
      targetDate.setUTCHours(0, 0, 0, 0);
      
      const availableSlots = this.getAvailableTimeSlots(targetDate, taskDuration, excludeTaskId);
      
      // Score slots based on proximity to preferred time
      const preferredMinutes = enhancedTimeToMinutes(preferredStart);
      
      for (const slot of availableSlots) {
        const slotMinutes = enhancedTimeToMinutes(slot.start);
        const timeDifference = Math.abs(slotMinutes - preferredMinutes);
        
        // Lower score is better (closer to preferred time)
        const score = timeDifference;
        
        suggestions.push({
          start: slot.start,
          end: slot.end,
          score
        });
      }
      
      // Sort by score and return top suggestions
      suggestions.sort((a, b) => a.score - b.score);
      return suggestions.slice(0, maxSuggestions);
      
    } catch (error) {
      console.error('Error suggesting alternative time slots:', error);
      return [];
    }
  }
}
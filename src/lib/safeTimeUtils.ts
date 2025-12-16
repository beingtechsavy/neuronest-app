/**
 * Safe Time Utilities - Crash-Proof Calendar Implementation
 * 
 * These utilities work with pure time strings and local dates,
 * eliminating timezone conversion bugs that cause crashes when
 * switching between accounts in different timezones.
 * 
 * Core Philosophy: Each account lives in its own "time bubble"
 */

// ============================================================================
// CORE TIME UTILITIES - No timezone conversion, pure string operations
// ============================================================================

/**
 * Convert time string (HH:MM:SS or HH:MM) to minutes since midnight
 * SAFE: Pure string parsing, no Date objects or timezone math
 */
export const timeStringToMinutes = (timeStr: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    
    // Clamp to valid 24-hour range
    const safeHours = Math.max(0, Math.min(23, hours));
    const safeMinutes = Math.max(0, Math.min(59, minutes || 0));
    
    return safeHours * 60 + safeMinutes;
  } catch {
    return 0; // Safe fallback
  }
};

/**
 * Convert minutes since midnight to time string (HH:MM:SS)
 * SAFE: Pure arithmetic, no Date objects or timezone math
 */
export const minutesToTimeString = (minutes: number): string => {
  if (typeof minutes !== 'number' || isNaN(minutes)) return '00:00:00';
  
  // Clamp to valid day range
  const safeMinutes = Math.max(0, Math.min(1439, Math.floor(minutes)));
  
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
};

/**
 * Get date string in YYYY-MM-DD format using local timezone
 * SAFE: No UTC conversion - uses user's local date perception
 */
export const getLocalDateString = (date: Date): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    // Safe fallback to today
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  try {
    // Use local timezone - this is what the user sees on their calendar
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    // Fallback to current date
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * Parse user preference time strings safely
 * SAFE: Handles both "HH:MM" and "HH:MM:SS" formats
 */
export const parsePreferenceTime = (timeStr: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  try {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    
    // Clamp to valid range
    const safeHours = Math.max(0, Math.min(23, hours));
    const safeMinutes = Math.max(0, Math.min(59, minutes));
    
    return safeHours * 60 + safeMinutes;
  } catch {
    return 0;
  }
};

// ============================================================================
// TIME SLOT MANAGEMENT - For scheduling and collision detection
// ============================================================================

export interface TimeSlot {
  start: number;
  end: number;
  type: 'sleep' | 'meal' | 'task' | 'block';
}

/**
 * Check if two time ranges overlap
 * SAFE: Pure arithmetic, no date objects
 */
export const timeRangesOverlap = (
  start1: number, 
  end1: number, 
  start2: number, 
  end2: number
): boolean => {
  return start1 < end2 && start2 < end1;
};

/**
 * Merge overlapping time slots
 * SAFE: Pure array operations, no timezone math
 */
export const mergeTimeSlots = (slots: { start: number; end: number }[]): { start: number; end: number }[] => {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  
  try {
    // Filter out invalid slots
    const validSlots = slots.filter(slot => 
      typeof slot.start === 'number' && 
      typeof slot.end === 'number' && 
      slot.start < slot.end &&
      slot.start >= 0 && 
      slot.end <= 1440
    );
    
    if (validSlots.length === 0) return [];
    
    const sorted = [...validSlots].sort((a, b) => a.start - b.start);
    const merged = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      if (sorted[i].start <= last.end) {
        last.end = Math.max(last.end, sorted[i].end);
      } else {
        merged.push(sorted[i]);
      }
    }
    
    return merged;
  } catch {
    return slots.filter(slot => slot && typeof slot.start === 'number' && typeof slot.end === 'number');
  }
};

/**
 * Create time slots from user preferences
 * SAFE: No timezone conversion, works with preference strings directly
 */
export const createPreferenceSlots = (
  preferences: {
    sleep_start: string;
    sleep_end: string;
    meal_start_times: string[];
    meal_duration: number;
  }
): TimeSlot[] => {
  if (!preferences) return [];
  
  const slots: TimeSlot[] = [];
  
  try {
    // Add sleep slots
    const sleepStart = parsePreferenceTime(preferences.sleep_start);
    const sleepEnd = parsePreferenceTime(preferences.sleep_end);
    
    if (sleepStart > sleepEnd) {
      // Sleep crosses midnight (e.g., 23:00 to 07:00)
      slots.push({ start: sleepStart, end: 1440, type: 'sleep' });
      slots.push({ start: 0, end: sleepEnd, type: 'sleep' });
    } else {
      slots.push({ start: sleepStart, end: sleepEnd, type: 'sleep' });
    }
    
    // Add meal slots
    const mealTimes = Array.isArray(preferences.meal_start_times) ? preferences.meal_start_times : [];
    const mealDuration = typeof preferences.meal_duration === 'number' ? preferences.meal_duration : 60;
    
    for (const mealTime of mealTimes) {
      const start = parsePreferenceTime(mealTime);
      const end = Math.min(1440, start + mealDuration);
      slots.push({ start, end, type: 'meal' });
    }
  } catch (error) {
    console.warn('Error creating preference slots:', error);
  }
  
  return slots;
};

/**
 * Find next available time slot for scheduling
 * SAFE: Pure arithmetic, no date manipulation
 */
export const findNextAvailableSlot = (
  duration: number,
  busySlots: TimeSlot[],
  bufferMinutes: number = 10
): { startMinutes: number; endMinutes: number } | null => {
  if (typeof duration !== 'number' || duration <= 0) return null;
  
  try {
    const merged = mergeTimeSlots(busySlots.map(slot => ({ start: slot.start, end: slot.end })));
    
    let currentTime = 0;
    
    for (const busySlot of merged) {
      const availableTime = busySlot.start - currentTime;
      
      if (availableTime >= duration + bufferMinutes) {
        const startMinutes = currentTime + bufferMinutes;
        return {
          startMinutes,
          endMinutes: startMinutes + duration
        };
      }
      
      currentTime = busySlot.end;
    }
    
    // Check if there's time at the end of the day
    if (1440 - currentTime >= duration + bufferMinutes) {
      const startMinutes = currentTime + bufferMinutes;
      return {
        startMinutes,
        endMinutes: startMinutes + duration
      };
    }
    
    return null;
  } catch {
    return null;
  }
};

// ============================================================================
// DISPLAY UTILITIES - For showing times to users
// ============================================================================

/**
 * Format time string for display (e.g., "09:00:00" -> "9:00 AM")
 * SAFE: Pure string manipulation
 */
export const formatTimeForDisplay = (timeStr: string, use24Hour: boolean = false): string => {
  if (!timeStr) return '';
  
  try {
    const minutes = timeStringToMinutes(timeStr);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (use24Hour) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    } else {
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const ampm = hours < 12 ? 'AM' : 'PM';
      return `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`;
    }
  } catch {
    return timeStr; // Fallback to original string
  }
};

/**
 * Get current time as minutes since midnight in user's local timezone
 * SAFE: Uses local time, no UTC conversion
 */
export const getCurrentTimeMinutes = (): number => {
  try {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  } catch {
    return 0;
  }
};
// Safe Time Utilities - No timezone conversions, crash-proof
// These functions work with pure time strings and local dates

/**
 * SAFE: Convert time string like "09:00:00" to minutes
 * No timezone conversion - works with pure time strings
 */
export const timeStringToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
};

/**
 * SAFE: Convert minutes to time string like "09:00:00"
 * No timezone conversion - pure arithmetic
 */
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
};

/**
 * SAFE: Get date string in YYYY-MM-DD format using local timezone
 * No UTC conversion - uses user's local date
 */
export const getLocalDateString = (date: Date): string => {
  try {
    return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

// SAFE: Check if two time ranges overlap (using minutes)
export const timeRangesOverlap = (
  start1: number, 
  end1: number, 
  start2: number, 
  end2: number
): boolean => {
  return start1 < end2 && start2 < end1;
};

// SAFE: Merge overlapping time slots
export const mergeTimeSlots = (slots: { start: number; end: number }[]): { start: number; end: number }[] => {
  if (slots.length === 0) return [];
  
  try {
    const sorted = [...slots].sort((a, b) => a.start - b.start);
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
    return slots;
  }
};

// SAFE: Parse user preferences time strings
export const parsePreferenceTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  try {
    // Handle both "HH:MM" and "HH:MM:SS" formats
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return Math.max(0, Math.min(1440, hours * 60 + minutes));
  } catch {
    return 0;
  }
};

// SAFE: Create time blocks for preferences (sleep, meals)
export interface TimeSlot {
  start: number;
  end: number;
  type: 'sleep' | 'meal' | 'task' | 'block';
}

export const createPreferenceSlots = (
  preferences: {
    sleep_start: string;
    sleep_end: string;
    meal_start_times: string[];
    meal_duration: number;
  }
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  
  try {
    // Add sleep slots
    const sleepStart = parsePreferenceTime(preferences.sleep_start);
    const sleepEnd = parsePreferenceTime(preferences.sleep_end);
    
    if (sleepStart > sleepEnd) {
      // Sleep crosses midnight
      slots.push({ start: sleepStart, end: 1440, type: 'sleep' });
      slots.push({ start: 0, end: sleepEnd, type: 'sleep' });
    } else {
      slots.push({ start: sleepStart, end: sleepEnd, type: 'sleep' });
    }
    
    // Add meal slots
    for (const mealTime of preferences.meal_start_times || []) {
      const start = parsePreferenceTime(mealTime);
      const end = Math.min(1440, start + (preferences.meal_duration || 60));
      slots.push({ start, end, type: 'meal' });
    }
  } catch (error) {
    console.warn('Error creating preference slots:', error);
  }
  
  return slots;
};

// SAFE: Find next available time slot
export const findNextAvailableSlot = (
  date: Date,
  duration: number,
  busySlots: TimeSlot[],
  bufferMinutes: number = 10
): { startMinutes: number; endMinutes: number } | null => {
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
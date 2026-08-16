// Location-Agnostic Calendar Utilities
// Works the same regardless of user's location

export interface SimpleTask {
  task_id: number;
  title: string;
  scheduled_date: string;  // '2025-01-23' (just date)
  start_time: string;      // '09:00:00' (just time)
  end_time: string;        // '10:30:00' (just time)
  task_status: 'breakdown' | 'inbox' | 'scheduled' | 'completed';
}

// Convert time string to minutes for grid positioning
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
};

// Convert minutes back to time string
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
};

// Get date string in YYYY-MM-DD format (location independent)
export const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Create a date from date string (always treats as local date)
export const createDateFromString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Format time for display (12h or 24h)
export const formatTime = (timeStr: string, format24h: boolean = false): string => {
  if (!timeStr) return '';
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  if (format24h) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Calculate grid position for calendar (15-minute slots)
export const getGridPosition = (timeStr: string): number => {
  const minutes = timeToMinutes(timeStr);
  return Math.floor(minutes / 15) + 1; // +1 for CSS grid (1-based)
};

// Validate time slot
export const isValidTimeSlot = (startTime: string, endTime: string): boolean => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end > start && start >= 0 && end <= 1440; // 1440 = 24 hours
};

// Get week days starting from a specific date
export const getWeekDays = (startDate: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });
};

// Example usage:
// Task scheduled for "2025-01-23" at "09:00:00" - "10:30:00"
// Will appear as "January 23, 9:00 AM - 10:30 AM" everywhere
// No timezone conversions, no location dependencies
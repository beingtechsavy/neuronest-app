// Utility functions to track focus session data for analytics

export interface FocusSessionData {
  [date: string]: number; // date -> minutes of focus
}

export function saveFocusSessionTime(minutes: number, date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  try {
    const existingData = localStorage.getItem('focusSessionStats');
    const stats: FocusSessionData = existingData ? JSON.parse(existingData) : {};
    
    // Add to existing time for the day
    stats[targetDate] = (stats[targetDate] || 0) + minutes;
    
    localStorage.setItem('focusSessionStats', JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save focus session time:', error);
  }
}

export const trackFocusSessionTime = saveFocusSessionTime;

export function getFocusSessionTime(date?: string): number {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  try {
    const existingData = localStorage.getItem('focusSessionStats');
    if (!existingData) return 0;
    
    const stats: FocusSessionData = JSON.parse(existingData);
    return stats[targetDate] || 0;
  } catch (error) {
    console.error('Failed to get focus session time:', error);
    return 0;
  }
}

export function getAllFocusSessionData(): FocusSessionData {
  try {
    const existingData = localStorage.getItem('focusSessionStats');
    return existingData ? JSON.parse(existingData) : {};
  } catch (error) {
    console.error('Failed to get all focus session data:', error);
    return {};
  }
}

// For testing purposes - simulate some focus session data
export function simulateFocusSessionData() {
  const today = new Date();
  const stats: FocusSessionData = {};
  
  // Add some sample data for the last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Simulate different amounts of focus time
    if (i === 0) {
      // Today - 2 hours 5 minutes (125 minutes)
      stats[dateStr] = 125;
    } else if (i === 1) {
      // Yesterday - 45 minutes
      stats[dateStr] = 45;
    } else if (i === 2) {
      // Day before - 90 minutes (1h 30m)
      stats[dateStr] = 90;
    } else if (i === 3) {
      // 3 days ago - 30 minutes (minimum for streak)
      stats[dateStr] = 30;
    } else if (i === 4) {
      // 4 days ago - 60 minutes (1h)
      stats[dateStr] = 60;
    } else if (i === 5) {
      // 5 days ago - 35 minutes
      stats[dateStr] = 35;
    } else if (i === 6) {
      // 6 days ago - 50 minutes
      stats[dateStr] = 50;
    }
  }
  
  localStorage.setItem('focusSessionStats', JSON.stringify(stats));
}

// Clear all focus session data
export function clearFocusSessionData() {
  localStorage.removeItem('focusSessionStats');
}
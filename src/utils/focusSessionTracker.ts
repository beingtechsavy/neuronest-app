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

// Clear all focus session data
export function clearFocusSessionData() {
  localStorage.removeItem('focusSessionStats');
}

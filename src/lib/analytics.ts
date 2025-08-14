import { track } from '@vercel/analytics'

// Custom event tracking for key user interactions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    track(eventName, properties)
  } catch (error) {
    // Fail silently to not affect user experience
    console.warn('Analytics tracking failed:', error)
  }
}

// Specific event tracking functions for NeuroNest features
export const trackTaskCreated = (taskData?: { hasStressMarking?: boolean, hasTimeSlot?: boolean }) => {
  trackEvent('task_created', taskData)
}

export const trackTaskDragDrop = (dragData?: { fromTimeSlot?: boolean, toTimeSlot?: boolean, duration?: number }) => {
  trackEvent('task_drag_drop', dragData)
}

export const trackStressMarking = (stressData?: { isStressful?: boolean, location?: string }) => {
  trackEvent('stress_marking_toggled', stressData)
}

export const trackTaskCompleted = (taskData?: { wasStressful?: boolean, hadTimeSlot?: boolean }) => {
  trackEvent('task_completed', taskData)
}

export const trackWeeklyViewUsage = (viewData?: { tasksVisible?: number, stressfulTasks?: number }) => {
  trackEvent('weekly_view_accessed', viewData)
}

export const trackAuthAction = (action: 'login' | 'signup' | 'logout') => {
  trackEvent('auth_action', { action })
}
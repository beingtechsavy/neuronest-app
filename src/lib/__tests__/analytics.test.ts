import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trackEvent, trackTaskCreated, trackTaskDragDrop, trackStressMarking, trackWeeklyViewUsage, trackAuthAction } from '../analytics'

// Mock the @vercel/analytics module
vi.mock('@vercel/analytics', () => ({
  track: vi.fn()
}))

describe('Analytics Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('trackEvent', () => {
    it('should call track with correct parameters', async () => {
      const { track } = await import('@vercel/analytics')
      
      trackEvent('test_event', { property: 'value' })
      
      expect(track).toHaveBeenCalledWith('test_event', { property: 'value' })
    })

    it('should handle errors gracefully', async () => {
      const { track } = await import('@vercel/analytics')
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Make track throw an error
      vi.mocked(track).mockImplementation(() => {
        throw new Error('Analytics error')
      })
      
      // Should not throw
      expect(() => trackEvent('test_event')).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('Analytics tracking failed:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Specific tracking functions', () => {
    it('should track task creation correctly', async () => {
      const { track } = await import('@vercel/analytics')
      
      trackTaskCreated({ hasStressMarking: true, hasTimeSlot: false })
      
      expect(track).toHaveBeenCalledWith('task_created', { hasStressMarking: true, hasTimeSlot: false })
    })

    it('should track drag and drop correctly', async () => {
      const { track } = await import('@vercel/analytics')
      
      trackTaskDragDrop({ fromTimeSlot: true, toTimeSlot: true, duration: 60 })
      
      expect(track).toHaveBeenCalledWith('task_drag_drop', { fromTimeSlot: true, toTimeSlot: true, duration: 60 })
    })

    it('should track stress marking correctly', async () => {
      const { track } = await import('@vercel/analytics')
      
      trackStressMarking({ isStressful: true, location: 'weekly_view' })
      
      expect(track).toHaveBeenCalledWith('stress_marking_toggled', { isStressful: true, location: 'weekly_view' })
    })

    it('should track weekly view usage correctly', async () => {
      const { track } = await import('@vercel/analytics')
      
      trackWeeklyViewUsage({ tasksVisible: 5, stressfulTasks: 2 })
      
      expect(track).toHaveBeenCalledWith('weekly_view_accessed', { tasksVisible: 5, stressfulTasks: 2 })
    })

    it('should track auth actions correctly', async () => {
      const { track } = await import('@vercel/analytics')
      
      trackAuthAction('login')
      
      expect(track).toHaveBeenCalledWith('auth_action', { action: 'login' })
    })
  })
})
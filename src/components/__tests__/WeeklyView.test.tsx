/**
 * Unit tests for WeeklyView component
 * Tests requirements 4.1, 4.2, 4.3, 4.5, 4.6, 4.7 for stress marking functionality
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import WeeklyView from '../WeeklyView';

// Mock the dependencies
vi.mock('@/lib/timeCalculations', () => ({
  enhancedTimeToMinutes: vi.fn((date) => {
    if (!date) return 0;
    const d = new Date(date);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }),
  calculateGridPosition: vi.fn((start, end) => ({
    isValid: true,
    gridStart: 37, // Mock grid position
    gridEnd: 41
  }))
}));

vi.mock('@/lib/timeSlotValidator', () => ({
  TimeSlotValidator: vi.fn()
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

vi.mock('../DragErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock props
const mockProps = {
  currentDate: new Date('2024-01-01T00:00:00.000Z'),
  preferences: {
    sleep_start: '23:00',
    sleep_end: '07:00',
    meal_start_times: ['08:00', '12:30', '18:00'],
    meal_duration: 60
  },
  timeBlocks: [],
  tasks: {
    '2024-01-01': [
      {
        task_id: 1,
        title: 'Test Task 1',
        start_time: '2024-01-01T09:00:00.000Z',
        end_time: '2024-01-01T10:00:00.000Z',
        is_stressful: false,
        chapters: {
          subjects: {
            color: '#6366f1'
          }
        }
      },
      {
        task_id: 2,
        title: 'Stressful Task',
        start_time: '2024-01-01T14:00:00.000Z',
        end_time: '2024-01-01T15:00:00.000Z',
        is_stressful: true,
        chapters: {
          subjects: {
            color: '#ef4444'
          }
        }
      }
    ]
  },
  onTaskClick: vi.fn(),
  onTimeBlockClick: vi.fn(),
  onTimeSlotClick: vi.fn(),
  onStressToggle: vi.fn()
};

// Wrapper component for DndContext
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndContext onDragEnd={() => {}}>
    {children}
  </DndContext>
);

describe('WeeklyView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should render weekly view with tasks', () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Stressful Task')).toBeInTheDocument();
    });

    test('should render day headers correctly', () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      // Should show day names and dates
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Date
    });

    test('should render time slots', () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      // Should show time labels
      expect(screen.getByText('0:00')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
      expect(screen.getByText('23:00')).toBeInTheDocument();
    });

    test('should render without tasks', () => {
      const propsWithoutTasks = {
        ...mockProps,
        tasks: {}
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithoutTasks} />
        </DndWrapper>
      );

      expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
    });
  });

  describe('Stress Marking Functionality', () => {
    test('should show stress indicator on hover for non-stressful task', async () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      
      // Hover over the task
      fireEvent.mouseEnter(task);

      // Should show stress indicator button
      await waitFor(() => {
        const stressButton = screen.getByTitle('Mark as stressful');
        expect(stressButton).toBeInTheDocument();
      });
    });

    test('should show stress indicator for already stressful task', () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      const stressfulTask = screen.getByText('Stressful Task');
      
      // Should show stress indicator even without hover for stressful tasks
      const stressButton = screen.getByTitle('Mark as not stressful');
      expect(stressButton).toBeInTheDocument();
    });

    test('should hide stress indicator on mouse leave', async () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      
      // Hover over the task
      fireEvent.mouseEnter(task);
      
      await waitFor(() => {
        expect(screen.getByTitle('Mark as stressful')).toBeInTheDocument();
      });

      // Mouse leave
      fireEvent.mouseLeave(task);

      await waitFor(() => {
        expect(screen.queryByTitle('Mark as stressful')).not.toBeInTheDocument();
      });
    });

    test('should call onStressToggle when stress button is clicked', async () => {
      const mockOnStressToggle = vi.fn().mockResolvedValue(undefined);
      const propsWithMockToggle = {
        ...mockProps,
        onStressToggle: mockOnStressToggle
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithMockToggle} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      
      // Hover over the task
      fireEvent.mouseEnter(task);

      await waitFor(() => {
        const stressButton = screen.getByTitle('Mark as stressful');
        fireEvent.click(stressButton);
      });

      expect(mockOnStressToggle).toHaveBeenCalledWith(1, true);
    });

    test('should toggle stress status from true to false', async () => {
      const mockOnStressToggle = vi.fn().mockResolvedValue(undefined);
      const propsWithMockToggle = {
        ...mockProps,
        onStressToggle: mockOnStressToggle
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithMockToggle} />
        </DndWrapper>
      );

      // Click on already stressful task
      const stressButton = screen.getByTitle('Mark as not stressful');
      fireEvent.click(stressButton);

      expect(mockOnStressToggle).toHaveBeenCalledWith(2, false);
    });

    test('should prevent multiple clicks during update', async () => {
      const mockOnStressToggle = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const propsWithSlowToggle = {
        ...mockProps,
        onStressToggle: mockOnStressToggle
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithSlowToggle} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      fireEvent.mouseEnter(task);

      await waitFor(() => {
        const stressButton = screen.getByTitle('Mark as stressful');
        
        // Click multiple times rapidly
        fireEvent.click(stressButton);
        fireEvent.click(stressButton);
        fireEvent.click(stressButton);
      });

      // Should only be called once
      expect(mockOnStressToggle).toHaveBeenCalledTimes(1);
    });

    test('should show different visual states for stressful vs non-stressful tasks', () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      const normalTask = screen.getByText('Test Task 1');
      const stressfulTask = screen.getByText('Stressful Task');

      // Hover over normal task
      fireEvent.mouseEnter(normalTask);

      // Check button styles/classes for different states
      const normalStressButton = screen.getByTitle('Mark as stressful');
      const stressfulStressButton = screen.getByTitle('Mark as not stressful');

      expect(normalStressButton).toHaveClass('bg-gray-600/80');
      expect(stressfulStressButton).toHaveClass('bg-red-500/80');
    });

    test('should handle stress toggle errors gracefully', async () => {
      const mockOnStressToggle = vi.fn().mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const propsWithFailingToggle = {
        ...mockProps,
        onStressToggle: mockOnStressToggle
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithFailingToggle} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      fireEvent.mouseEnter(task);

      await waitFor(() => {
        const stressButton = screen.getByTitle('Mark as stressful');
        fireEvent.click(stressButton);
      });

      // Should log error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle stress status:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Task Interaction', () => {
    test('should call onTaskClick when task is clicked', () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      fireEvent.click(task);

      expect(mockProps.onTaskClick).toHaveBeenCalledWith(
        expect.objectContaining({
          task_id: 1,
          title: 'Test Task 1'
        }),
        expect.any(Date),
        expect.any(Date)
      );
    });

    test('should prevent event propagation when stress button is clicked', async () => {
      const mockOnTaskClick = vi.fn();
      const mockOnStressToggle = vi.fn().mockResolvedValue(undefined);
      
      const propsWithMocks = {
        ...mockProps,
        onTaskClick: mockOnTaskClick,
        onStressToggle: mockOnStressToggle
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithMocks} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      fireEvent.mouseEnter(task);

      await waitFor(() => {
        const stressButton = screen.getByTitle('Mark as stressful');
        fireEvent.click(stressButton);
      });

      // Stress toggle should be called but not task click
      expect(mockOnStressToggle).toHaveBeenCalled();
      expect(mockOnTaskClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for stress buttons', async () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      fireEvent.mouseEnter(task);

      await waitFor(() => {
        const stressButton = screen.getByTitle('Mark as stressful');
        expect(stressButton).toHaveAttribute('title', 'Mark as stressful');
      });

      const stressfulStressButton = screen.getByTitle('Mark as not stressful');
      expect(stressfulStressButton).toHaveAttribute('title', 'Mark as not stressful');
    });

    test('should be keyboard accessible', async () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      fireEvent.mouseEnter(task);

      await waitFor(() => {
        const stressButton = screen.getByTitle('Mark as stressful');
        
        // Should be focusable
        stressButton.focus();
        expect(document.activeElement).toBe(stressButton);
        
        // Should respond to Enter key
        fireEvent.keyDown(stressButton, { key: 'Enter' });
        expect(mockProps.onStressToggle).toHaveBeenCalled();
      });
    });

    test('should show loading state during stress toggle', async () => {
      const mockOnStressToggle = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const propsWithSlowToggle = {
        ...mockProps,
        onStressToggle: mockOnStressToggle
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithSlowToggle} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      fireEvent.mouseEnter(task);

      await waitFor(() => {
        const stressButton = screen.getByTitle('Mark as stressful');
        fireEvent.click(stressButton);
        
        // Should show loading state
        expect(stressButton).toHaveClass('opacity-50', 'cursor-not-allowed');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle tasks without stress toggle callback', () => {
      const propsWithoutStressToggle = {
        ...mockProps,
        onStressToggle: undefined
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithoutStressToggle} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      fireEvent.mouseEnter(task);

      // Should not show stress button when callback is not provided
      expect(screen.queryByTitle('Mark as stressful')).not.toBeInTheDocument();
    });

    test('should handle tasks without time information', () => {
      const propsWithInvalidTasks = {
        ...mockProps,
        tasks: {
          '2024-01-01': [
            {
              task_id: 1,
              title: 'Task Without Time',
              start_time: null,
              end_time: null,
              is_stressful: false
            }
          ]
        }
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithInvalidTasks} />
        </DndWrapper>
      );

      // Task without time should not be rendered
      expect(screen.queryByText('Task Without Time')).not.toBeInTheDocument();
    });

    test('should handle empty preferences', () => {
      const propsWithoutPreferences = {
        ...mockProps,
        preferences: null
      };

      render(
        <DndWrapper>
          <WeeklyView {...propsWithoutPreferences} />
        </DndWrapper>
      );

      // Should still render tasks
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    test('should handle rapid hover events', async () => {
      render(
        <DndWrapper>
          <WeeklyView {...mockProps} />
        </DndWrapper>
      );

      const task = screen.getByText('Test Task 1');
      
      // Rapid hover/unhover
      fireEvent.mouseEnter(task);
      fireEvent.mouseLeave(task);
      fireEvent.mouseEnter(task);
      fireEvent.mouseLeave(task);
      fireEvent.mouseEnter(task);

      // Should handle gracefully without errors
      await waitFor(() => {
        expect(screen.getByTitle('Mark as stressful')).toBeInTheDocument();
      });
    });
  });
});
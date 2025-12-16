'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import { 
  timeStringToMinutes, 
  minutesToTimeString, 
  getLocalDateString,
  parsePreferenceTime,
  mergeTimeSlots,
  createPreferenceSlots,
  findNextAvailableSlot,
  type TimeSlot
} from '@/lib/safeTimeUtils';
// import Sidebar from '@/components/SideBar'; // No longer needed here
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WeeklyView from '@/components/WeeklyView';
import AddTimeBlockModal from '@/components/AddTimeBlockModal';
import TaskDetailModal from '@/components/TaskDetailModal';

import TimeBlockDetailModal from '@/components/TimeBlockDetailModal';
import UnscheduledTasks from '@/components/UnscheduledTasks';
import DeleteTaskConfirmModal from '@/components/DeleteTaskConfirmModal';
import EditTaskModal from '@/components/EditTaskModal';

// --- TYPE DEFINITIONS ---
export interface CalendarTask {
  task_id: number;
  title: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  effort_units: number | null;
  chapters: {
    title: string;
    subjects: { title: string; color: string } | null;
  } | null;
  user_id: string;
  chapter_id: number | null;
  deadline: string | null;
  status: string;
  task_status: 'breakdown' | 'inbox' | 'scheduled' | 'completed';
  is_stressful: boolean;
  ai_generated?: boolean;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
  estimated_minutes?: number;
  ai_step_order?: number;
  ai_breakdown_id?: number;
}

export interface TimeBlock {
  block_id: number;
  title: string;
  start_time: string; // Legacy timestamp field
  end_time: string;   // Legacy timestamp field
  safe_start_time?: string; // New safe TIME field
  safe_end_time?: string;   // New safe TIME field
  block_date?: string;      // New safe DATE field
}

export interface UserPreferences {
  sleep_start: string;
  sleep_end: string;
  meal_start_times: string[];
  meal_duration: number;
  session_length: number;
  buffer_length: number;
}

// --- CONSTANTS & UTILITIES ---
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_HEIGHT = 64;
const SCROLL_SPEED = 10;
const SCROLL_THRESHOLD = 50;

// REMOVED: Dangerous timezone conversion functions that caused crashes
// These have been replaced with safe utilities in timeUtils.ts
// SAFE: Get date string in local timezone (no UTC conversion)
const getDateKey = (date: Date): string => {
  return getLocalDateString(date);
};
// SAFE: Get days in month using local timezone
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();


export default function CalendarPage() {
  // --- STATE AND REFS ---
  const user = useUser();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  
  // CRASH PREVENTION: Track user changes to clear state
  const previousUserIdRef = useRef<string | null>(null);
  const [tasks, setTasks] = useState<Record<string, CalendarTask[]>>({});
  const [unscheduledTasks, setUnscheduledTasks] = useState<CalendarTask[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [view, setView] = useState<'month' | 'week'>('week');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null);
  const [draggedTaskBackup, setDraggedTaskBackup] = useState<CalendarTask | null>(null);
  const [pendingTaskMove, setPendingTaskMove] = useState<{
    task: CalendarTask;
    targetDate: string;
    targetTime: number;
  } | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const navigatedInDragRef = useRef(false);
  const isOverNavEdge = useRef<'left' | 'right' | null>(null);

  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<(CalendarTask & { startTime: Date; endTime: Date }) | null>(null);

  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [isBlockDetailOpen, setIsBlockDetailOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState<CalendarTask | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTask, setEditTask] = useState<CalendarTask | null>(null);

  // --- DATA FETCHING ---
  const fetchData = useCallback(async (isNavigation = false) => {
    if (!currentDate) return;
    if (isNavigation) { setIsNavigating(true); } else { setLoading(true); }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // SAFE: Use local dates, no UTC conversion
      const firstDay = view === 'week' ? 
        (() => {
          // Calculate proper week start (Sunday) to match WeeklyView logic
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          return startOfWeek;
        })() :
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
      const lastDay = view === 'week' ? 
        (() => { 
          const d = new Date(firstDay); 
          d.setDate(d.getDate() + 6); 
          return d; 
        })() : 
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // DEBUG: Log date range for week view
      if (view === 'week') {
        console.log('🔍 DEBUG Calendar - Week date range:', {
          currentDate: currentDate.toDateString(),
          firstDay: firstDay.toDateString(),
          lastDay: lastDay.toDateString(),
          firstDayKey: getDateKey(firstDay),
          lastDayKey: getDateKey(lastDay)
        });
      }

      const [tasksRes, unscheduledRes, prefsRes, blocksRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, chapters(*, subjects(*))')
          .eq('user_id', user.id)
          .not('scheduled_date', 'is', null)
          .gte('scheduled_date', getDateKey(firstDay))
          .lte('scheduled_date', getDateKey(lastDay)),
        supabase
          .from('tasks')
          .select('*, chapters(*, subjects(*))')
          .eq('user_id', user.id)
          .is('scheduled_date', null)
          .eq('task_status', 'inbox'),
        supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('time_blocks')
          .select('*')
          .eq('user_id', user.id)
      ]);
      
      const groupedTasks = (tasksRes.data ?? []).reduce<Record<string, CalendarTask[]>>((acc, task) => {
        if (!acc[task.scheduled_date]) acc[task.scheduled_date] = [];
        acc[task.scheduled_date].push(task as CalendarTask);
        return acc;
      }, {});
      
      // DEBUG: Log fetched tasks
      if (view === 'week') {
        console.log('🔍 DEBUG Calendar - Fetched tasks:', {
          totalTasks: tasksRes.data?.length || 0,
          groupedTaskDates: Object.keys(groupedTasks),
          todayTasks: groupedTasks['2025-12-15'] || 'No tasks for today'
        });
      }
      
      setTasks(groupedTasks);
      setUnscheduledTasks(unscheduledRes.data ?? []);
      setTimeBlocks(blocksRes.data ?? []);
      setPreferences(prefsRes.data ?? null);
      
    } catch (error) { 
      console.error('Error fetching calendar data:', error);
      // Reset to safe state on error
      setTasks({});
      setUnscheduledTasks([]);
      setTimeBlocks([]);
      setPreferences(null);
    } 
    finally { 
      setLoading(false); 
      setIsNavigating(false); 
    }
  }, [currentDate, view]);

  // --- EFFECTS ---
  
  // CRASH PREVENTION: Clear state when switching accounts
  useEffect(() => {
    if (user?.id && user.id !== previousUserIdRef.current) {
      console.log('Account switched - clearing calendar state to prevent crashes');
      
      // Clear all time-related state
      setTasks({});
      setUnscheduledTasks([]);
      setTimeBlocks([]);
      setPreferences(null);
      setLoading(true);
      
      // Reset to current date in new user's local context
      const now = new Date();
      setCurrentDate(now);
      
      // Update reference
      previousUserIdRef.current = user.id;
    }
  }, [user?.id]);
  
  useEffect(() => { 
    if (!currentDate) {
      const now = new Date(); 
      setCurrentDate(now); 
    }
  }, []);
  
  useEffect(() => { 
    if (currentDate && user?.id) { 
      const isNav = !loading; 
      fetchData(isNav); 
    } 
  }, [currentDate, view, fetchData, loading, user?.id]);

  // Handle pending task moves after navigation
  useEffect(() => {
    if (pendingTaskMove && !loading && !isNavigating) {
      console.log('🎯 PENDING MOVE - Executing pending task move:', pendingTaskMove);
      
      const executePendingMove = async () => {
        const { task, targetDate, targetTime } = pendingTaskMove;
        const duration = task.effort_units || preferences?.session_length || 60;
        
        try {
          const { error } = await supabase.from('tasks').update({
            scheduled_date: targetDate,
            start_time: minutesToTimeString(targetTime),
            end_time: minutesToTimeString(targetTime + duration),
            task_status: 'scheduled',
          }).eq('task_id', task.task_id);
          
          if (error) {
            console.error('❌ PENDING MOVE - Database update failed:', error);
          } else {
            console.log('✅ PENDING MOVE - Task moved successfully');
            // Refresh data to show the moved task
            await fetchData();
          }
        } catch (error) {
          console.error('❌ PENDING MOVE - Exception:', error);
        }
        
        // Clear pending move
        setPendingTaskMove(null);
        setDraggedTask(null);
        setDraggedTaskBackup(null);
      };
      
      executePendingMove();
    }
  }, [pendingTaskMove, loading, isNavigating, preferences, fetchData]);

  useEffect(() => {
    const handleRightClick = (event: MouseEvent) => {
      if (draggedTask && isOverNavEdge.current && !navigatedInDragRef.current) {
        event.preventDefault();
        const direction = isOverNavEdge.current === 'right' ? 'next' : 'prev';
        navigatedInDragRef.current = true;
        
        console.log('🔄 NAVIGATION - Right-click navigation triggered:', direction);
        
        // Calculate target date for the pending move
        if (!currentDate) return;
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDate.getDate() + (direction === 'next' ? 7 : -7));
        const targetDateString = getLocalDateString(targetDate);
        
        // Store pending move information
        setPendingTaskMove({
          task: draggedTaskBackup || draggedTask,
          targetDate: targetDateString,
          targetTime: timeStringToMinutes(draggedTask.start_time || '09:00:00')
        });
        
        console.log('📝 NAVIGATION - Pending move created:', {
          taskTitle: draggedTask.title,
          targetDate: targetDateString,
          targetTime: timeStringToMinutes(draggedTask.start_time || '09:00:00')
        });
        
        // Navigate to new week
        setCurrentDate(prevDate => {
          if (!prevDate) return null;
          const newDate = new Date(prevDate);
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          return newDate;
        });
        
        // Force immediate data refresh for the new week
        setTimeout(() => {
          fetchData(true); // true = isNavigation
        }, 100);
      }
    };
    window.addEventListener('contextmenu', handleRightClick);
    return () => { window.removeEventListener('contextmenu', handleRightClick); };
  }, [draggedTask, draggedTaskBackup, currentDate, fetchData]);

  // --- CORE LOGIC & HANDLERS ---
  const scheduleTasks = async () => {
    if (!preferences) {
        setScheduleMessage('User preferences not loaded.');
        return;
    }
    if (unscheduledTasks.length === 0) {
      setScheduleMessage('No unscheduled tasks to schedule.');
      return;
    }
    
    setIsScheduling(true);
    setScheduleMessage('Analyzing schedule...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setScheduleMessage('User not authenticated.');
      setIsScheduling(false);
      return;
    }

    let queue = [...unscheduledTasks];
    const updates: Partial<CalendarTask>[] = [];
    const baseDate = new Date();
    baseDate.setUTCHours(0, 0, 0, 0);
    const maxWeeks = 5;

    for (let w = 0; w < maxWeeks && queue.length > 0; w++) {
      for (let d = 0; d < 7 && queue.length > 0; d++) {
        const day = new Date(baseDate);
        day.setUTCDate(baseDate.getUTCDate() + w * 7 + d);
        const dateKey = getLocalDateString(day);

        let busySlots: { start: number; end: number }[] = [];
        
        const sleepStart = parsePreferenceTime(preferences.sleep_start);
        const sleepEnd = parsePreferenceTime(preferences.sleep_end);
        if (sleepStart > sleepEnd) {
            busySlots.push({ start: sleepStart, end: 1440 }, { start: 0, end: sleepEnd });
        } else {
            busySlots.push({ start: sleepStart, end: sleepEnd });
        }

        for (const meal of preferences.meal_start_times) {
          const m = parsePreferenceTime(meal);
          busySlots.push({ start: m, end: m + preferences.meal_duration });
        }

        for (const block of timeBlocks.filter(b => 
          // Use safe fields if available, fallback to legacy timestamp
          (b.block_date === dateKey) || 
          (b.start_time && b.start_time.startsWith(dateKey))
        )) {
          // Use safe time fields if available, otherwise parse timestamp
          const startTime = block.safe_start_time || (block.start_time ? block.start_time.split('T')[1]?.split('.')[0] : '00:00:00');
          const endTime = block.safe_end_time || (block.end_time ? block.end_time.split('T')[1]?.split('.')[0] : '00:00:00');
          
          busySlots.push({ 
            start: timeStringToMinutes(startTime), 
            end: timeStringToMinutes(endTime) 
          });
        }

        for (const t of (tasks[dateKey] || [])) {
          if (t.start_time && t.end_time) {
            // Tasks now have TIME fields, parse them as time strings
            const startMinutes = timeStringToMinutes(t.start_time);
            const endMinutes = timeStringToMinutes(t.end_time);
            busySlots.push({ start: startMinutes, end: endMinutes });
          }
        }

        busySlots = mergeTimeSlots(busySlots);

        let lastEnd = 0;
        while (queue.length > 0) {
          const task = queue[0];
          const duration = task.effort_units ?? preferences.session_length;
          const buffer = lastEnd === 0 ? 0 : preferences.buffer_length;

          const nextBusySlot = busySlots.find(slot => slot.start >= lastEnd);
          const freeWindowStart = lastEnd;
          const freeWindowEnd = nextBusySlot ? nextBusySlot.start : 1440;

          if (freeWindowEnd - freeWindowStart >= duration + buffer) {
            const startMinute = freeWindowStart + buffer;
            const endMinute = startMinute + duration;

            updates.push({
              task_id: task.task_id,
              user_id: user.id,
              title: task.title,
              effort_units: task.effort_units,
              chapter_id: task.chapter_id,
              deadline: task.deadline,
              is_stressful: task.is_stressful,
              status: "Scheduled",
              task_status: "scheduled", // Update workflow status
              scheduled_date: dateKey,
              start_time: minutesToTimeString(startMinute),
              end_time: minutesToTimeString(endMinute)
            });

            queue.shift();
            
            busySlots.push({ start: startMinute, end: startMinute + duration });
            busySlots = mergeTimeSlots(busySlots);
            lastEnd = startMinute + duration;
          } else {
            lastEnd = nextBusySlot ? nextBusySlot.end : 1440;
            if (lastEnd >= 1440) break;
          }
        }
      }
    }

    if (updates.length > 0) {
      const { error } = await supabase.from('tasks').upsert(updates);
      if (error) {
        setScheduleMessage(`Failed to schedule tasks: ${error.message}`);
      } else {
        setScheduleMessage(`Scheduled ${updates.length} tasks successfully.`);
        await fetchData();
      }
    } else {
      setScheduleMessage('No available slots found to schedule tasks.');
    }

    setIsScheduling(false);
    setTimeout(() => setScheduleMessage(''), 6000);
  };

  const scrollLoop = useCallback(() => {
    if (scrollDirectionRef.current && scrollContainerRef.current) {
        if (scrollDirectionRef.current === 'down') { scrollContainerRef.current.scrollTop += SCROLL_SPEED; } 
        else if (scrollDirectionRef.current === 'up') { scrollContainerRef.current.scrollTop -= SCROLL_SPEED; }
    }
    animationFrameRef.current = requestAnimationFrame(scrollLoop);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    navigatedInDragRef.current = false;
    const task = Object.values(tasks).flat().find(t => t.task_id == event.active.id);
    if (task) {
      setDraggedTask(task);
      setDraggedTaskBackup(task); // Backup task data in case it gets lost during navigation
      console.log('🎯 DRAG START - Task backup created:', task.title);
    }
    animationFrameRef.current = requestAnimationFrame(scrollLoop);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over?.id === 'navigate-next') {
      isOverNavEdge.current = 'right';
    } else if (over?.id === 'navigate-prev') {
      isOverNavEdge.current = 'left';
    } else {
      isOverNavEdge.current = null;
      navigatedInDragRef.current = false;
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
      if (!scrollContainerRef.current) return;
      const { clientY } = event.activatorEvent as MouseEvent;
      const { top, bottom } = scrollContainerRef.current.getBoundingClientRect();
      
      if (clientY < top + SCROLL_THRESHOLD) { scrollDirectionRef.current = 'up'; } 
      else if (clientY > bottom - SCROLL_THRESHOLD) { scrollDirectionRef.current = 'down'; } 
      else { scrollDirectionRef.current = null; }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('🎯 DRAG END - Starting drag end handler');
    
    setDraggedTask(null);
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); }
    scrollDirectionRef.current = null;
    isOverNavEdge.current = null;
    
    // Store navigation state before resetting
    const wasCrossWeekDrop = navigatedInDragRef.current;
    console.log('🔍 DRAG END - Cross-week drop detected:', wasCrossWeekDrop);
    
    // If this was a cross-week drop, the pending move system will handle it
    if (wasCrossWeekDrop) {
      console.log('🔄 DRAG END - Cross-week drop detected, pending move system will handle it');
      // Reset navigation flag after drag completes
      setTimeout(() => {
        navigatedInDragRef.current = false;
      }, 100);
      return;
    }
    
    // Clear any pending moves since this is a normal drop
    setPendingTaskMove(null);
    setDraggedTaskBackup(null);
    
    // Reset navigation flag after drag completes
    setTimeout(() => {
      navigatedInDragRef.current = false;
    }, 100);

    const { active, over, delta } = event;
    console.log('🔍 DRAG END - Event details:', { 
      activeId: active.id, 
      overId: over?.id, 
      hasTask: !!active.data.current?.task,
      hasPreferences: !!preferences
    });
    
    if (!over) {
      console.log('❌ DRAG END - No drop target (over is null)');
      return;
    }
    
    if (!active.data.current?.task) {
      console.log('❌ DRAG END - No task data in active.data.current');
      return;
    }
    
    if (!preferences) {
      console.log('❌ DRAG END - No user preferences loaded');
      return;
    }
    
    if (String(over.id).startsWith('navigate-')) {
      console.log('🔄 DRAG END - Dropped on navigation edge, ignoring');
      return;
    }

    const task = active.data.current.task as CalendarTask;
    if (!task.start_time) {
      console.log('❌ DRAG END - Task has no start_time, aborting');
      return;
    }

    // Simple drag logic - work with minutes directly
    const originalStartMinutes = timeStringToMinutes(task.start_time);
    const minutesOffset = Math.round((delta.y / HOUR_HEIGHT * 60) / 15) * 15; // Round to 15-min slots
    const newStartMinutes = Math.max(0, Math.min(1440, originalStartMinutes + minutesOffset));
    const duration = task.effort_units ?? preferences.session_length ?? 60;
    const newEndMinutes = newStartMinutes + duration;
    
    // Get target date - handle both string and Date objects
    let dateKey: string;
    if (typeof over.id === 'string' && over.id.includes('-')) {
      // It's already a date string like "2024-01-15"
      dateKey = over.id;
      console.log('🔍 DRAG END - Using date string directly:', dateKey);
    } else {
      // Convert to date string
      const targetDate = new Date(over.id as string);
      dateKey = getLocalDateString(targetDate);
      console.log('🔍 DRAG END - Converted to date string:', { overId: over.id, dateKey });
    }
    
    console.log('🎯 DRAG END - Target date key:', dateKey);
    console.log('🔍 DRAG END - Original task date:', task.scheduled_date);
    console.log('🔍 DRAG END - Is cross-date move:', task.scheduled_date !== dateKey);
    
    // Simple busy slots calculation
    let busySlots: {start:number, end:number}[] = [];
    
    // Add sleep time
    const sleepStart = parsePreferenceTime(preferences.sleep_start);
    const sleepEnd = parsePreferenceTime(preferences.sleep_end);
    if(sleepStart > sleepEnd) { 
      busySlots.push({start:sleepStart, end:1440}, {start:0,end:sleepEnd}); 
    } else { 
      busySlots.push({start:sleepStart, end:sleepEnd}); 
    }
    
    // Add meal times
    preferences.meal_start_times.forEach(mealTime => { 
      const start = parsePreferenceTime(mealTime); 
      busySlots.push({start, end: start + preferences.meal_duration}); 
    });
    
    // Add existing tasks for this day (except the one being dragged)
    // For cross-week drops, we might not have the target week's data loaded yet
    const existingTasksForDay = tasks[dateKey] ?? [];
    existingTasksForDay.forEach(t => { 
      if(t.task_id !== task.task_id && t.start_time && t.end_time) { 
        busySlots.push({
          start: timeStringToMinutes(t.start_time), 
          end: timeStringToMinutes(t.end_time)
        }); 
      } 
    });
    
    // Determine if this is a cross-week or cross-date drop
    const isCrossWeekDrop = wasCrossWeekDrop;
    const isCrossDateDrop = task.scheduled_date !== dateKey;
    
    console.log('🔍 DRAG END - Drop analysis:', {
      isCrossWeekDrop,
      isCrossDateDrop,
      originalDate: task.scheduled_date,
      targetDate: dateKey
    });
    
    busySlots = mergeTimeSlots(busySlots);
    
    // Check for collisions using simple minutes
    const hasCollision = busySlots.some(slot => !(newEndMinutes <= slot.start || newStartMinutes >= slot.end));
    
    console.log('🔍 DRAG END - Collision check:', {
      hasCollision,
      newStartMinutes,
      newEndMinutes,
      busySlots: busySlots.length
    });
    
    // For cross-date drops (including cross-week), be more permissive
    if (hasCollision && !isCrossDateDrop) {
      console.log('❌ Same-day collision - task will snap back');
      return;
    }
    
    if (hasCollision && isCrossDateDrop) {
      console.log('⚠️ Cross-date drop has collision - trying to place anyway');
      // For cross-date drops, we'll try to place it and let the database/UI handle conflicts
      // This is more user-friendly than rejecting the drop
    }
    
    // Update task in database
    console.log('💾 DRAG END - Updating task in database:', {
      taskId: task.task_id,
      newDate: dateKey,
      newStartTime: minutesToTimeString(newStartMinutes),
      newEndTime: minutesToTimeString(newEndMinutes)
    });
    
    const { error } = await supabase.from('tasks').update({
      scheduled_date: dateKey,
      start_time: minutesToTimeString(newStartMinutes),
      end_time: minutesToTimeString(newEndMinutes),
      task_status: 'scheduled',
    }).eq('task_id', task.task_id);
    
    if (error) {
      console.error('❌ DRAG END - Database update failed:', error);
      return;
    }
    
    console.log('✅ DRAG END - Database update successful');
    
    if (isCrossDateDrop) {
      // For any cross-date drops, do a full data refresh to ensure consistency
      console.log('🔄 DRAG END - Refreshing data after cross-date drop');
      await fetchData();
    } else {
      // For same-day drops, update local state directly for better performance
      console.log('⚡ DRAG END - Updating local state for same-day drop');
      setTasks(prevTasks => {
        const newTasks = { ...prevTasks };
        
        // Remove task from old date
        Object.keys(newTasks).forEach(date => {
          newTasks[date] = newTasks[date].filter(t => t.task_id !== task.task_id);
          if (newTasks[date].length === 0) delete newTasks[date];
        });
        
        // Add task to new date with updated times
        if (!newTasks[dateKey]) newTasks[dateKey] = [];
        newTasks[dateKey].push({
          ...task,
          scheduled_date: dateKey,
          start_time: minutesToTimeString(newStartMinutes),
          end_time: minutesToTimeString(newEndMinutes),
          task_status: 'scheduled'
        });
        
        return newTasks;
      });
    }
    
    console.log('🎉 DRAG END - Task move completed successfully');
  };

  // --- RENDER LOGIC ---
  if (loading) return ( <div className="min-h-screen flex justify-center items-center bg-slate-950"><div className="w-10 h-10 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div></div> );

  return (
    <>
      <TaskDetailModal
        isOpen={isTaskDetailOpen}
        onClose={() => setIsTaskDetailOpen(false)}
        task={selectedTaskDetails}
        onDelete={() => {
          if (!selectedTaskDetails) return;
          setDeleteTask(selectedTaskDetails);
          setIsTaskDetailOpen(false);
          setIsDeleteOpen(true);
        }}
        onEdit={task => {
          setEditTask(task);
          setIsTaskDetailOpen(false);
          setIsEditOpen(true);
        }}
      />

      <AddTimeBlockModal
        isOpen={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        onSave={async ({ title, startTime, endTime }) => {
          if (!selectedDateTime) return;
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const startMinutes = timeStringToMinutes(startTime);
          const endMinutes = timeStringToMinutes(endTime);
          const dateString = getLocalDateString(selectedDateTime);
          
          await supabase.from('time_blocks').insert({
            title,
            user_id: user.id,
            // Use new safe format
            start_time_safe: minutesToTimeString(startMinutes),
            end_time_safe: minutesToTimeString(endMinutes),
            block_date: dateString,
            // Keep legacy fields for backward compatibility
            start_time: `${dateString}T${minutesToTimeString(startMinutes)}`,
            end_time: `${dateString}T${minutesToTimeString(endMinutes)}`,
          });
          await fetchData();
          setIsAddBlockOpen(false);
        }}
        selectedDateTime={selectedDateTime}
      />
      <TimeBlockDetailModal
        isOpen={isBlockDetailOpen}
        onClose={() => setIsBlockDetailOpen(false)}
        block={selectedBlock}
        onDelete={async (blockId) => {
          await supabase.from('time_blocks').delete().eq('block_id', blockId);
          await fetchData();
          setIsBlockDetailOpen(false);
        }}
      />
      <DeleteTaskConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          if (!deleteTask) return;
          await supabase.from('tasks').delete().eq('task_id', deleteTask.task_id);
          await fetchData();
          setIsDeleteOpen(false);
          setDeleteTask(null);
        }}
        taskTitle={deleteTask?.title || null}
      />
      <EditTaskModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={async updates => {
          if (!editTask) return;
          const updatePayload: Partial<CalendarTask> = {};
          if (updates.title.trim() && updates.title !== editTask.title) {
            updatePayload.title = updates.title;
          }
          if (updates.effort_units && updates.effort_units !== editTask.effort_units) {
            updatePayload.effort_units = updates.effort_units;
          }
          if (updates.scheduled_date && updates.scheduled_date !== editTask.scheduled_date) {
            updatePayload.scheduled_date = updates.scheduled_date;
            updatePayload.task_status = 'scheduled'; // Update status when scheduling
            if (editTask.start_time) {
              // Keep the same time, just update the date
              const startMinutes = timeStringToMinutes(editTask.start_time);
              const newEffort = updates.effort_units || editTask.effort_units || 50;
              const endMinutes = startMinutes + newEffort;
              updatePayload.start_time = minutesToTimeString(startMinutes);
              updatePayload.end_time = minutesToTimeString(endMinutes);
            }
          }
          if (Object.keys(updatePayload).length > 0) {
            await supabase.from('tasks').update(updatePayload).eq('task_id', editTask.task_id);
            await fetchData();
          }
          setIsEditOpen(false);
          setEditTask(null);
        }}
        currentTitle={editTask?.title || ''}
        currentEffort={editTask?.effort_units || 50}
        currentDate={editTask?.scheduled_date || ''}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragMove={handleDragMove} onDragOver={handleDragOver}>
        {/* --- CHANGE IS HERE --- */}
        {/* The outer div and Sidebar component have been removed */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-100">{currentDate && months[currentDate.getMonth()]} {currentDate && currentDate.getFullYear()}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>📍</span>
                  <span>Your time bubble</span>
                  <span className="text-slate-500">•</span>
                  <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
                  <button onClick={() => setView('month')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'month' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Month</button>
                  <button onClick={() => setView('week')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'week' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Week</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { if (!currentDate) return; const newDate = new Date(currentDate); if (view === 'month') newDate.setMonth(newDate.getMonth() - 1); else newDate.setDate(newDate.getDate() - 7); setCurrentDate(newDate); }} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300"><ChevronLeft size={20} /></button>
                  <button onClick={() => { if (!currentDate) return; const newDate = new Date(currentDate); if (view === 'month') newDate.setMonth(newDate.getMonth() + 1); else newDate.setDate(newDate.getDate() + 7); setCurrentDate(newDate); }} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300"><ChevronRight size={20} /></button>
                </div>
              </div>
            </div>
            <div ref={scrollContainerRef} className="relative flex-grow bg-slate-800/50 border border-slate-700 rounded-2xl p-4 overflow-auto">
              {isNavigating && ( <div className="absolute inset-0 bg-slate-900/50 z-30 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div></div> )}
              {currentDate && (view === 'month' ? (
                <div className="grid grid-cols-7 gap-1 text-center">
                  {daysOfWeek.map(day => <div key={day} className="text-xs font-bold text-slate-400 uppercase pb-2">{day}</div>)}
                  {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => <div key={`empty-${i}`} className="border-t border-slate-700/50"></div>)}
                  {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, day) => {
                    const dayNumber = day + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                    const dateStr = getLocalDateString(date);
                    const tasksForDay = tasks[dateStr] || [];
                    const isToday = getLocalDateString(new Date()) === dateStr;
                    return (
                      <div key={dayNumber} className="border-t border-slate-700/50 pt-2 h-24 sm:h-32 overflow-hidden cursor-pointer hover:bg-slate-700/50 transition-colors">
                        <span className={`text-sm ${isToday ? 'bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : 'text-slate-200'}`}>{dayNumber}</span>
                        <div className="mt-1 space-y-1 text-left px-1">
                          {tasksForDay.slice(0, 2).map(task => (
                            <div key={task.task_id} className="text-xs p-1 rounded truncate" style={{ backgroundColor: `${task.chapters?.subjects?.color || '#4f46e5'}40`, color: task.chapters?.subjects?.color || '#c4b5fd' }}>
                              {task.title}
                            </div>
                          ))}
                          {tasksForDay.length > 2 && <div className="text-xs text-slate-400">+ {tasksForDay.length - 2} more</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <WeeklyView
                  currentDate={currentDate}
                  preferences={preferences}
                  timeBlocks={timeBlocks}
                  tasks={tasks}
                  onTaskClick={(task, start, end) => { setSelectedTaskDetails({ ...task, startTime: start, endTime: end }); setIsTaskDetailOpen(true); }}
                  onTimeBlockClick={(block) => { setSelectedBlock(block); setIsBlockDetailOpen(true); }}
                  onTimeSlotClick={(date, hour) => { const dt = new Date(date); dt.setUTCHours(hour, 0, 0, 0); setSelectedDateTime(dt); setIsAddBlockOpen(true); }}
                />
              ))}
            </div>
          </div>
          <div className="w-full lg:max-w-sm lg:flex-shrink-0 flex flex-col">
            <UnscheduledTasks tasks={unscheduledTasks} onSchedule={scheduleTasks} onTaskAdded={() => fetchData()} isScheduling={isScheduling} scheduleMessage={scheduleMessage} />
          </div>
        </main>
        <DragOverlay>
          {draggedTask && (
            <div className="p-2 rounded-lg shadow-lg text-white bg-indigo-600 select-none pointer-events-none" style={{ cursor: 'grabbing', backgroundColor: `${draggedTask.chapters?.subjects?.color || '#6366f1'}`, borderLeft: `3px solid ${draggedTask.chapters?.subjects?.color || '#6366f1'}` }}>
              {draggedTask.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}

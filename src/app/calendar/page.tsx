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
import Sidebar from '@/components/SideBar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WeeklyView from '@/components/WeeklyView';
import AddTimeBlockModal from '@/components/AddTimeBlockModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import RescheduleConfirmModal from '@/components/RescheduleConfirmModal';
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
  is_stressful: boolean;
}

export interface TimeBlock {
  block_id: number;
  title: string;
  start_time: string;
  end_time: string;
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

const timeToUTCMinutes = (time: string | Date): number => {
  if (typeof time === 'string') {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
  return time.getUTCHours() * 60 + time.getUTCMinutes();
};
const toUTC_YYYYMMDD = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const getDaysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
const mergeSlots = (slots: { start: number; end: number }[]): { start: number; end: number }[] => {
  if (slots.length === 0) return [];
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
};


export default function CalendarPage() {
  // --- STATE AND REFS ---
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
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
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const navigatedInDragRef = useRef(false);
  const isOverNavEdge = useRef<'left' | 'right' | null>(null);

  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<(CalendarTask & { startTime: Date; endTime: Date }) | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDetails, setRescheduleDetails] = useState<{ taskId: number; title: string; newStartTime: Date; newEndTime: Date } | null>(null);
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
        const firstDay = view === 'week' ? (() => { const d = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate())); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); d.setUTCHours(0,0,0,0); return d })() : new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1, 0, 0, 0, 0));
        const lastDay = view === 'week' ? (() => { const d = new Date(firstDay); d.setUTCDate(d.getUTCDate() + 6); d.setUTCHours(23,59,59,999); return d })() : new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        const [tasksRes, unscheduledRes, prefsRes, blocksRes] = await Promise.all([
          supabase.from('tasks').select('*, chapters(*, subjects(*))').eq('user_id', user.id).not('scheduled_date', 'is', null).gte('scheduled_date', toUTC_YYYYMMDD(firstDay)).lte('scheduled_date', toUTC_YYYYMMDD(lastDay)),
          supabase.from('tasks').select('*, chapters(*, subjects(*))').eq('user_id', user.id).is('scheduled_date', null),
          supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
          supabase.from('time_blocks').select('*').eq('user_id', user.id)
        ]);
        const groupedTasks = (tasksRes.data ?? []).reduce<Record<string, CalendarTask[]>>((acc, task) => {
          if (!acc[task.scheduled_date]) acc[task.scheduled_date] = [];
          acc[task.scheduled_date].push(task as CalendarTask);
          return acc;
        }, {});
        setTasks(groupedTasks);
        setUnscheduledTasks(unscheduledRes.data ?? []);
        setTimeBlocks(blocksRes.data ?? []);
        setPreferences(prefsRes.data ?? null);
    } catch (error) { console.error("Error fetching calendar data:", error); } 
    finally { setLoading(false); setIsNavigating(false); }
  }, [currentDate, view]);

  // --- EFFECTS ---
  useEffect(() => { const now = new Date(); now.setUTCHours(0,0,0,0); setCurrentDate(now); }, []);
  useEffect(() => { if(currentDate) { const isNav = !loading; fetchData(isNav); } }, [currentDate, view]);

  useEffect(() => {
    const handleRightClick = (event: MouseEvent) => {
      if (draggedTask && isOverNavEdge.current && !navigatedInDragRef.current) {
        event.preventDefault();
        const direction = isOverNavEdge.current === 'right' ? 'next' : 'prev';
        navigatedInDragRef.current = true;
        setCurrentDate(prevDate => {
          if (!prevDate) return null;
          const newDate = new Date(prevDate);
          newDate.setUTCDate(newDate.getUTCDate() + (direction === 'next' ? 7 : -7));
          return newDate;
        });
      }
    };
    window.addEventListener('contextmenu', handleRightClick);
    return () => { window.removeEventListener('contextmenu', handleRightClick); };
  }, [draggedTask]);

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
        const dateKey = toUTC_YYYYMMDD(day);

        let busySlots: { start: number; end: number }[] = [];
        
        const sleepStart = timeToUTCMinutes(preferences.sleep_start);
        const sleepEnd = timeToUTCMinutes(preferences.sleep_end);
        if (sleepStart > sleepEnd) {
            busySlots.push({ start: sleepStart, end: 1440 }, { start: 0, end: sleepEnd });
        } else {
            busySlots.push({ start: sleepStart, end: sleepEnd });
        }

        for (const meal of preferences.meal_start_times) {
          const m = timeToUTCMinutes(meal);
          busySlots.push({ start: m, end: m + preferences.meal_duration });
        }

        for (const block of timeBlocks.filter(b => b.start_time.startsWith(dateKey))) {
          busySlots.push({ start: timeToUTCMinutes(new Date(block.start_time)), end: timeToUTCMinutes(new Date(block.end_time)) });
        }

        for (const t of (tasks[dateKey] || [])) {
          if (t.start_time && t.end_time) {
            busySlots.push({ start: timeToUTCMinutes(new Date(t.start_time)), end: timeToUTCMinutes(new Date(t.end_time)) });
          }
        }

        busySlots = mergeSlots(busySlots);

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
            const startDate = new Date(day);
            startDate.setUTCHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
            const endDate = new Date(startDate.getTime() + duration * 60000);

            updates.push({
              task_id: task.task_id,
              user_id: user.id,
              title: task.title,
              effort_units: task.effort_units,
              chapter_id: task.chapter_id,
              deadline: task.deadline,
              is_stressful: task.is_stressful,
              status: "Scheduled",
              scheduled_date: dateKey,
              start_time: startDate.toISOString(),
              end_time: endDate.toISOString()
            });

            queue.shift();
            
            busySlots.push({ start: startMinute, end: startMinute + duration });
            busySlots = mergeSlots(busySlots);
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
    if (task) setDraggedTask(task);
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

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedTask(null);
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); }
    scrollDirectionRef.current = null;
    isOverNavEdge.current = null;

    const { active, over, delta } = event;
    if (!over || !active.data.current?.task || !preferences) return;
    
    if (String(over.id).startsWith('navigate-')) return;

    const task = active.data.current.task as CalendarTask;
    if (!task.start_time) return;

    const originalStartDate = new Date(task.start_time);
    const minutesOffset = delta.y / HOUR_HEIGHT * 60;
    const targetDay = new Date(over.id as string);
    const newStartDate = new Date(Date.UTC(targetDay.getUTCFullYear(), targetDay.getUTCMonth(), targetDay.getUTCDate(), originalStartDate.getUTCHours(), originalStartDate.getUTCMinutes()));
    newStartDate.setUTCMinutes(newStartDate.getUTCMinutes() + minutesOffset);
    const roundedMinutes = Math.round(newStartDate.getUTCMinutes() / 15) * 15;
    newStartDate.setUTCMinutes(roundedMinutes, 0, 0);
    const duration = task.effort_units ?? preferences.session_length ?? 60;
    const newEndDate = new Date(newStartDate.getTime() + duration * 60000);
    const dateKey = toUTC_YYYYMMDD(newStartDate);
    let busySlots: {start:number, end:number}[] = [];
    const sleepStart = timeToUTCMinutes(preferences.sleep_start);
    const sleepEnd = timeToUTCMinutes(preferences.sleep_end);
    if(sleepStart > sleepEnd) { busySlots.push({start:sleepStart, end:1440}, {start:0,end:sleepEnd}); } 
    else { busySlots.push({start:sleepStart, end:sleepEnd}); }
    preferences.meal_start_times.forEach(ms => { const s = timeToUTCMinutes(ms); busySlots.push({start:s, end:s + preferences.meal_duration}); });
    timeBlocks.filter(b => new Date(b.start_time).toISOString().startsWith(dateKey)).forEach(b => { busySlots.push({start:timeToUTCMinutes(new Date(b.start_time)), end:timeToUTCMinutes(new Date(b.end_time))}); });
    (tasks[dateKey] ?? []).forEach(t => { if(t.task_id !== task.task_id && t.start_time && t.end_time) { busySlots.push({start:timeToUTCMinutes(new Date(t.start_time)), end:timeToUTCMinutes(new Date(t.end_time))}); } });
    busySlots = mergeSlots(busySlots);
    const newStartMins = newStartDate.getUTCHours()*60 + newStartDate.getUTCMinutes();
    const newEndMins = newStartMins + duration;
    const isBlocked = busySlots.some(slot => newStartMins < slot.end && newEndMins > slot.start);
    if (isBlocked) { console.log("Cannot move task here, slot is blocked."); return; }
    setRescheduleDetails({taskId: task.task_id, title: task.title, newStartTime: newStartDate, newEndTime: newEndDate});
    setIsRescheduleOpen(true);
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
      <RescheduleConfirmModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onConfirm={async ({ taskId, newStartTime, newEndTime }) => {
          await supabase.from('tasks').update({
            scheduled_date: toUTC_YYYYMMDD(newStartTime),
            start_time: newStartTime.toISOString(),
            end_time: newEndTime.toISOString(),
          }).eq('task_id', taskId);
          await fetchData();
          setIsRescheduleOpen(false);
          setRescheduleDetails(null);
        }}
        details={rescheduleDetails}
      />
      <AddTimeBlockModal
        isOpen={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        onSave={async ({ title, startTime, endTime }) => {
          if (!selectedDateTime) return;
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const [sh, sm] = startTime.split(':').map(Number);
          const [eh, em] = endTime.split(':').map(Number);
          const startDate = new Date(selectedDateTime);
          startDate.setUTCHours(sh, sm, 0, 0);
          const endDate = new Date(selectedDateTime);
          endDate.setUTCHours(eh, em, 0, 0);
          await supabase.from('time_blocks').insert({
            title,
            user_id: user.id,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
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
            if (editTask.start_time) {
              const oldStart = new Date(editTask.start_time);
              const newStart = new Date(updates.scheduled_date);
              newStart.setUTCHours(oldStart.getUTCHours(), oldStart.getUTCMinutes(), 0, 0);
              const newEffort = updates.effort_units || editTask.effort_units || 50;
              const newEnd = new Date(newStart.getTime() + newEffort * 60 * 1000);
              updatePayload.start_time = newStart.toISOString();
              updatePayload.end_time = newEnd.toISOString();
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
        <div className="min-h-screen bg-slate-950 flex text-slate-300">
          <Sidebar />
          <main className="flex-1 lg:ml-60 p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
            <div className="flex-grow flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-slate-100">{currentDate && months[currentDate.getUTCMonth()]} {currentDate && currentDate.getUTCFullYear()}</h1>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
                    <button onClick={() => setView('month')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'month' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Month</button>
                    <button onClick={() => setView('week')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'week' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Week</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { if (!currentDate) return; const newDate = new Date(currentDate); if (view === 'month') newDate.setUTCMonth(newDate.getUTCMonth() - 1); else newDate.setUTCDate(newDate.getUTCDate() - 7); setCurrentDate(newDate); }} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300"><ChevronLeft size={20} /></button>
                    <button onClick={() => { if (!currentDate) return; const newDate = new Date(currentDate); if (view === 'month') newDate.setUTCMonth(newDate.getUTCMonth() + 1); else newDate.setUTCDate(newDate.getUTCDate() + 7); setCurrentDate(newDate); }} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300"><ChevronRight size={20} /></button>
                  </div>
                </div>
              </div>
              <div ref={scrollContainerRef} className="relative flex-grow bg-slate-800/50 border border-slate-700 rounded-2xl p-4 overflow-auto">
                {isNavigating && ( <div className="absolute inset-0 bg-slate-900/50 z-30 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div></div> )}
                {currentDate && (view === 'month' ? (
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {daysOfWeek.map(day => <div key={day} className="text-xs font-bold text-slate-400 uppercase pb-2">{day}</div>)}
                    {Array.from({ length: new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)).getUTCDay() }).map((_, i) => <div key={`empty-${i}`} className="border-t border-slate-700/50"></div>)}
                    {Array.from({ length: getDaysInMonth(currentDate.getUTCFullYear(), currentDate.getUTCMonth()) }).map((_, day) => {
                      const dayNumber = day + 1;
                      const date = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), dayNumber));
                      const dateStr = toUTC_YYYYMMDD(date);
                      const tasksForDay = tasks[dateStr] || [];
                      const isToday = toUTC_YYYYMMDD(new Date()) === dateStr;
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
        </div>
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

'use client'

import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/SideBar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import WeeklyView from '@/components/WeeklyView'
import AddTimeBlockModal from '@/components/AddTimeBlockModal'
import TaskDetailModal from '@/components/TaskDetailModal'
import RescheduleConfirmModal from '@/components/RescheduleConfirmModal'
import TimeBlockDetailModal from '@/components/TimeBlockDetailModal'
import UnscheduledTasks from '@/components/UnscheduledTasks'
import DeleteTaskConfirmModal from '@/components/DeleteTaskConfirmModal'
import EditTaskModal from '@/components/EditTaskModal'
import React from 'react'


// --- INTERFACE DEFINITIONS ---
interface CalendarTask {
    task_id: number;
    title: string;
    scheduled_date: string;
    start_time: string | null;
    end_time: string | null;
    effort_units: number | null;
    chapters: { 
        title: string;
        subjects: { title: string; color: string; } | null; 
    } | null;
    user_id: string;
    chapter_id: number | null;
    deadline: string | null;
    status: string;
    is_stressful: boolean;
}
interface TimeBlock { block_id: number; title: string; start_time: string; end_time: string; }
interface UserPreferences { sleep_start: string; sleep_end: string; meal_start_times: string[]; meal_duration: number; session_length: number; buffer_length: number;}

// --- HELPER FUNCTIONS ---
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_HEIGHT = 64;

const timeToMinutes = (time: string | Date): number => {
    if (typeof time === 'string') {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    return time.getHours() * 60 + time.getMinutes();
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();


export default function CalendarPage() {
    // --- STATE MANAGEMENT ---
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [tasks, setTasks] = useState<Record<string, CalendarTask[]>>({})
    const [unscheduledTasks, setUnscheduledTasks] = useState<CalendarTask[]>([])
    const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
    const [preferences, setPreferences] = useState<UserPreferences | null>(null)
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'month' | 'week'>('week');
    
    // Modal States
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
    const [selectedTaskDetails, setSelectedTaskDetails] = useState<CalendarTask & { startTime: Date, endTime: Date } | null>(null)
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleDetails, setRescheduleDetails] = useState<{ taskId: number; title: string; newStartTime: Date; newEndTime: Date; } | null>(null);
    const [isTimeBlockModalOpen, setIsTimeBlockModalOpen] = useState(false)
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null)
    const [isTimeBlockDetailModalOpen, setIsTimeBlockDetailModalOpen] = useState(false);
    const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock | null>(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleMessage, setScheduleMessage] = useState('');
    const [activeTask, setActiveTask] = useState<CalendarTask | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<CalendarTask | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);


    // --- DATA FETCHING & CORE LOGIC ---
    const fetchData = useCallback(async () => {
        if (!currentDate) return;

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        let firstDay, lastDay;
        if (view === 'week') {
            firstDay = new Date(currentDate);
            firstDay.setDate(currentDate.getDate() - currentDate.getDay());
            firstDay.setHours(0, 0, 0, 0);

            lastDay = new Date(firstDay);
            lastDay.setDate(firstDay.getDate() + 6);
            lastDay.setHours(23, 59, 59, 999);

        } else {
            firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            firstDay.setHours(0, 0, 0, 0);

            lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            lastDay.setHours(23, 59, 59, 999);
        }

        const [tasksRes, unscheduledRes, prefsRes, blocksRes] = await Promise.all([
            supabase.from('tasks').select('*, chapters(*, subjects(*))').eq('user_id', user.id).not('scheduled_date', 'is', null).gte('scheduled_date', firstDay.toISOString().split('T')[0]).lte('scheduled_date', lastDay.toISOString().split('T')[0]),
            supabase.from('tasks').select('*, chapters(*, subjects(*))').eq('user_id', user.id).is('scheduled_date', null),
            supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
            supabase.from('time_blocks').select('*').eq('user_id', user.id)
        ]);

        const groupedTasks = (tasksRes.data || []).reduce((acc, task) => { const date = task.scheduled_date; if (!acc[date]) acc[date] = []; acc[date].push(task as CalendarTask); return acc; }, {} as Record<string, CalendarTask[]>);
        
        setTasks(groupedTasks);
        setUnscheduledTasks(unscheduledRes.data as CalendarTask[] || []);
        setTimeBlocks(blocksRes.data as TimeBlock[] || []);
        setPreferences(prefsRes.data as UserPreferences | null);
        setLoading(false);
    }, [currentDate, view]);

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAutoSchedule = async () => {
        setIsScheduling(true);
        setScheduleMessage('Analyzing your schedule...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !preferences) {
            setScheduleMessage('User preferences not found.');
            setIsScheduling(false);
            return;
        }
        if (unscheduledTasks.length === 0) {
            setScheduleMessage('No tasks to schedule!');
            setIsScheduling(false);
            setTimeout(() => setScheduleMessage(''), 3000);
            return;
        }

        setScheduleMessage(`Found ${unscheduledTasks.length} unscheduled tasks...`);
        await new Promise(res => setTimeout(res, 500));

        const tasksToUpdate: Partial<CalendarTask>[] = [];
        const tasksToSchedule = [...unscheduledTasks];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            if (tasksToSchedule.length === 0) break;

            const day = new Date(today);
            day.setDate(today.getDate() + i);
            const dateKey = day.toISOString().split('T')[0];

            const busySlots: {start: number, end: number}[] = [];
            const sleepStart = timeToMinutes(preferences.sleep_start);
            const sleepEnd = timeToMinutes(preferences.sleep_end);
            if (sleepStart > sleepEnd) {
                busySlots.push({ start: sleepStart, end: 1440 });
                busySlots.push({ start: 0, end: sleepEnd });
            } else {
                busySlots.push({ start: sleepStart, end: sleepEnd });
            }
            preferences.meal_start_times.forEach(t => {
                const start = timeToMinutes(t);
                busySlots.push({ start, end: start + preferences.meal_duration });
            });
            timeBlocks.filter(b => new Date(b.start_time).toDateString() === day.toDateString()).forEach(block => {
                busySlots.push({ start: timeToMinutes(new Date(block.start_time)), end: timeToMinutes(new Date(block.end_time)) });
            });
            (tasks[dateKey] || []).forEach(t => {
                if (t.start_time && t.end_time) {
                    busySlots.push({ start: timeToMinutes(new Date(t.start_time)), end: timeToMinutes(new Date(t.end_time)) });
                }
            });

            busySlots.sort((a, b) => a.start - b.start);
            const mergedBusySlots: {start: number, end: number}[] = [];
            if (busySlots.length > 0) {
                let currentSlot = busySlots[0];
                for (let j = 1; j < busySlots.length; j++) {
                    if (busySlots[j].start < currentSlot.end) {
                        currentSlot.end = Math.max(currentSlot.end, busySlots[j].end);
                    } else {
                        mergedBusySlots.push(currentSlot);
                        currentSlot = busySlots[j];
                    }
                }
                mergedBusySlots.push(currentSlot);
            }
            
            let lastEndTime = 0;
            const processFreeSlot = (start: number, end: number) => {
                let currentSearchTime = start;
                while (tasksToSchedule.length > 0) {
                    const task = tasksToSchedule[0];
                    const taskDuration = task.effort_units || preferences.session_length;
                    const buffer = tasksToUpdate.some(t => t.scheduled_date === dateKey) ? preferences.buffer_length : 0;
                    const requiredDuration = taskDuration + buffer;

                    if (currentSearchTime + requiredDuration <= end) {
                        const effectiveStartTime = currentSearchTime + buffer;
                        const startTime = new Date(day);
                        startTime.setHours(Math.floor(effectiveStartTime / 60), effectiveStartTime % 60, 0, 0);
                        const endTime = new Date(startTime.getTime() + taskDuration * 60 * 1000);
                        
                        const taskPayload = {
                            task_id: task.task_id,
                            user_id: user.id,
                            title: task.title,
                            effort_units: task.effort_units,
                            chapter_id: task.chapter_id,
                            deadline: task.deadline,
                            status: task.status,
                            is_stressful: task.is_stressful,
                            scheduled_date: dateKey,
                            start_time: startTime.toISOString(),
                            end_time: endTime.toISOString(),
                        };
                        
                        tasksToUpdate.push(taskPayload);
                        tasksToSchedule.shift();
                        currentSearchTime = effectiveStartTime + taskDuration;
                    } else {
                        break;
                    }
                }
            };

            for (const slot of mergedBusySlots) {
                processFreeSlot(lastEndTime, slot.start);
                lastEndTime = slot.end;
            }
            processFreeSlot(lastEndTime, 1440);
        }

        if (tasksToUpdate.length > 0) {
            setScheduleMessage(`Placing ${tasksToUpdate.length} tasks on your calendar...`);
            const { error } = await supabase.from('tasks').upsert(tasksToUpdate);
            if (error) {
                setScheduleMessage('Error saving the schedule.');
                console.error('Auto-schedule error:', error);
            } else {
                setScheduleMessage(`Successfully scheduled ${tasksToUpdate.length} tasks!`);
                await fetchData();
            }
        } else {
            setScheduleMessage('Could not find any available slots.');
        }

        setIsScheduling(false);
        setTimeout(() => setScheduleMessage(''), 4000);
    };

    // --- MODAL & ACTION HANDLERS ---
    const handleAttemptReschedule = (taskId: number, newStartTime: Date, newEndTime: Date) => {
        let taskToMove: CalendarTask | undefined;
        Object.values(tasks).flat().forEach(task => { if (task.task_id === taskId) taskToMove = task; });
        if (taskToMove) {
            setRescheduleDetails({ taskId, title: taskToMove.title, newStartTime, newEndTime });
            setIsRescheduleModalOpen(true);
        }
    }

    const handleConfirmReschedule = async () => {
        if (!rescheduleDetails) return;
        const { taskId, newStartTime, newEndTime } = rescheduleDetails;
        await supabase.from('tasks').update({
            scheduled_date: newStartTime.toISOString().split('T')[0],
            start_time: newStartTime.toISOString(),
            end_time: newEndTime.toISOString()
        }).eq('task_id', taskId);
        await fetchData();
        setIsRescheduleModalOpen(false);
        setRescheduleDetails(null);
    }

    const handleTaskClick = (task: CalendarTask, startTime: Date, endTime: Date) => {
        setSelectedTaskDetails({ ...task, startTime, endTime });
        setIsTaskDetailModalOpen(true);
    }

    const handleTimeSlotClick = (date: Date, hour: number) => {
        const newDateTime = new Date(date);
        newDateTime.setHours(hour);
        setSelectedDateTime(newDateTime);
        setIsTimeBlockModalOpen(true);
    }

    const handleSaveTimeBlock = async ({ title, startTime, endTime }: { title: string; startTime: string; endTime: string }) => {
        if (!selectedDateTime) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const startDate = new Date(selectedDateTime);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(selectedDateTime);
        endDate.setHours(endHour, endMinute, 0, 0);
        await supabase.from('time_blocks').insert({
            title,
            user_id: user.id,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
        });
        await fetchData();
        setIsTimeBlockModalOpen(false);
    }

    const handleTimeBlockClick = (block: TimeBlock) => {
        setSelectedTimeBlock(block);
        setIsTimeBlockDetailModalOpen(true);
    }

    const handleDeleteTimeBlock = async (blockId: number) => {
        const { error } = await supabase.from('time_blocks').delete().eq('block_id', blockId);
        if (error) {
            console.error("Error deleting time block:", error)
        } else {
            await fetchData();
            setIsTimeBlockDetailModalOpen(false);
        }
    }
    
    const promptDeleteTask = (task: CalendarTask) => {
        setTaskToDelete(task);
        setIsTaskDetailModalOpen(false);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;
        const { error } = await supabase.from('tasks').delete().eq('task_id', taskToDelete.task_id);
        if (error) {
            console.error('Error deleting task:', error);
        } else {
            await fetchData();
        }
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
    };

    const handleOpenEditModal = (task: CalendarTask) => {
        setEditingTask(task);
        setIsTaskDetailModalOpen(false);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedTask = async (updates: { title: string; effort_units: number; scheduled_date: string }) => {
        if (!editingTask) return;

        const { title, effort_units, scheduled_date } = updates;
        const updatePayload: { [key: string]: string | number | boolean | null } = {};

        const titleChanged = title.trim() && title !== editingTask.title;
        const effortChanged = effort_units && effort_units !== editingTask.effort_units;
        const dateChanged = scheduled_date && scheduled_date !== editingTask.scheduled_date;

        if (titleChanged) updatePayload.title = title;
        if (effortChanged) updatePayload.effort_units = effort_units;
        if (dateChanged) updatePayload.scheduled_date = scheduled_date;

        if ((dateChanged || effortChanged) && editingTask.start_time) {
            const originalStartTime = new Date(editingTask.start_time);
            const newStartTime = new Date(scheduled_date);
            newStartTime.setHours(originalStartTime.getHours(), originalStartTime.getMinutes(), 0, 0);

            const newEffort = effortChanged ? effort_units : editingTask.effort_units;
            const newEndTime = new Date(newStartTime.getTime() + (newEffort || 0) * 60 * 1000);
            
            updatePayload.start_time = newStartTime.toISOString();
            updatePayload.end_time = newEndTime.toISOString();
        }

        if (Object.keys(updatePayload).length > 0) {
            const { error } = await supabase
                .from('tasks')
                .update(updatePayload)
                .eq('task_id', editingTask.task_id);

            if (error) {
                console.error('Error updating task:', error);
            } else {
                await fetchData();
            }
        }

        setIsEditModalOpen(false);
        setEditingTask(null);
    };


    const handlePrev = () => {
        if (!currentDate) return;
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    }

    const handleNext = () => {
        if (!currentDate) return;
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    }

    // --- DND HANDLERS ---
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const task = Object.values(tasks).flat().find(t => t.task_id === active.id);
        if (task) {
            setActiveTask(task);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveTask(null);
        const { active, over, delta } = event;

        if (!over || !active.data.current?.task) return;
        
        const task: CalendarTask = active.data.current.task;
        if (!task || !task.start_time) return;

        const originalStartDate = new Date(task.start_time);
        const minutesOffset = (delta.y / HOUR_HEIGHT) * 60;
        const newStartDate = new Date(originalStartDate.getTime() + minutesOffset * 60 * 1000);

        const targetDayISO = over.id as string;
        const [year, month, day] = targetDayISO.split('T')[0].split('-').map(Number);
        newStartDate.setFullYear(year, month - 1, day);

        const minutes = newStartDate.getMinutes();
        const roundedMinutes = Math.round(minutes / 15) * 15;
        newStartDate.setMinutes(roundedMinutes, 0, 0);

        const duration = task.effort_units || preferences?.session_length || 60;
        const newEndDate = new Date(newStartDate.getTime() + duration * 60 * 1000);

        const getBlockedMinutesForDay = (day: Date, taskIdToIgnore?: number) => {
            const mins: { start: number, end: number }[] = [];
            if (preferences) {
                const sleepStart = timeToMinutes(preferences.sleep_start);
                const sleepEnd = timeToMinutes(preferences.sleep_end);
                if (sleepStart > sleepEnd) {
                    mins.push({ start: sleepStart, end: 1440 });
                    mins.push({ start: 0, end: sleepEnd });
                } else {
                    mins.push({ start: sleepStart, end: sleepEnd });
                }
                preferences.meal_start_times.forEach(ms => {
                    const s = timeToMinutes(ms);
                    mins.push({ start: s, end: s + preferences.meal_duration });
                });
            }
            timeBlocks.filter(b => new Date(b.start_time).toDateString() === day.toDateString()).forEach(block => {
                mins.push({ start: timeToMinutes(new Date(block.start_time)), end: timeToMinutes(new Date(block.end_time)) });
            });
            const dateKey = day.toISOString().split('T')[0];
            (tasks[dateKey] || []).forEach(t => {
                if (t.task_id !== taskIdToIgnore && t.start_time && t.end_time) {
                    mins.push({ start: timeToMinutes(new Date(t.start_time)), end: timeToMinutes(new Date(t.end_time)) });
                }
            });
            return mins.sort((a,b) => a.start - b.start);
        }

        const busySlots = getBlockedMinutesForDay(newStartDate, task.task_id);
        const newStartMinutes = newStartDate.getHours() * 60 + newStartDate.getMinutes();
        const newEndMinutes = newStartMinutes + duration;

        const isBlocked = busySlots.some(slot => newStartMinutes < slot.end && newEndMinutes > slot.start);

        if (isBlocked) {
            console.warn("Cannot move task to a blocked time slot.");
            return;
        }

        handleAttemptReschedule(task.task_id, newStartDate, newEndDate);
    }
    
    // --- JSX RENDER ---
    if (!currentDate) {
        return (
            <div className="min-h-screen bg-slate-950 flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <TaskDetailModal 
                isOpen={isTaskDetailModalOpen} 
                onClose={() => setIsTaskDetailModalOpen(false)} 
                task={selectedTaskDetails}
                onDelete={promptDeleteTask}
                onEdit={handleOpenEditModal}
            />
            <RescheduleConfirmModal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} onConfirm={handleConfirmReschedule} details={rescheduleDetails} />
            <AddTimeBlockModal isOpen={isTimeBlockModalOpen} onClose={() => setIsTimeBlockModalOpen(false)} onSave={handleSaveTimeBlock} selectedDateTime={selectedDateTime} />
            <TimeBlockDetailModal isOpen={isTimeBlockDetailModalOpen} onClose={() => setIsTimeBlockDetailModalOpen(false)} onDelete={handleDeleteTimeBlock} block={selectedTimeBlock} />
            <DeleteTaskConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                taskTitle={taskToDelete?.title || null}
            />
            <EditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveEditedTask}
                currentTitle={editingTask?.title || ''}
                currentEffort={editingTask?.effort_units || 50}
                currentDate={editingTask?.scheduled_date || ''}
            />

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="min-h-screen bg-slate-950 flex">
                    <Sidebar />
                    <div className="flex-1 lg:ml-60 p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
                        <div className="flex-grow flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h1 className="text-2xl font-bold text-slate-100">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h1>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
                                        <button onClick={() => setView('month')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'month' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Month</button>
                                        <button onClick={() => setView('week')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'week' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>Week</button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handlePrev} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300"><ChevronLeft size={20} /></button>
                                        <button onClick={handleNext} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300"><ChevronRight size={20} /></button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-grow bg-slate-800/50 border border-slate-700 rounded-2xl p-4 overflow-auto">
                                {loading ? (
                                    <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div></div>
                                ) : view === 'month' ? (
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {daysOfWeek.map(day => <div key={day} className="text-xs font-bold text-slate-400 uppercase pb-2">{day}</div>)}
                                        
                                        {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="border-t border-slate-700"></div>)}
                                        
                                        {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, day) => {
                                            const dayNumber = day + 1;
                                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                                            const dateStr = date.toISOString().split('T')[0];
                                            const tasksForDay = tasks[dateStr] || [];
                                            const isToday = date.toDateString() === new Date().toDateString();

                                            return (
                                                <div key={dayNumber} className="border-t border-slate-700 pt-2 h-24 sm:h-32 overflow-hidden cursor-pointer hover:bg-slate-700/50 transition-colors">
                                                    <span className={`text-sm ${isToday ? 'bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : 'text-slate-200'}`}>{dayNumber}</span>
                                                    <div className="mt-1 space-y-1 text-left px-1">
                                                        {tasksForDay.slice(0, 2).map(task => (
                                                            <div key={task.task_id} className="text-xs p-1 rounded truncate" style={{backgroundColor: `${task.chapters?.subjects?.color || '#4f46e5'}40`, color: task.chapters?.subjects?.color || '#c4b5fd'}}>
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
                                        onTaskClick={handleTaskClick} 
                                        onTimeBlockClick={handleTimeBlockClick}
                                        onTimeSlotClick={handleTimeSlotClick}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="w-full lg:max-w-sm lg:flex-shrink-0 h-[50vh] lg:h-auto">
                            <UnscheduledTasks 
                                tasks={unscheduledTasks}
                                onSchedule={handleAutoSchedule}
                                onTaskAdded={fetchData}
                                isScheduling={isScheduling}
                                scheduleMessage={scheduleMessage}
                            />
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <div style={{...styles.task, backgroundColor: `${activeTask.chapters?.subjects?.color || '#6366f1'}CC`, borderLeft: `2px solid ${activeTask.chapters?.subjects?.color || '#6366f1'}`}} className="p-1 text-xs rounded-md shadow-lg">
                            {activeTask.title}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </>
    )
}

const styles: { [key: string]: React.CSSProperties } = {
    sleep: { backgroundColor: 'rgba(51, 65, 85, 0.5)', zIndex: 1, pointerEvents: 'none', boxSizing: 'border-box' },
    meal: { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderLeft: '2px solid #a78bfa', zIndex: 1, padding: '2px 4px', fontSize: '12px', color: '#c4b5fd', overflow: 'hidden', pointerEvents: 'none', boxSizing: 'border-box' },
    appointment: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderLeft: '2px solid #4ade80', zIndex: 2, padding: '2px 4px', fontSize: '12px', color: '#86efac', overflow: 'hidden', borderRadius: '4px', cursor: 'pointer', boxSizing: 'border-box' },
    task: { zIndex: 3, padding: '2px 4px', fontSize: '12px', color: 'white', overflow: 'hidden', borderRadius: '4px', cursor: 'grab', boxSizing: 'border-box' }
};

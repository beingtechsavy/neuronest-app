'use client'

import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// --- INTERFACE DEFINITIONS ---
interface CalendarTask { task_id: number; title: string; scheduled_date: string; start_time: string | null; end_time: string | null; effort_units: number | null; chapters: { subjects: { title: string; color: string; } | null; } | null; }
interface TimeBlock { block_id: number; title: string; start_time: string; end_time: string; }
interface UserPreferences { sleep_start: string; sleep_end: string; meal_start_times: string[]; meal_duration: number; session_length: number; buffer_length: number;}

interface WeeklyViewProps {
    currentDate: Date;
    preferences: UserPreferences | null;
    timeBlocks: TimeBlock[];
    tasks: Record<string, CalendarTask[]>;
    onTaskClick: (task: CalendarTask, startTime: Date, endTime: Date) => void;
    onTimeBlockClick: (block: TimeBlock) => void;
    onTimeSlotClick: (date: Date, hour: number) => void;
}

// --- HELPER FUNCTIONS & CONSTANTS ---
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeSlots = Array.from({ length: 24 }, (_, i) => i);

const timeToMinutes = (time: string | Date): number => {
    if (typeof time === 'string') {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    return time.getHours() * 60 + time.getMinutes();
}

// --- DraggableTask Component ---
function DraggableTask({ task, style, onClick }: { task: CalendarTask, style: React.CSSProperties, onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.task_id,
        data: { task },
    });

    const draggableStyle = {
        ...style,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };
    
    const startMinutes = timeToMinutes(new Date(task.start_time!));
    const endMinutes = timeToMinutes(new Date(task.end_time!));
    const gridStart = Math.floor(startMinutes / 15) + 1;
    const gridEnd = Math.ceil(endMinutes / 15) + 1;

    return (
        <div
            ref={setNodeRef}
            style={{ ...draggableStyle, gridRowStart: gridStart, gridRowEnd: gridEnd }}
            {...listeners}
            {...attributes}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            {task.title}
        </div>
    );
}

// --- StaticBlock Component ---
const StaticBlock = ({ block, style, onClick }: { block: any, style: React.CSSProperties, onClick?: (e: React.MouseEvent) => void }) => {
    const startMinutes = timeToMinutes(new Date(block.start_time));
    const endMinutes = timeToMinutes(new Date(block.end_time));
    const gridStart = Math.floor(startMinutes / 15) + 1;
    const gridEnd = Math.ceil(endMinutes / 15) + 1;

    return (
        <div
            style={{ ...style, gridRowStart: gridStart, gridRowEnd: gridEnd }}
            onClick={onClick}
        >
            {block.title}
        </div>
    );
};

// --- Main WeeklyView Component ---
export default function WeeklyView({ currentDate, preferences, timeBlocks, tasks, onTaskClick, onTimeBlockClick }: WeeklyViewProps) {
    // ***** REVERTED: Use local time methods for date calculations *****
    const startOfWeek = new Date(currentDate);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    return (
        <div className="grid h-full" style={{ gridTemplateColumns: '3.5rem 1fr', gridTemplateRows: 'auto 1fr' }}>
            {/* Day Headers */}
            <div className="col-start-2 grid grid-cols-7 sticky top-0 z-20 bg-slate-800/50 backdrop-blur-sm">
                {weekDays.map((day, index) => (
                    <div key={index} className="text-center py-2 border-b border-l border-slate-700">
                        <p className="text-slate-400 text-xs">{daysOfWeek[day.getDay()]}</p>
                        <p className="text-white text-lg font-semibold">{day.getDate()}</p>
                    </div>
                ))}
            </div>

            {/* Time Gutter */}
            <div className="row-start-2 text-right pr-2">
                {timeSlots.map(hour => (
                    <div key={hour} className="h-16 relative border-t border-transparent">
                        <span className="text-xs text-slate-400 absolute -top-2 right-2">{`${hour}:00`}</span>
                    </div>
                ))}
            </div>
            
            {/* Main Grid Content */}
            <div className="row-start-2 col-start-2 grid grid-cols-7">
                {weekDays.map((day) => {
                    const { setNodeRef, isOver } = useDroppable({
                        id: day.toISOString(),
                    });

                    const dayColumnStyle = {
                        backgroundColor: isOver ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                        transition: 'background-color 0.2s ease-in-out',
                    };

                    return (
                        <div 
                            ref={setNodeRef}
                            key={day.toISOString()} 
                            className="relative border-l border-slate-700 grid" 
                            style={{...dayColumnStyle, gridTemplateRows: 'repeat(96, 1fr)'}}
                        >
                            {/* Render static blocks (sleep, meals) */}
                            {preferences && (() => {
                                const blocks = [];
                                const sleepStart = timeToMinutes(preferences.sleep_start);
                                const sleepEnd = timeToMinutes(preferences.sleep_end);

                                if (sleepStart > sleepEnd) {
                                    const d1_start = new Date(day); d1_start.setHours(Math.floor(sleepStart / 60), sleepStart % 60, 0, 0);
                                    const d1_end = new Date(day); d1_end.setHours(23, 59, 59, 999);
                                    blocks.push({ title: 'Sleep', start_time: d1_start.toISOString(), end_time: d1_end.toISOString(), type: 'sleep' });

                                    const d2_start = new Date(day); d2_start.setHours(0, 0, 0, 0);
                                    const d2_end = new Date(day); d2_end.setHours(Math.floor(sleepEnd / 60), sleepEnd % 60, 0, 0);
                                    blocks.push({ title: 'Sleep', start_time: d2_start.toISOString(), end_time: d2_end.toISOString(), type: 'sleep' });
                                } else {
                                    const start = new Date(day); start.setHours(Math.floor(sleepStart / 60), sleepStart % 60, 0, 0);
                                    const end = new Date(day); end.setHours(Math.floor(sleepEnd / 60), sleepEnd % 60, 0, 0);
                                    blocks.push({ title: 'Sleep', start_time: start.toISOString(), end_time: end.toISOString(), type: 'sleep' });
                                }

                                preferences.meal_start_times.forEach(t => {
                                    const startMin = timeToMinutes(t);
                                    const endMin = startMin + preferences.meal_duration;
                                    const start = new Date(day); start.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
                                    const end = new Date(day); end.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
                                    blocks.push({ title: 'Meal', start_time: start.toISOString(), end_time: end.toISOString(), type: 'meal' });
                                });

                                return blocks.map((b, i) => <StaticBlock key={`pref-${i}`} block={b} style={styles[b.type]} />);
                            })()}

                            {/* Render static time blocks (appointments) */}
                            {timeBlocks.filter(b => new Date(b.start_time).toDateString() === day.toDateString()).map(block => (
                                <StaticBlock 
                                    key={`block-${block.block_id}`} block={block} style={styles.appointment}
                                    onClick={(e) => { e.stopPropagation(); onTimeBlockClick(block); }}
                                />
                            ))}

                            {/* Render DRAGGABLE tasks */}
                            {(tasks[day.toISOString().split('T')[0]] || []).filter(t => t.start_time && t.end_time).map(task => (
                                <DraggableTask 
                                    key={`task-${task.task_id}`}
                                    task={task}
                                    style={{...styles.task, backgroundColor: `${task.chapters?.subjects?.color || '#6366f1'}30`, borderLeft: `2px solid ${task.chapters?.subjects?.color || '#6366f1'}`}}
                                    onClick={() => onTaskClick(task, new Date(task.start_time!), new Date(task.end_time!))}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Styles for calendar items
const styles: {[key: string]: any} = {
    sleep: { backgroundColor: 'rgba(51, 65, 85, 0.5)', zIndex: 1, pointerEvents: 'none', boxSizing: 'border-box' },
    meal: { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderLeft: '2px solid #a78bfa', zIndex: 1, padding: '2px 4px', fontSize: '12px', color: '#c4b5fd', overflow: 'hidden', pointerEvents: 'none', boxSizing: 'border-box' },
    appointment: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderLeft: '2px solid #4ade80', zIndex: 2, padding: '2px 4px', fontSize: '12px', color: '#86efac', overflow: 'hidden', borderRadius: '4px', cursor: 'pointer', boxSizing: 'border-box' },
    task: { zIndex: 3, padding: '2px 4px', fontSize: '12px', color: 'white', overflow: 'hidden', borderRadius: '4px', cursor: 'grab', boxSizing: 'border-box' }
};

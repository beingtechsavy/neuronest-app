'use client';

import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CalendarTask, TimeBlock, UserPreferences } from '../app/calendar/page';

interface WeeklyViewProps {
  currentDate: Date;
  preferences: UserPreferences | null;
  timeBlocks: TimeBlock[];
  tasks: Record<string, CalendarTask[]>;
  onTaskClick: (task: CalendarTask, startTime: Date, endTime: Date) => void;
  onTimeBlockClick: (block: TimeBlock) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = Array.from({ length: 24 }, (_, i) => i);

function robustTimeToMinutes(dt: Date): number {
  const min = dt.getUTCHours() * 60 + dt.getUTCMinutes();
  return isNaN(min) ? 0 : min;
}

// Helper function to parse time strings like "08:00:00" to minutes
function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
}
// FIXED: Use local date string to match calendar scheduling
const getLocalDateString = (date: Date): string => {
  try {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * Calendar blocks are positioned by grid row, so placement stays inline; only
 * their visual treatment lives here. Sleep and meals are "protected time" and
 * read as recessed, appointments read as success-green, and tasks take their
 * project colour inline.
 */
const BLOCK_CLASS: Record<string, string> = {
  sleep: 'z-[1] pointer-events-none overflow-hidden bg-[#2B2D31]',
  meal: 'z-[1] pointer-events-none overflow-hidden border-l-2 border-[#E8A33D] bg-[#E8A33D]/20 px-1 py-0.5 text-xs text-[#F0B232]',
  appointment: 'z-[2] cursor-pointer overflow-hidden rounded-lg border-l-2 border-[#23A55A] bg-[#23A55A]/20 px-1 py-0.5 text-xs text-[#6EE7A8]',
  task: 'px-1 py-0.5 text-xs',
};

function DraggableTask({ task, style, className, onClick, onContextMenu }: { task: CalendarTask; style: React.CSSProperties; className?: string; onClick: () => void; onContextMenu?: (e: React.MouseEvent) => void; }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.task_id,
    data: { task },
  });

  let start = 1, end = 2;
  if (task.start_time && task.end_time) {
    try {
      // Parse time strings like "08:00:00" directly to minutes
      const startMinutes = timeStringToMinutes(task.start_time);
      const endMinutes = timeStringToMinutes(task.end_time);
      start = Math.max(1, Math.floor(startMinutes / 15) + 1);
      end = Math.max(start + 1, Math.ceil(endMinutes / 15) + 1);
    } catch { start = 1; end = 2; }
  }

  const draggableStyle: React.CSSProperties = {
    ...style,
    gridRowStart: start,
    gridRowEnd: end,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 0 : 10,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={draggableStyle} className={className} {...listeners} {...attributes} onClick={e => { e.stopPropagation(); onClick(); }} onContextMenu={onContextMenu}>
      {task.title}
    </div>
  );
}

interface BlockData { title: string; start_time: string; end_time: string; type?: string; }

const StaticBlock = ({ block, className, onClick }: { block: BlockData; className: string; onClick?: (e: React.MouseEvent) => void; }) => {
  let gridStart = 1, gridEnd = 2;
  try {
    // TimeBlocks still use full timestamps, so parse them normally
    const startMinutes = robustTimeToMinutes(new Date(block.start_time));
    const endMinutes = robustTimeToMinutes(new Date(block.end_time));
    gridStart = Math.max(1, Math.floor(startMinutes / 15) + 1);
    gridEnd = Math.max(gridStart + 1, Math.ceil(endMinutes / 15) + 1);
  } catch { }
  return <div className={className} style={{ gridRowStart: gridStart, gridRowEnd: gridEnd }} onClick={onClick}>{block.title}</div>;
};

function DayColumn({ day, preferences, timeBlocks, tasks, onTaskClick, onTimeBlockClick }: { day: Date; preferences: UserPreferences | null; timeBlocks: TimeBlock[]; tasks: Record<string, CalendarTask[]>; onTaskClick: (task: CalendarTask, startTime: Date, endTime: Date) => void; onTimeBlockClick: (block: TimeBlock) => void; }) {
  const dateKey = getLocalDateString(day);
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });
  return (
    <div
      ref={setNodeRef}
      // Transition lives in the class, not the style object, so
      // `motion-reduce` can switch it off.
      className="relative grid border-l border-[#383A40] transition-colors motion-reduce:transition-none"
      style={{
        backgroundColor: isOver ? 'rgba(20, 184, 166, 0.10)' : 'transparent',
        gridTemplateRows: 'repeat(96, 1fr)',
      }}
    >
      {preferences && (() => {
        const blocks: BlockData[] = [];
        const year = day.getUTCFullYear();
        const month = day.getUTCMonth();
        const date = day.getUTCDate();

        const sleepStart = robustTimeToMinutes(new Date(`1970-01-01T${preferences.sleep_start || '00:00'}Z`));
        const sleepEnd = robustTimeToMinutes(new Date(`1970-01-01T${preferences.sleep_end || '00:00'}Z`));

        if (sleepStart > sleepEnd) {
          const d1_start = new Date(Date.UTC(year, month, date, Math.floor(sleepStart / 60), sleepStart % 60));
          const d1_end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999));
          blocks.push({ title: 'Sleep', start_time: d1_start.toISOString(), end_time: d1_end.toISOString(), type: 'sleep' });
          const d2_start = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
          const d2_end = new Date(Date.UTC(year, month, date, Math.floor(sleepEnd / 60), sleepEnd % 60));
          blocks.push({ title: 'Sleep', start_time: d2_start.toISOString(), end_time: d2_end.toISOString(), type: 'sleep' });
        } else {
          const start = new Date(Date.UTC(year, month, date, Math.floor(sleepStart / 60), sleepStart % 60));
          const end = new Date(Date.UTC(year, month, date, Math.floor(sleepEnd / 60), sleepEnd % 60));
          blocks.push({ title: 'Sleep', start_time: start.toISOString(), end_time: end.toISOString(), type: 'sleep' });
        }

        preferences.meal_start_times.forEach(t => {
          const startMin = robustTimeToMinutes(new Date(`1970-01-01T${t || '00:00'}Z`));
          const endMin = startMin + preferences.meal_duration;
          const start = new Date(Date.UTC(year, month, date, Math.floor(startMin / 60), startMin % 60));
          const end = new Date(Date.UTC(year, month, date, Math.floor(endMin / 60), endMin % 60));
          blocks.push({ title: 'Meal', start_time: start.toISOString(), end_time: end.toISOString(), type: 'meal' });
        });

        return blocks.map((b, i) => (
          <StaticBlock key={`pref-${i}`} block={b} className={BLOCK_CLASS[b.type || 'task']} />
        ));
      })()}

      {timeBlocks.filter(b => new Date(b.start_time).toISOString().startsWith(dateKey)).map(block => (
        <StaticBlock
          key={`block-${block.block_id}`}
          block={block}
          className={BLOCK_CLASS.appointment}
          onClick={e => {
            e.stopPropagation();
            onTimeBlockClick(block);
          }}
        />
      ))}

      {(tasks[dateKey] || [])
        .filter(t => t.start_time && t.end_time)
        .map(task => (
          <DraggableTask
            key={`task-${task.task_id}`}
            task={task}
            className="cursor-grab overflow-hidden rounded-lg border-l-2 px-1 py-0.5 text-xs text-[#F2F3F5]"
            style={{
              backgroundColor: `${task.chapters?.subjects?.color || '#14B8A6'}30`,
              borderLeftColor: task.chapters?.subjects?.color || '#14B8A6',
            }}
            onClick={() => {
              // Create proper Date objects from scheduled_date + time (no Z for local time)
              const startDate = new Date(`${task.scheduled_date}T${task.start_time}`);
              const endDate = new Date(`${task.scheduled_date}T${task.end_time}`);
              onTaskClick(task, startDate, endDate);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              // Right-click opens task detail modal for quick editing
              const startDate = new Date(`${task.scheduled_date}T${task.start_time}`);
              const endDate = new Date(`${task.scheduled_date}T${task.end_time}`);
              onTaskClick(task, startDate, endDate);
            }}
          />
        ))}
    </div>
  );
}

function NavEdge({ id, position }: { id: string; position: 'left' | 'right' }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isLeft = position === 'left';

  return (
    <div
      ref={setNodeRef}
      className={`absolute top-0 bottom-0 ${position}-0 z-20 w-10 transition-colors duration-200 ${isOver
          ? 'border-2 border-dashed border-[#2DD4BF] bg-[#14B8A6]/20'
          : 'hover:bg-[#14B8A6]/10'
        }`}
    >
      {isOver && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'left-2' : 'right-2'} text-xs font-semibold text-[#5EEAD4]`}>
          <div className="flex flex-col items-center">
            <span className="text-base">{isLeft ? '←' : '→'}</span>
            <span className="text-[10px]">{isLeft ? 'Prev' : 'Next'}</span>
            <span className="text-[10px]">week</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WeeklyView({
  currentDate,
  preferences,
  timeBlocks,
  tasks,
  onTaskClick,
  onTimeBlockClick,
}: WeeklyViewProps) {
  // FIXED: Show proper week containing the current date
  // Calculate the start of the week (Sunday) for the given currentDate
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Go back to Sunday

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i); // Use local date methods
    return day;
  });

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: '3.5rem 1fr', gridTemplateRows: 'auto 1fr' }}>
      {/* Opaque header rather than a translucent blurred one: content scrolls
          under this, and blur smeared task titles into a grey wash. */}
      <div className="sticky top-0 z-20 col-start-2 grid grid-cols-7 border-b border-[#383A40] bg-[#2B2D31]">
        {weekDays.map((day, index) => (
          <div key={index} className="border-l border-[#383A40] py-2 text-center">
            <p className="text-xs font-medium text-[#949BA4]">{daysOfWeek[day.getDay()]}</p>
            <p className="text-base font-bold tabular-nums text-[#F2F3F5]">{day.getDate()}</p>
          </div>
        ))}
      </div>
      <div className="row-start-2 pr-2 text-right">
        {timeSlots.map(hour => (
          <div key={hour} className="relative h-16 border-t border-transparent">
            <span className="absolute -top-2 right-2 text-xs text-[#949BA4]">{`${hour}:00`}</span>
          </div>
        ))}
      </div>
      <div className="relative row-start-2 col-start-2 grid grid-cols-7">
        {weekDays.map(day => (<DayColumn key={getLocalDateString(day)} day={day} preferences={preferences} timeBlocks={timeBlocks} tasks={tasks} onTaskClick={onTaskClick} onTimeBlockClick={onTimeBlockClick} />))}
        <NavEdge id="navigate-prev" position="left" />
        <NavEdge id="navigate-next" position="right" />

        <p className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg border border-[#383A40] bg-[#2B2D31] px-3 py-2 text-xs text-[#949BA4]">
          Drag a task to the left or right edge to move it to another week.
        </p>
      </div>
    </div>
  );
}

// 'use client';

// import React from 'react';
// import { useDraggable, useDroppable } from '@dnd-kit/core';
// import { CalendarTask, TimeBlock, UserPreferences } from '../app/calendar/page';

// interface WeeklyViewProps {
//   currentDate: Date;
//   preferences: UserPreferences | null;
//   timeBlocks: TimeBlock[];
//   tasks: Record<string, CalendarTask[]>;
//   onTaskClick: (task: CalendarTask, startTime: Date, endTime: Date) => void;
//   onTimeBlockClick: (block: TimeBlock) => void;
//   onTimeSlotClick: (date: Date, hour: number) => void;
// }

// const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// const timeSlots = Array.from({ length: 24 }, (_, i) => i);

// function robustTimeToMinutes(dt: Date): number {
//   const min = dt.getUTCHours() * 60 + dt.getUTCMinutes();
//   return isNaN(min) ? 0 : min;
// }
// const toUTC_YYYYMMDD = (date: Date): string => {
//   const year = date.getUTCFullYear();
//   const month = String(date.getUTCMonth() + 1).padStart(2, '0');
//   const day = String(date.getUTCDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// };

// function DraggableTask({ task, style, onClick }: { task: CalendarTask; style: React.CSSProperties; onClick: () => void; }) {
//   const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
//     id: task.task_id,
//     data: { task },
//   });

//   let start = 1, end = 2;
//   if (task.start_time && task.end_time) {
//     try {
//       const dtStart = new Date(task.start_time);
//       const dtEnd = new Date(task.end_time);
//       start = Math.max(1, Math.floor(robustTimeToMinutes(dtStart) / 15) + 1);
//       end = Math.max(start + 1, Math.ceil(robustTimeToMinutes(dtEnd) / 15) + 1);
//     } catch { start = 1; end = 2; }
//   }

//   const draggableStyle: React.CSSProperties = {
//     ...style,
//     gridRowStart: start,
//     gridRowEnd: end,
//     opacity: isDragging ? 0 : 1,
//     zIndex: isDragging ? 0 : 10,
//     cursor: 'grab',
//   };

//   return (
//     <div ref={setNodeRef} style={draggableStyle} {...listeners} {...attributes} onClick={e => { e.stopPropagation(); onClick(); }}>
//       {task.title}
//     </div>
//   );
// }

// interface BlockData { title: string; start_time: string; end_time: string; type?: string; }

// const StaticBlock = ({ block, style, onClick }: { block: BlockData; style: React.CSSProperties; onClick?: (e: React.MouseEvent) => void; }) => {
//   let gridStart = 1, gridEnd = 2;
//   try {
//     const startMinutes = robustTimeToMinutes(new Date(block.start_time));
//     const endMinutes = robustTimeToMinutes(new Date(block.end_time));
//     gridStart = Math.max(1, Math.floor(startMinutes / 15) + 1);
//     gridEnd = Math.max(gridStart + 1, Math.ceil(endMinutes / 15) + 1);
//   } catch {}
//   return ( <div style={{ ...style, gridRowStart: gridStart, gridRowEnd: gridEnd }} onClick={onClick}>{block.title}</div> );
// };

// function DayColumn({ day, preferences, timeBlocks, tasks, onTaskClick, onTimeBlockClick }: { day: Date; preferences: UserPreferences | null; timeBlocks: TimeBlock[]; tasks: Record<string, CalendarTask[]>; onTaskClick: (task: CalendarTask, startTime: Date, endTime: Date) => void; onTimeBlockClick: (block: TimeBlock) => void; }) {
//   const { setNodeRef, isOver } = useDroppable({ id: day.toISOString(), });
//   const dayColumnStyle = { backgroundColor: isOver ? 'rgba(79, 70, 229, 0.13)' : 'transparent', transition: 'background-color 0.2s ease-in-out', };
//   const dateKey = toUTC_YYYYMMDD(day);

//   return (
//     <div ref={setNodeRef} key={day.toISOString()} className="relative border-l border-slate-700 grid" style={{ ...dayColumnStyle, gridTemplateRows: 'repeat(96, 1fr)' }}>
//        {preferences && (() => {
//         const blocks: BlockData[] = [];
//         const year = day.getUTCFullYear();
//         const month = day.getUTCMonth();
//         const date = day.getUTCDate();

//         const sleepStart = robustTimeToMinutes(new Date(`1970-01-01T${preferences.sleep_start || '00:00'}Z`));
//         const sleepEnd = robustTimeToMinutes(new Date(`1970-01-01T${preferences.sleep_end || '00:00'}Z`));

//         if (sleepStart > sleepEnd) {
//           const d1_start = new Date(Date.UTC(year, month, date, Math.floor(sleepStart / 60), sleepStart % 60));
//           const d1_end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999));
//           blocks.push({ title: 'Sleep', start_time: d1_start.toISOString(), end_time: d1_end.toISOString(), type: 'sleep' });
//           const d2_start = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
//           const d2_end = new Date(Date.UTC(year, month, date, Math.floor(sleepEnd / 60), sleepEnd % 60));
//           blocks.push({ title: 'Sleep', start_time: d2_start.toISOString(), end_time: d2_end.toISOString(), type: 'sleep' });
//         } else {
//           const start = new Date(Date.UTC(year, month, date, Math.floor(sleepStart / 60), sleepStart % 60));
//           const end = new Date(Date.UTC(year, month, date, Math.floor(sleepEnd / 60), sleepEnd % 60));
//           blocks.push({ title: 'Sleep', start_time: start.toISOString(), end_time: end.toISOString(), type: 'sleep' });
//         }

//         preferences.meal_start_times.forEach(t => {
//           const startMin = robustTimeToMinutes(new Date(`1970-01-01T${t || '00:00'}Z`));
//           const endMin = startMin + preferences.meal_duration;
//           const start = new Date(Date.UTC(year, month, date, Math.floor(startMin / 60), startMin % 60));
//           const end = new Date(Date.UTC(year, month, date, Math.floor(endMin / 60), endMin % 60));
//           blocks.push({ title: 'Meal', start_time: start.toISOString(), end_time: end.toISOString(), type: 'meal' });
//         });

//         return blocks.map((b, i) => (
//           <StaticBlock key={`pref-${i}`} block={b} style={styles[b.type || 'task']} />
//         ));
//       })()}

//       {timeBlocks.filter(b => new Date(b.start_time).toISOString().startsWith(dateKey)).map(block => (
//         <StaticBlock
//           key={`block-${block.block_id}`}
//           block={block}
//           style={styles.appointment}
//           onClick={e => {
//             e.stopPropagation();
//             onTimeBlockClick(block);
//           }}
//         />
//       ))}

//       {(tasks[dateKey] || [])
//         .filter(t => t.start_time && t.end_time)
//         .map(task => (
//           <DraggableTask
//             key={`task-${task.task_id}`}
//             task={task}
//             style={{
//               ...styles.task,
//               backgroundColor: `${task.chapters?.subjects?.color || '#6366f1'}30`,
//               borderLeft: `2px solid ${task.chapters?.subjects?.color || '#6366f1'}`,
//             }}
//             onClick={() => onTaskClick(task, new Date(task.start_time!), new Date(task.end_time!))}
//           />
//         ))}
//     </div>
//   );
// }

// function NavEdge({ id, position }: { id: string; position: 'left' | 'right' }) {
//   const { setNodeRef } = useDroppable({ id });
//   return (
//     <div
//       ref={setNodeRef}
//       style={{
//         position: 'absolute',
//         top: 0,
//         bottom: 0,
//         [position]: 0,
//         width: '40px',
//         zIndex: 20,
//       }}
//     />
//   );
// }

// export default function WeeklyView({
//   currentDate,
//   preferences,
//   timeBlocks,
//   tasks,
//   onTaskClick,
//   onTimeBlockClick,
// }: WeeklyViewProps) {
//   const baseDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() - currentDate.getUTCDay()));
//   const weekDays = Array.from({ length: 7 }).map((_, i) => { const d = new Date(baseDate); d.setUTCDate(baseDate.getUTCDate() + i); return d; });

//   return (
//     <div className="grid h-full" style={{ gridTemplateColumns: '3.5rem 1fr', gridTemplateRows: 'auto 1fr' }}>
//       <div className="col-start-2 grid grid-cols-7 sticky top-0 z-20 bg-slate-800/50 backdrop-blur-sm">
//         {weekDays.map((day, index) => (
//           <div key={index} className="text-center py-2 border-b border-l border-slate-700">
//             <p className="text-slate-400 text-xs">{daysOfWeek[day.getUTCDay()]}</p>
//             <p className="text-white text-lg font-semibold">{day.getUTCDate()}</p>
//           </div>
//         ))}
//       </div>
//       <div className="row-start-2 text-right pr-2">
//         {timeSlots.map(hour => (
//           <div key={hour} className="h-16 relative border-t border-transparent">
//             <span className="text-xs text-slate-400 absolute -top-2 right-2">{`${hour}:00`}</span>
//           </div>
//         ))}
//       </div>
//       <div className="row-start-2 col-start-2 grid grid-cols-7 relative">
//         {weekDays.map(day => ( <DayColumn key={day.toISOString()} day={day} preferences={preferences} timeBlocks={timeBlocks} tasks={tasks} onTaskClick={onTaskClick} onTimeBlockClick={onTimeBlockClick} /> ))}
//         <NavEdge id="navigate-prev" position="left" />
//         <NavEdge id="navigate-next" position="right" />
//       </div>
//     </div>
//   );
// }

// const styles: { [key: string]: React.CSSProperties } = {
//   sleep: { backgroundColor: 'rgba(51, 65, 85, 0.5)', zIndex: 1, pointerEvents: 'none', boxSizing: 'border-box' },
//   meal: { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderLeft: '2px solid #a78bfa', zIndex: 1, padding: '2px 4px', fontSize: '12px', color: '#c4b5fd', overflow: 'hidden', pointerEvents: 'none', boxSizing: 'border-box' },
//   appointment: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderLeft: '2px solid #4ade80', zIndex: 2, padding: '2px 4px', fontSize: '12px', color: '#86efac', overflow: 'hidden', borderRadius: '4px', cursor: 'pointer', boxSizing: 'border-box' },
//   task: { zIndex: 3, padding: '2px 4px', fontSize: '12px', color: 'white', overflow: 'hidden', borderRadius: '4px', cursor: 'grab', boxSizing: 'border-box' }
// };


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

function DraggableTask({ task, style, onClick, onContextMenu }: { task: CalendarTask; style: React.CSSProperties; onClick: () => void; onContextMenu?: (e: React.MouseEvent) => void; }) {
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
    <div ref={setNodeRef} style={draggableStyle} {...listeners} {...attributes} onClick={e => { e.stopPropagation(); onClick(); }} onContextMenu={onContextMenu}>
      {task.title}
    </div>
  );
}

interface BlockData { title: string; start_time: string; end_time: string; type?: string; }

const StaticBlock = ({ block, style, onClick }: { block: BlockData; style: React.CSSProperties; onClick?: (e: React.MouseEvent) => void; }) => {
  let gridStart = 1, gridEnd = 2;
  try {
    // TimeBlocks still use full timestamps, so parse them normally
    const startMinutes = robustTimeToMinutes(new Date(block.start_time));
    const endMinutes = robustTimeToMinutes(new Date(block.end_time));
    gridStart = Math.max(1, Math.floor(startMinutes / 15) + 1);
    gridEnd = Math.max(gridStart + 1, Math.ceil(endMinutes / 15) + 1);
  } catch { }
  return (<div style={{ ...style, gridRowStart: gridStart, gridRowEnd: gridEnd }} onClick={onClick}>{block.title}</div>);
};

function DayColumn({ day, preferences, timeBlocks, tasks, onTaskClick, onTimeBlockClick }: { day: Date; preferences: UserPreferences | null; timeBlocks: TimeBlock[]; tasks: Record<string, CalendarTask[]>; onTaskClick: (task: CalendarTask, startTime: Date, endTime: Date) => void; onTimeBlockClick: (block: TimeBlock) => void; }) {
  const dateKey = getLocalDateString(day);
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });
  const dayColumnStyle = { backgroundColor: isOver ? 'rgba(79, 70, 229, 0.13)' : 'transparent', transition: 'background-color 0.2s ease-in-out', };

  // DEBUG: Log task data for today
  const tasksForDay = tasks[dateKey] || [];
  const filteredTasks = tasksForDay.filter(t => t.start_time && t.end_time);

  if (dateKey === '2025-12-15') { // Today's date
    console.log('🔍 DEBUG WeeklyView - Today:', {
      dateKey,
      tasksForDay: tasksForDay.length,
      filteredTasks: filteredTasks.length,
      tasks: filteredTasks.map(t => ({
        title: t.title,
        start_time: t.start_time,
        end_time: t.end_time,
        scheduled_date: t.scheduled_date
      }))
    });
  }

  return (
    <div ref={setNodeRef} key={dateKey} className="relative border-l border-slate-700 grid" style={{ ...dayColumnStyle, gridTemplateRows: 'repeat(96, 1fr)' }}>
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
          <StaticBlock key={`pref-${i}`} block={b} style={styles[b.type || 'task']} />
        ));
      })()}

      {timeBlocks.filter(b => new Date(b.start_time).toISOString().startsWith(dateKey)).map(block => (
        <StaticBlock
          key={`block-${block.block_id}`}
          block={block}
          style={styles.appointment}
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
            style={{
              ...styles.task,
              backgroundColor: `${task.chapters?.subjects?.color || '#6366f1'}30`,
              borderLeft: `2px solid ${task.chapters?.subjects?.color || '#6366f1'}`,
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
      className={`absolute top-0 bottom-0 ${position}-0 w-10 z-20 transition-all duration-200 ${isOver
          ? 'bg-purple-500/20 border-2 border-purple-400 border-dashed'
          : 'hover:bg-purple-500/10'
        }`}
      style={{
        background: isOver
          ? 'linear-gradient(90deg, rgba(147, 51, 234, 0.2) 0%, transparent 100%)'
          : undefined
      }}
    >
      {isOver && (
        <div className={`absolute top-1/2 transform -translate-y-1/2 ${isLeft ? 'left-2' : 'right-2'
          } text-purple-300 text-xs font-semibold`}>
          <div className="flex flex-col items-center">
            <span>{isLeft ? '←' : '→'}</span>
            <span className="text-[10px]">
              {isLeft ? 'Prev' : 'Next'}
            </span>
            <span className="text-[10px]">Week</span>
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
  // DEBUG: Log tasks prop
  console.log('🔍 DEBUG WeeklyView - Tasks prop:', {
    totalTaskDates: Object.keys(tasks).length,
    taskDates: Object.keys(tasks),
    todayTasks: tasks['2025-12-15'] || 'No tasks for today'
  });

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
      <div className="col-start-2 grid grid-cols-7 sticky top-0 z-20 bg-slate-800/50 backdrop-blur-sm">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center py-2 border-b border-l border-slate-700">
            <p className="text-slate-400 text-xs">{daysOfWeek[day.getDay()]}</p>
            <p className="text-white text-lg font-semibold">{day.getDate()}</p>
          </div>
        ))}
      </div>
      <div className="row-start-2 text-right pr-2">
        {timeSlots.map(hour => (
          <div key={hour} className="h-16 relative border-t border-transparent">
            <span className="text-xs text-slate-400 absolute -top-2 right-2">{`${hour}:00`}</span>
          </div>
        ))}
      </div>
      <div className="row-start-2 col-start-2 grid grid-cols-7 relative">
        {weekDays.map(day => (<DayColumn key={getLocalDateString(day)} day={day} preferences={preferences} timeBlocks={timeBlocks} tasks={tasks} onTaskClick={onTaskClick} onTimeBlockClick={onTimeBlockClick} />))}
        <NavEdge id="navigate-prev" position="left" />
        <NavEdge id="navigate-next" position="right" />

        {/* Floating Week Navigator Hint */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-300 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300 z-30">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>Drag tasks to edges and right-click to move between weeks</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sleep: { backgroundColor: 'rgba(51, 65, 85, 0.5)', zIndex: 1, pointerEvents: 'none', boxSizing: 'border-box' },
  meal: { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderLeft: '2px solid #a78bfa', zIndex: 1, padding: '2px 4px', fontSize: '12px', color: '#c4b5fd', overflow: 'hidden', pointerEvents: 'none', boxSizing: 'border-box' },
  appointment: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderLeft: '2px solid #4ade80', zIndex: 2, padding: '2px 4px', fontSize: '12px', color: '#86efac', overflow: 'hidden', borderRadius: '4px', cursor: 'pointer', boxSizing: 'border-box' },
  task: { zIndex: 3, padding: '2px 4px', fontSize: '12px', color: 'white', overflow: 'hidden', borderRadius: '4px', cursor: 'grab', boxSizing: 'border-box' }
};
